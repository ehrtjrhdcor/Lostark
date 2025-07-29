const { pool, executeQuery } = require('./config/database');

async function createRaidsTable() {
    const createTableQuery = `
        CREATE TABLE raids (
            id INT AUTO_INCREMENT PRIMARY KEY,
            raid_name VARCHAR(50) NOT NULL COMMENT '레이드명 (카제로스1막, 카제로스2막, 카제로스3막, 카멘)',
            difficulty ENUM('노말', '하드', '익스트림') NOT NULL COMMENT '난이도',
            gate_number INT NOT NULL COMMENT '관문 번호',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
            
            UNIQUE KEY unique_raid_gate (raid_name, difficulty, gate_number),
            INDEX idx_raid_name (raid_name),
            INDEX idx_difficulty (difficulty)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='로스트아크 레이드 정보'
    `;

    const insertDataQuery = `
        INSERT INTO raids (raid_name, difficulty, gate_number) VALUES
        ('카제로스1막', '노말', 1),
        ('카제로스1막', '노말', 2),
        ('카제로스1막', '하드', 1),
        ('카제로스1막', '하드', 2),
        ('카제로스2막', '노말', 1),
        ('카제로스2막', '노말', 2),
        ('카제로스2막', '하드', 1),
        ('카제로스2막', '하드', 2),
        ('카제로스3막', '노말', 1),
        ('카제로스3막', '노말', 2),
        ('카제로스3막', '노말', 3),
        ('카제로스3막', '하드', 1),
        ('카제로스3막', '하드', 2),
        ('카제로스3막', '하드', 3),
        ('카멘', '익스트림', 1)
    `;

    try {
        await executeQuery(createTableQuery);
        console.log('✅ raids 테이블이 성공적으로 생성되었습니다.');
        
        await executeQuery(insertDataQuery);
        console.log('✅ 레이드 기본 데이터가 성공적으로 삽입되었습니다.');
    } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⚠️ raids 테이블이 이미 존재합니다.');
        } else {
            console.error('❌ 테이블 생성/데이터 삽입 실패:', error.message);
            throw error;
        }
    } finally {
        await pool.end();
    }
}

createRaidsTable();