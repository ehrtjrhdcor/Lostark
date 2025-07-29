const { pool, executeQuery } = require('./config/database');

async function createOcrTable() {
    const createTableQuery = `
        CREATE TABLE ocr_results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            original_filename VARCHAR(255) NOT NULL COMMENT '원본 파일명',
            file_size INT COMMENT '파일 크기 (bytes)',
            image_type VARCHAR(50) COMMENT '이미지 타입 (jpeg, png 등)',
            ocr_text TEXT COMMENT '추출된 텍스트',
            analysis_result JSON COMMENT '분석 결과 (JSON 형태)',
            processing_time DECIMAL(8,3) COMMENT '처리 시간 (초)',
            success_status BOOLEAN DEFAULT FALSE COMMENT '분석 성공 여부',
            error_message TEXT COMMENT '오류 메시지',
            client_ip VARCHAR(45) COMMENT '클라이언트 IP',
            user_agent TEXT COMMENT '사용자 브라우저 정보',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
            
            INDEX idx_created_at (created_at),
            INDEX idx_success_status (success_status),
            INDEX idx_client_ip (client_ip)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='로스트아크 OCR 분석 결과'
    `;

    try {
        await executeQuery(createTableQuery);
        console.log('✅ ocr_results 테이블이 성공적으로 생성되었습니다.');
    } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⚠️ ocr_results 테이블이 이미 존재합니다.');
        } else {
            console.error('❌ 테이블 생성 실패:', error.message);
            throw error;
        }
    } finally {
        await pool.end();
    }
}

createOcrTable();