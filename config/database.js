const mysql = require('mysql2/promise');

/**
 * MySQL 데이터베이스 연결 설정
 */
const dbConfig = {
    host: 'localhost',          // MySQL 서버 주소
    port: 3306,                 // MySQL 포트 (기본: 3306)
    user: 'root',               // 사용자명
    password: 'ahsld123!@',               // 비밀번호 (필요시 입력)
    database: 'ehrtjrhdcor',        // 데이터베이스명
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

/**
 * 연결 풀 생성
 */
const pool = mysql.createPool(dbConfig);

/**
 * 데이터베이스 연결 테스트
 */
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL 연결 성공');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL 연결 실패:', error.message);
        return false;
    }
}

/**
 * 쿼리 실행 함수
 */
async function executeQuery(sql, params = []) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('쿼리 실행 오류:', error);
        throw error;
    }
}

module.exports = {
    pool,
    testConnection,
    executeQuery
};