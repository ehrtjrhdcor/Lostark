-- 로스트아크 캐릭터 캐시 데이터베이스 스키마

-- 1. 캐릭터 기본 정보 테이블 (형제 캐릭터 목록)
CREATE TABLE character_siblings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_name VARCHAR(50) NOT NULL UNIQUE,
    server_name VARCHAR(20) NOT NULL,
    character_level INT NOT NULL,
    character_class VARCHAR(30) NOT NULL,
    item_avg_level VARCHAR(20), -- "1,727.50" 형태로 저장
    search_keyword VARCHAR(50), -- 검색에 사용된 키워드 (형제 관계 추적용)
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_character_name (character_name),
    INDEX idx_search_keyword (search_keyword),
    INDEX idx_cached_at (cached_at)
);

-- 2. 캐릭터 상세 프로필 테이블
CREATE TABLE character_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_name VARCHAR(50) NOT NULL UNIQUE,
    character_image TEXT, -- 긴 URL 저장
    expedition_level INT,
    pvp_grade VARCHAR(10),
    town_level INT,
    town_name VARCHAR(30),
    title VARCHAR(100),
    guild_name VARCHAR(50),
    guild_member_grade VARCHAR(20),
    using_skill_point INT,
    total_skill_point INT,
    combat_power VARCHAR(20), -- "1,141.08" 형태
    server_name VARCHAR(20),
    character_level INT,
    character_class VARCHAR(30),
    item_avg_level VARCHAR(20),
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_character_name (character_name),
    INDEX idx_guild_name (guild_name),
    INDEX idx_cached_at (cached_at)
);

-- 3. 캐릭터 능력치 테이블
CREATE TABLE character_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_name VARCHAR(50) NOT NULL,
    stat_type VARCHAR(20) NOT NULL, -- '치명', '특화', '제압', '신속', '인내', '숙련', '최대 생명력', '공격력'
    stat_value VARCHAR(20) NOT NULL, -- 숫자값 문자열로 저장
    tooltip TEXT, -- 툴팁 정보 JSON 형태로 저장
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (character_name) REFERENCES character_profiles(character_name) ON DELETE CASCADE,
    INDEX idx_character_name (character_name),
    INDEX idx_stat_type (stat_type)
);

-- 4. 캐릭터 성향 테이블
CREATE TABLE character_tendencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_name VARCHAR(50) NOT NULL,
    tendency_type VARCHAR(20) NOT NULL, -- '지성', '담력', '매력', '친절'
    point INT NOT NULL,
    max_point INT NOT NULL DEFAULT 1000,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (character_name) REFERENCES character_profiles(character_name) ON DELETE CASCADE,
    INDEX idx_character_name (character_name),
    INDEX idx_tendency_type (tendency_type)
);

-- 5. API 호출 로그 테이블 (API 사용량 추적)
CREATE TABLE api_call_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    api_endpoint VARCHAR(100) NOT NULL,
    api_key_index INT, -- 사용된 API 키 인덱스 (1-5)
    character_name VARCHAR(50),
    success BOOLEAN NOT NULL,
    response_time_ms INT,
    error_message TEXT,
    called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_api_endpoint (api_endpoint),
    INDEX idx_character_name (character_name),
    INDEX idx_called_at (called_at),
    INDEX idx_success (success)
);

-- 6. 캐시 설정 테이블
CREATE TABLE cache_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 캐시 설정 기본값 삽입
INSERT INTO cache_settings (setting_key, setting_value, description) VALUES
('character_cache_duration_hours', '24', '캐릭터 기본 정보 캐시 유지 시간 (시간)'),
('profile_cache_duration_hours', '24', '캐릭터 상세 프로필 캐시 유지 시간 (시간)'),
('api_rate_limit_per_minute', '90', '분당 API 호출 제한 (5개 키 × 18회)'),
('batch_processing_delay_ms', '1000', '배치 처리 간 딜레이 (밀리초)');