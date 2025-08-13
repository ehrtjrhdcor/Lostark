/**
 * Vercel Serverless Function - OCR 기록 저장 API
 * POST /api/save-record - OCR 분석 결과 및 이미지 저장
 */

const mysql = require('mysql2/promise');
const cloudinary = require('cloudinary').v2;
const { IncomingForm } = require('formidable');
const fs = require('fs').promises;

// nanoid 대신 간단한 ID 생성 함수 사용
function generateId(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Cloudinary 설정
 */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

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
 * Cloudinary 이미지 업로드
 */
async function uploadToCloudinary(filePath, options = {}) {
    try {
        const defaultOptions = {
            folder: 'lostark-ocr',
            resource_type: 'image',
            quality: 'auto:good',
            transformation: [
                { width: 1920, height: 1080, crop: 'limit' }
            ]
        };

        const uploadOptions = { ...defaultOptions, ...options };
        const uploadResult = await cloudinary.uploader.upload(filePath, uploadOptions);

        console.log(`✅ Cloudinary 업로드 성공: ${uploadResult.secure_url}`);
        
        return {
            success: true,
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            width: uploadResult.width,
            height: uploadResult.height,
            bytes: uploadResult.bytes,
            format: uploadResult.format
        };

    } catch (error) {
        console.error('❌ Cloudinary 업로드 실패:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 파일 파싱 (multipart/form-data)
 */
function parseMultipartForm(req) {
    return new Promise((resolve, reject) => {
        try {
            const form = new IncomingForm({
                maxFileSize: 10 * 1024 * 1024, // 10MB
                allowEmptyFiles: false,
                minFileSize: 1,
                keepExtensions: true,
                uploadDir: '/tmp' // Vercel의 /tmp 디렉토리 사용
            });

            form.parse(req, (err, fields, files) => {
                if (err) {
                    console.error('Formidable 파싱 오류:', err);
                    reject(err);
                    return;
                }

                console.log('파싱된 필드 원본:', fields);
                console.log('파싱된 파일 원본:', files);

                // fields와 files 정규화
                const normalizedFields = {};
                const normalizedFiles = {};

                for (const [key, value] of Object.entries(fields || {})) {
                    normalizedFields[key] = Array.isArray(value) ? value[0] : value;
                }

                for (const [key, value] of Object.entries(files || {})) {
                    normalizedFiles[key] = Array.isArray(value) ? value[0] : value;
                }

                console.log('정규화된 필드:', normalizedFields);
                console.log('정규화된 파일:', normalizedFiles);

                resolve({
                    fields: normalizedFields,
                    files: normalizedFiles
                });
            });
        } catch (initError) {
            console.error('Formidable 초기화 오류:', initError);
            reject(initError);
        }
    });
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

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    let connection;

    try {
        console.log('📊 OCR 기록 저장 요청 수신...');

        // 환경변수 체크
        console.log('🔍 환경변수 체크 중...');
        if (!process.env.DATABASE_URL) {
            console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다.');
            return res.status(500).json({
                success: false,
                error: 'Database configuration error',
                details: 'DATABASE_URL 환경변수가 설정되지 않았습니다.'
            });
        }

        const cloudinaryMissing = [];
        if (!process.env.CLOUDINARY_CLOUD_NAME) cloudinaryMissing.push('CLOUDINARY_CLOUD_NAME');
        if (!process.env.CLOUDINARY_API_KEY) cloudinaryMissing.push('CLOUDINARY_API_KEY');
        if (!process.env.CLOUDINARY_API_SECRET) cloudinaryMissing.push('CLOUDINARY_API_SECRET');

        if (cloudinaryMissing.length > 0) {
            console.error('❌ Cloudinary 환경변수가 설정되지 않았습니다:', cloudinaryMissing);
            return res.status(500).json({
                success: false,
                error: 'Cloudinary configuration error',
                details: `다음 환경변수가 필요합니다: ${cloudinaryMissing.join(', ')}`
            });
        }
        console.log('✅ 환경변수 확인 완료');

        // Multipart form data 파싱
        console.log('📋 요청 파싱 시작...');
        const { fields, files } = await parseMultipartForm(req);
        console.log('파싱된 필드:', Object.keys(fields || {}));
        console.log('업로드된 파일:', Object.keys(files || {}));

        // 필수 필드 추출
        const {
            characterName,
            characterClass,
            raidName,
            gateNumber,
            difficulty,
            combatTime,
            ocrData
        } = fields;

        // 필수 필드 검증
        if (!characterName || !raidName) {
            return res.status(400).json({
                success: false,
                error: '캐릭터명과 레이드명은 필수입니다.'
            });
        }

        // OCR 데이터 파싱
        let parsedOcrData = {};
        try {
            parsedOcrData = typeof ocrData === 'string' ? JSON.parse(ocrData) : (ocrData || {});
        } catch (parseError) {
            console.error('OCR 데이터 파싱 오류:', parseError);
            parsedOcrData = {};
        }

        // 이미지 파일 처리
        let imagePath = null;
        let imagePublicId = null;
        
        if (files.image && files.image.filepath) {
            try {
                console.log(`📤 Cloudinary 업로드 시작: ${files.image.originalFilename}`);
                
                const uploadResult = await uploadToCloudinary(files.image.filepath, {
                    public_id: `lostark-ocr/${generateId(10)}`,
                    folder: 'lostark-ocr',
                    tags: [characterName, raidName, difficulty].filter(Boolean)
                });

                if (uploadResult.success) {
                    imagePath = uploadResult.url;
                    imagePublicId = uploadResult.public_id;
                    console.log(`✅ Cloudinary 업로드 성공: ${imagePath}`);
                    
                    // 임시 파일 삭제
                    try {
                        await fs.unlink(files.image.filepath);
                        console.log(`🗑️ 임시 파일 삭제: ${files.image.filepath}`);
                    } catch (unlinkError) {
                        console.warn('임시 파일 삭제 실패:', unlinkError.message);
                    }
                } else {
                    throw new Error(uploadResult.error);
                }
                
            } catch (uploadError) {
                console.error('❌ Cloudinary 업로드 실패:', uploadError);
                return res.status(500).json({
                    success: false,
                    error: '이미지 업로드에 실패했습니다.',
                    details: uploadError.message
                });
            }
        }

        // 데이터베이스 저장
        connection = await createConnection();
        await connection.beginTransaction();

        try {
            // 1. 메인 레코드 저장
            const recordId = generateId(10);
            const insertRecordQuery = `
                INSERT INTO ocr_records (
                    id, character_name, character_class, raid_name, 
                    gate_number, difficulty, combat_time, 
                    image_url, image_public_id, raw_ocr_data, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            await executeQuery(connection, insertRecordQuery, [
                recordId,
                characterName,
                characterClass || null,
                raidName,
                gateNumber ? parseInt(gateNumber) : null,
                difficulty || null,
                combatTime || null,
                imagePath,
                imagePublicId,
                JSON.stringify(parsedOcrData)
            ]);

            console.log(`✅ 메인 레코드 저장 완료: ${recordId}`);

            // 2. 스탯 데이터 저장
            let statsCount = 0;
            if (parsedOcrData && Object.keys(parsedOcrData).length > 0) {
                const insertStatQuery = `
                    INSERT INTO ocr_stats (
                        id, record_id, stat_name, stat_value, stat_category, created_at
                    ) VALUES (?, ?, ?, ?, ?, NOW())
                `;

                for (const [statName, statValue] of Object.entries(parsedOcrData)) {
                    if (statValue !== null && statValue !== undefined && statValue !== '') {
                        const statId = generateId(10);
                        
                        // 스탯 카테고리 분류
                        let category = 'general';
                        if (statName.includes('피해') || statName.includes('데미지')) {
                            category = 'damage';
                        } else if (statName.includes('치명') || statName.includes('특화') || statName.includes('신속')) {
                            category = 'combat_stats';
                        } else if (statName.includes('체력') || statName.includes('방어')) {
                            category = 'defense';
                        }

                        await executeQuery(connection, insertStatQuery, [
                            statId,
                            recordId,
                            statName,
                            String(statValue),
                            category
                        ]);

                        statsCount++;
                    }
                }

                console.log(`✅ 스탯 데이터 저장 완료: ${statsCount}개`);
            }

            // 트랜잭션 커밋
            await connection.commit();

            console.log(`🎉 OCR 기록 저장 완료 - ID: ${recordId}, 스탯: ${statsCount}개`);

            return res.status(200).json({
                success: true,
                message: 'OCR 기록이 성공적으로 저장되었습니다.',
                data: {
                    recordId,
                    characterName,
                    raidName,
                    statsCount,
                    imageUrl: imagePath
                }
            });

        } catch (dbError) {
            await connection.rollback();
            throw dbError;
        }

    } catch (error) {
        console.error('OCR 기록 저장 실패:', error);
        console.error('에러 스택:', error.stack);
        return res.status(500).json({
            success: false,
            error: 'OCR 기록 저장 중 오류가 발생했습니다.',
            details: error.message, // 개발/프로덕션 구분 없이 에러 메시지 노출
            stack: error.stack
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// API 라우트 설정 (body parser 비활성화)
export const config = {
    api: {
        bodyParser: false
    }
};