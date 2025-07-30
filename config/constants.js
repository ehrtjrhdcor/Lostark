/**
 * 로스트아크 프로젝트 공통 상수 관리
 */

/**
 * 로스트아크 API 관련 상수
 */
const LOSTARK_API = {
    BASE_URL: 'https://developer-lostark.game.onstove.com',
    API_KEY: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyIsImtpZCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyJ9.eyJpc3MiOiJodHRwczovL2x1ZHkuZ2FtZS5vbnN0b3ZlLmNvbSIsImF1ZCI6Imh0dHBzOi8vbHVkeS5nYW1lLm9uc3RvdmUuY29tL3Jlc291cmNlcyIsImNsaWVudF9pZCI6IjEwMDAwMDAwMDAwMDExNTIifQ.PUF70zE_m-9vTT_vRQ0TTuDWsulxRss9ZrW8wSUnGsds65C6NgD-qCmSv45XAuoU0NyJXjmttsbDEf-_-Y8x7im7ycVeooqXJLJXIdZ8ukkJZtm_-0S-WodhcVV7UYj9dvXdTWLyYWmY-y4q2HIIouE6ohPFtcESariEztQ3muVqF2i0FLFfiPN6KEnbJqVr6XO4XMY1HOQszKATOG0Npb0v0JItBdEwYrudbkxQwF5fd3tct6_v56m_eMo8HkRjka0BeKTShDR7q0MKSd1GXBnrJ9JXOhKMC9kqGqD08YEkR2Nrr2jWsF7E3mHhxUSNZYppcN6G87wj6UnEs5ySpw',
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