/**
 * 로스트아크 프로젝트 공통 상수 관리
 */

/**
 * 로스트아크 API 관련 상수
 */
const LOSTARK_API = {
    BASE_URL: 'https://developer-lostark.game.onstove.com',
    ENDPOINTS: {
        CHARACTERS: '/characters',
        CHARACTER_PROFILE: '/armories/characters',
        RAIDS: '/gamecontents/challenge-guardian-raids',
        AUCTION: '/auctions/items'
    },
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

/**
 * 레이드 관련 상수
 */
const RAIDS = {
    KAZEROS: {
        NAME: '카제로스',
        ACTS: ['1막', '2막', '3막'],
        DIFFICULTIES: ['노말', '하드']
    },
    KAMEN: {
        NAME: '카멘',
        DIFFICULTIES: ['익스트림']
    },
    GATES: {
        ACT1: [1, 2],
        ACT2: [1, 2], 
        ACT3: [1, 2, 3],
        KAMEN: [1]
    }
};

/**
 * OCR 관련 상수
 */
const OCR = {
    UPLOAD_DIR: 'uploads',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
    PYTHON_SCRIPT: 'simple_ocr.py'
};

/**
 * 서버 설정 상수
 */
const SERVER = {
    DEFAULT_PORT: 1707,
    STATIC_DIR: 'public'
};

/**
 * 배포 환경 URL 상수
 */
const DEPLOY = {
    VERCEL_URL: 'https://lostark-lyart.vercel.app'
};

module.exports = {
    LOSTARK_API,
    RAIDS,
    OCR,
    SERVER,
    DEPLOY
};