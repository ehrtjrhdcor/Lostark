/**
 * Vercel Serverless Function - OCR 기록 조회 API
 * GET /api/records - 기록 목록 조회 (페이지네이션, 검색)
 * GET /api/records/[id] - 특정 기록 상세 조회
 */

const mysql = require('mysql2/promise');

/**
 * PlanetScale 데이터베이스 연결 설정
 */
function createConnection() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');
    }

    return mysql.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
}

/**
 * 쿼리 실행 함수
 */
async function executeQuery(connection, sql, params = []) {
    try {
        const [results] = await connection.execute(sql, params);
        return results;
    } catch (error) {
        console.error('쿼리 실행 오류:', error);
        throw error;
    }
}

/**
 * 메인 핸들러
 */
export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    let connection;

    try {
        // 환경변수 체크
        if (!process.env.DATABASE_URL) {
            console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다.');
            return res.status(500).json({
                success: false,
                error: 'Database configuration error',
                details: 'DATABASE_URL 환경변수가 설정되지 않았습니다.'
            });
        }

        console.log('🔗 데이터베이스 연결 시도 중...');
        connection = await createConnection();
        console.log('✅ 데이터베이스 연결 성공');

        // 테이블 존재 확인
        try {
            await executeQuery(connection, 'SELECT 1 FROM ocr_records LIMIT 1');
            console.log('✅ ocr_records 테이블 확인 완료');
        } catch (tableError) {
            console.error('❌ ocr_records 테이블이 존재하지 않습니다:', tableError.message);
            return res.status(500).json({
                success: false,
                error: 'Database table not found',
                details: 'ocr_records 테이블이 존재하지 않습니다. PlanetScale에서 테이블을 먼저 생성해주세요.'
            });
        }

        const { method, query } = req;
        const { id } = query;

        if (method !== 'GET') {
            return res.status(405).json({
                success: false,
                error: 'Method not allowed'
            });
        }

        // 특정 ID 기록 상세 조회
        if (id) {
            return await getRecordById(connection, res, id);
        }

        // 기록 목록 조회
        return await getRecordsList(connection, res, query);

    } catch (error) {
        console.error('Records API 오류:', error);
        return res.status(500).json({
            success: false,
            error: '서버 오류가 발생했습니다.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

/**
 * 기록 목록 조회 (페이지네이션, 검색, 필터링)
 */
async function getRecordsList(connection, res, query) {
    try {
        // 쿼리 파라미터 파싱
        const page = parseInt(query.page) || 1;
        const limit = Math.min(parseInt(query.limit) || 20, 100); // 최대 100개
        const offset = (page - 1) * limit;
        const character = query.character || '';
        const raid = query.raid || '';
        const sortBy = query.sortBy || 'created_at';
        const sortOrder = (query.sortOrder || 'DESC').toUpperCase();

        // 검색 조건 구성
        let whereConditions = [];
        let queryParams = [];

        if (character) {
            whereConditions.push('r.character_name LIKE ?');
            queryParams.push(`%${character}%`);
        }

        if (raid) {
            whereConditions.push('r.raid_name LIKE ?');
            queryParams.push(`%${raid}%`);
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';

        // 총 개수 조회
        const countQuery = `
            SELECT COUNT(*) as total
            FROM ocr_records r
            ${whereClause}
        `;

        const countResult = await executeQuery(connection, countQuery, queryParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit);

        // 기록 목록 조회 (서브쿼리로 스탯 개수 포함)
        const recordsQuery = `
            SELECT 
                r.no, r.id, r.character_name, r.character_class, 
                r.raid_name, r.gate_number, r.difficulty, 
                r.combat_time, r.image_url, r.created_at,
                (SELECT COUNT(*) FROM ocr_stats s WHERE s.record_id = r.id) as stats_count
            FROM ocr_records r
            ${whereClause}
            ORDER BY r.${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;

        const records = await executeQuery(connection, recordsQuery, [
            ...queryParams,
            limit,
            offset
        ]);

        console.log(`✅ 기록 목록 조회 완료: ${records.length}개 (페이지 ${page}/${totalPages})`);

        return res.status(200).json({
            success: true,
            data: {
                records,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalRecords,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('기록 목록 조회 실패:', error);
        throw error;
    }
}

/**
 * 특정 기록 상세 조회
 */
async function getRecordById(connection, res, recordId) {
    try {
        console.log(`📋 기록 상세 조회: ${recordId}`);

        // 메인 기록 정보 조회
        const recordQuery = `
            SELECT r.*, 
                   (SELECT COUNT(*) FROM ocr_stats s WHERE s.record_id = r.id) as stats_count
            FROM ocr_records r
            WHERE r.id = ?
        `;

        const recordResult = await executeQuery(connection, recordQuery, [recordId]);

        if (recordResult.length === 0) {
            return res.status(404).json({
                success: false,
                error: '기록을 찾을 수 없습니다.'
            });
        }

        const record = recordResult[0];

        // 관련 스탯 데이터 조회
        const statsQuery = `
            SELECT s.stat_name, s.stat_value, s.stat_category, s.created_at
            FROM ocr_stats s
            WHERE s.record_id = ?
            ORDER BY s.stat_category, s.stat_name
        `;

        const stats = await executeQuery(connection, statsQuery, [recordId]);

        // raw_ocr_data 파싱
        let parsedOcrData = {};
        if (record.raw_ocr_data) {
            try {
                parsedOcrData = JSON.parse(record.raw_ocr_data);
            } catch (parseError) {
                console.error('OCR 데이터 파싱 오류:', parseError);
                parsedOcrData = {};
            }
        }

        console.log(`✅ 기록 상세 조회 완료: ${record.character_name} - ${record.raid_name}`);

        return res.status(200).json({
            success: true,
            data: {
                record,
                stats,
                parsedOcrData
            }
        });

    } catch (error) {
        console.error('기록 상세 조회 실패:', error);
        throw error;
    }
}