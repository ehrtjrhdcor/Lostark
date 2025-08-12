const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * MySQL 데이터베이스 연결 설정
 * 환경변수 또는 로컬 설정 사용
 */
const dbConfig = process.env.DATABASE_URL 
    ? {
        // PlanetScale/Production 환경 - CONNECTION_URL 사용
        uri: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    }
    : {
        // 로컬 개발 환경
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'ahsld123!@',
        database: 'ehrtjrhdcor',
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