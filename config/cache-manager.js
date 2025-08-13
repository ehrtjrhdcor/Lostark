/**
 * 로스트아크 캐릭터 데이터 캐시 관리자
 * 
 * API 호출 제한을 해결하기 위한 캐싱 시스템
 * - 캐릭터 기본 정보: 24시간 캐시
 * - 캐릭터 상세 프로필: 24시간 캐시
 * - API 키 로테이션으로 호출 제한 완화
 */

const mysql = require('mysql2/promise');
const { LOSTARK_API } = require('./constants');

class CacheManager {
    constructor() {
        this.pool = null;
        this.initDatabase();
    }

    /**
     * 데이터베이스 연결 풀 초기화
     */
    async initDatabase() {
        try {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || 'ahsld123!@',
                database: process.env.DB_NAME || 'ehrtjrhdcor',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });

            // 테이블 생성
            await this.createTables();
            console.log('✅ 캐시 매니저 초기화 완료');
        } catch (error) {
            console.error('❌ 캐시 매니저 초기화 실패:', error);
        }
    }

    /**
     * 필요한 테이블들을 생성
     */
    async createTables() {
        const tables = [
            // 캐릭터 형제 정보 테이블
            `CREATE TABLE IF NOT EXISTS character_siblings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                character_name VARCHAR(50) NOT NULL UNIQUE,
                server_name VARCHAR(20) NOT NULL,
                character_level INT NOT NULL,
                character_class VARCHAR(30) NOT NULL,
                item_avg_level VARCHAR(20),
                search_keyword VARCHAR(50),
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_character_name (character_name),
                INDEX idx_search_keyword (search_keyword),
                INDEX idx_cached_at (cached_at)
            )`,

            // 캐릭터 상세 프로필 테이블
            `CREATE TABLE IF NOT EXISTS character_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                character_name VARCHAR(50) NOT NULL UNIQUE,
                character_image TEXT,
                expedition_level INT,
                pvp_grade VARCHAR(10),
                town_level INT,
                town_name VARCHAR(30),
                title VARCHAR(100),
                guild_name VARCHAR(50),
                guild_member_grade VARCHAR(20),
                using_skill_point INT,
                total_skill_point INT,
                combat_power VARCHAR(20),
                server_name VARCHAR(20),
                character_level INT,
                character_class VARCHAR(30),
                item_avg_level VARCHAR(20),
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_character_name (character_name),
                INDEX idx_guild_name (guild_name),
                INDEX idx_cached_at (cached_at)
            )`,

            // API 호출 로그 테이블
            `CREATE TABLE IF NOT EXISTS api_call_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                api_endpoint VARCHAR(100) NOT NULL,
                api_key_index INT,
                character_name VARCHAR(50),
                success BOOLEAN NOT NULL,
                response_time_ms INT,
                error_message TEXT,
                called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_api_endpoint (api_endpoint),
                INDEX idx_character_name (character_name),
                INDEX idx_called_at (called_at),
                INDEX idx_success (success)
            )`,

            // 캐시 설정 테이블
            `CREATE TABLE IF NOT EXISTS cache_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(50) NOT NULL UNIQUE,
                setting_value TEXT NOT NULL,
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
        ];

        for (const tableSQL of tables) {
            await this.pool.execute(tableSQL);
        }

        // 기본 설정 삽입
        await this.insertDefaultSettings();
    }

    /**
     * 기본 캐시 설정 삽입
     */
    async insertDefaultSettings() {
        const settings = [
            ['character_cache_duration_hours', '8760', '캐릭터 기본 정보 캐시 유지 시간 (시간) - 1년'],
            ['profile_cache_duration_hours', '8760', '캐릭터 상세 프로필 캐시 유지 시간 (시간) - 1년'],
            ['api_rate_limit_per_minute', '90', '분당 API 호출 제한 (5개 키 × 18회)'],
            ['batch_processing_delay_ms', '1000', '배치 처리 간 딜레이 (밀리초)']
        ];

        for (const [key, value, description] of settings) {
            await this.pool.execute(
                'INSERT IGNORE INTO cache_settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
                [key, value, description]
            );
        }
    }

    /**
     * 캐시된 형제 캐릭터 정보 조회
     * @param {string} searchKeyword - 검색 키워드
     * @returns {Array} 캐시된 캐릭터 목록
     */
    async getCachedSiblings(searchKeyword) {
        const cacheDuration = await this.getSetting('character_cache_duration_hours', 24);
        const [rows] = await this.pool.execute(
            `SELECT * FROM character_siblings 
             WHERE search_keyword = ? 
             AND cached_at > DATE_SUB(NOW(), INTERVAL ? HOUR)
             ORDER BY item_avg_level DESC`,
            [searchKeyword, cacheDuration]
        );
        
        console.log(`📋 캐시된 형제 캐릭터 ${rows.length}명 조회: ${searchKeyword}`);
        return rows;
    }

    /**
     * 형제 캐릭터 정보 캐시 저장
     * @param {string} searchKeyword - 검색 키워드
     * @param {Array} siblings - 형제 캐릭터 목록
     */
    async cacheSiblings(searchKeyword, siblings) {
        // 기존 캐시 삭제
        await this.pool.execute(
            'DELETE FROM character_siblings WHERE search_keyword = ?',
            [searchKeyword]
        );

        // 새 데이터 삽입
        const insertPromises = siblings.map(sibling => 
            this.pool.execute(
                `INSERT INTO character_siblings 
                 (character_name, server_name, character_level, character_class, item_avg_level, search_keyword)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    sibling.CharacterName,
                    sibling.ServerName,
                    sibling.CharacterLevel,
                    sibling.CharacterClassName,
                    sibling.ItemAvgLevel,
                    searchKeyword
                ]
            )
        );

        await Promise.all(insertPromises);
        console.log(`💾 형제 캐릭터 ${siblings.length}명 캐시 저장: ${searchKeyword}`);
    }

    /**
     * 캐시된 캐릭터 프로필 조회
     * @param {string} characterName - 캐릭터명
     * @returns {Object|null} 캐시된 프로필 데이터
     */
    async getCachedProfile(characterName) {
        const cacheDuration = await this.getSetting('profile_cache_duration_hours', 24);
        const [rows] = await this.pool.execute(
            `SELECT * FROM character_profiles 
             WHERE character_name = ? 
             AND cached_at > DATE_SUB(NOW(), INTERVAL ? HOUR)`,
            [characterName, cacheDuration]
        );

        if (rows.length > 0) {
            console.log(`📋 캐시된 프로필 조회: ${characterName}`);
            return rows[0];
        }
        return null;
    }

    /**
     * 캐릭터 프로필 캐시 저장
     * @param {string} characterName - 캐릭터명
     * @param {Object} profile - 프로필 데이터
     */
    async cacheProfile(characterName, profile) {
        await this.pool.execute(
            `INSERT INTO character_profiles 
             (character_name, character_image, expedition_level, pvp_grade, town_level, town_name,
              title, guild_name, guild_member_grade, using_skill_point, total_skill_point,
              combat_power, server_name, character_level, character_class, item_avg_level)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             character_image = VALUES(character_image),
             expedition_level = VALUES(expedition_level),
             pvp_grade = VALUES(pvp_grade),
             town_level = VALUES(town_level),
             town_name = VALUES(town_name),
             title = VALUES(title),
             guild_name = VALUES(guild_name),
             guild_member_grade = VALUES(guild_member_grade),
             using_skill_point = VALUES(using_skill_point),
             total_skill_point = VALUES(total_skill_point),
             combat_power = VALUES(combat_power),
             server_name = VALUES(server_name),
             character_level = VALUES(character_level),
             character_class = VALUES(character_class),
             item_avg_level = VALUES(item_avg_level),
             updated_at = CURRENT_TIMESTAMP`,
            [
                characterName,
                profile.CharacterImage || null,
                profile.ExpeditionLevel || null,
                profile.PvpGradeName || null,
                profile.TownLevel || null,
                profile.TownName || null,
                profile.Title || null,
                profile.GuildName || null,
                profile.GuildMemberGrade || null,
                profile.UsingSkillPoint || null,
                profile.TotalSkillPoint || null,
                profile.CombatPower || null,
                profile.ServerName || null,
                profile.CharacterLevel || null,
                profile.CharacterClassName || null,
                profile.ItemAvgLevel || null
            ]
        );

        console.log(`💾 캐릭터 프로필 캐시 저장: ${characterName}`);
    }

    /**
     * API 호출 로그 기록
     * @param {string} endpoint - API 엔드포인트
     * @param {number} keyIndex - 사용된 API 키 인덱스
     * @param {string} characterName - 캐릭터명
     * @param {boolean} success - 성공 여부
     * @param {number} responseTime - 응답 시간
     * @param {string} errorMessage - 에러 메시지
     */
    async logApiCall(endpoint, keyIndex, characterName, success, responseTime, errorMessage = null) {
        await this.pool.execute(
            `INSERT INTO api_call_logs 
             (api_endpoint, api_key_index, character_name, success, response_time_ms, error_message)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [endpoint, keyIndex, characterName, success, responseTime, errorMessage]
        );
    }

    /**
     * 캐시 설정값 조회
     * @param {string} key - 설정 키
     * @param {any} defaultValue - 기본값
     * @returns {any} 설정값
     */
    async getSetting(key, defaultValue) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT setting_value FROM cache_settings WHERE setting_key = ?',
                [key]
            );
            
            if (rows.length > 0) {
                const value = rows[0].setting_value;
                // 숫자로 변환 시도
                return isNaN(value) ? value : Number(value);
            }
        } catch (error) {
            console.error(`설정 조회 실패: ${key}`, error);
        }
        
        return defaultValue;
    }

    /**
     * 캐시 통계 조회
     * @returns {Object} 캐시 통계 정보
     */
    async getCacheStats() {
        try {
            const [siblingStats] = await this.pool.execute(
                'SELECT COUNT(*) as count FROM character_siblings WHERE cached_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)'
            );
            
            const [profileStats] = await this.pool.execute(
                'SELECT COUNT(*) as count FROM character_profiles WHERE cached_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)'
            );
            
            const [apiStats] = await this.pool.execute(
                'SELECT COUNT(*) as total_calls, SUM(success) as successful_calls FROM api_call_logs WHERE called_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)'
            );

            return {
                cachedSiblings: siblingStats[0].count,
                cachedProfiles: profileStats[0].count,
                apiCallsLastHour: apiStats[0].total_calls || 0,
                successfulCallsLastHour: apiStats[0].successful_calls || 0
            };
        } catch (error) {
            console.error('캐시 통계 조회 실패:', error);
            return { cachedSiblings: 0, cachedProfiles: 0, apiCallsLastHour: 0, successfulCallsLastHour: 0 };
        }
    }
}

// 싱글톤 인스턴스
const cacheManager = new CacheManager();
module.exports = cacheManager;