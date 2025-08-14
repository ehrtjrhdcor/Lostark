/**
 * Vercel Serverless Function - 특정 OCR 기록 상세 조회 API
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

    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    const { id } = req.query;
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

        console.log(`🔗 데이터베이스 연결 시도 중... (기록 ID: ${id})`);
        connection = await createConnection();
        console.log('✅ 데이터베이스 연결 성공');

        // 특정 기록 상세 조회
        return await getRecordById(connection, res, id);

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