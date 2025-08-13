/**
 * 로스트아크 프로젝트 공통 상수 관리
 */

/**
 * 로스트아크 API 관련 상수
 */
const LOSTARK_API = {
    BASE_URL: 'https://developer-lostark.game.onstove.com',
    API_KEYS: process.env.NODE_ENV === 'production'
        ? (process.env.LOSTARK_API_KEYS ? process.env.LOSTARK_API_KEYS.split(',') : [])
        : [
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyIsImtpZCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyJ9.eyJpc3MiOiJodHRwczovL2x1ZHkuZ2FtZS5vbnN0b3ZlLmNvbSIsImF1ZCI6Imh0dHBzOi8vbHVkeS5nYW1lLm9uc3RvdmUuY29tL3Jlc291cmNlcyIsImNsaWVudF9pZCI6IjEwMDAwMDAwMDAwMDExNTIifQ.PUF70zE_m-9vTT_vRQ0TTuDWsulxRss9ZrW8wSUnGsds65C6NgD-qCmSv45XAuoU0NyJXjmttsbDEf-_-Y8x7im7ycVeooqXJLJXIdZ8ukkJZtm_-0S-WodhcVV7UYj9dvXdTWLyYWmY-y4q2HIIouE6ohPFtcESariEztQ3muVqF2i0FLFfiPN6KEnbJqVr6XO4XMY1HOQszKATOG0Npb0v0JItBdEwYrudbkxQwF5fd3tct6_v56m_eMo8HkRjka0BeKTShDR7q0MKSd1GXBnrJ9JXOhKMC9kqGqD08YEkR2Nrr2jWsF7E3mHhxUSNZYppcN6G87wj6UnEs5ySpw',
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyIsImtpZCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyJ9.eyJpc3MiOiJodHRwczovL2x1ZHkuZ2FtZS5vbnN0b3ZlLmNvbSIsImF1ZCI6Imh0dHBzOi8vbHVkeS5nYW1lLm9uc3RvdmUuY29tL3Jlc291cmNlcyIsImNsaWVudF9pZCI6IjEwMDAwMDAwMDA1ODQ5NzQifQ.POswRxBIz0NYDboN8GmWo9GhdH2enVbwz9tTjusy0CnBwGBdT2_TU2po6dPrQPivsnl4GKKBUSW1ndwP1ls9lI_EWDQo0VVL8ju_qw2Ggy_s73oX83lkIZz7qV1aFS9K1qsQJnmUrDCqAQxt5BBd4mM9bVj1fT08xXXaXe3mUJDl7dGN9SIoGV-B6RVa3eeftp7eS9ochadgYI3gjqHtz-E1cwh5_Dod-9VIUpznRG4_xvuO3bCFhCSomHCSAwEZn7QnvdhaNp2AAz3wqW5U3jEkklHpTFblFt3Gp5OQgMOCQsTCd0B5-eThUqw6pxyMgK3fkj1pRZdsvibJnQJDpg',
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyIsImtpZCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyJ9.eyJpc3MiOiJodHRwczovL2x1ZHkuZ2FtZS5vbnN0b3ZlLmNvbSIsImF1ZCI6Imh0dHBzOi8vbHVkeS5nYW1lLm9uc3RvdmUuY29tL3Jlc291cmNlcyIsImNsaWVudF9pZCI6IjEwMDAwMDAwMDA1ODUzMTEifQ.GZA1fWgFTdidatP_OSrI9LQvZu3l23xZmwdqV91OB-c5zXSzEYz_ZZZoktYniRul43SBprMFE0r3TQGyjBlVnzwzHkKXLV6Hvcjzx-YlI191c2AZV5rtnxKf94xxajXkxMc8QPOeHP1aQbkRujsunEtowD8Iq294RI0xUp3XsMiNdHCUmugvLrldIo-lR4BDQwbKikOpiDxfYDjtSrt4Ezm2SW-LHMvPv-lsRIanF9Oer6moHb97RbOQOzLcxN1cqNqFKPAvKhAFPFrwdbYC6Yh43TmaZ7F54hZA61DqNB8Z_vqT8T-GyizvsmJ2WvHnSWa5pJYQX8tKGv5AfLBRmw',
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyIsImtpZCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyJ9.eyJpc3MiOiJodHRwczovL2x1ZHkuZ2FtZS5vbnN0b3ZlLmNvbSIsImF1ZCI6Imh0dHBzOi8vbHVkeS5nYW1lLm9uc3RvdmUuY29tL3Jlc291cmNlcyIsImNsaWVudF9pZCI6IjEwMDAwMDAwMDA1ODUzMTIifQ.RGbRxT-B62UihmjEl6goD6vVOAdIiHHfaG1BA9I7c6LF5UXkO-YoGeqa-KzwLin4GrHJkN0EWZmNwsy-AiyoU7dMFpVpmoAbMQjjf6volNZeF1-U_4xy9xwhHWNDTLEypggcMBr0tEyqbFbYcbiqH7SRdLwzTZiyoIL8PKXb_GjGVY_pntOmFndtgxUS9l-Z-EjYbVEYY3zMCUCk72DD7FPVS0XbQtR_N1_TEsHO6g-ClQQYHAX0kvEuIWXcMf392pvY0ejJW0ydpYrSDC1Rs52aJXPzsYuBp4_pajTsZEjmi-73cj9uQcjOEzsNg7JMiOYule4XHcQ1lYOERfi0Yg',
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyIsImtpZCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyJ9.eyJpc3MiOiJodHRwczovL2x1ZHkuZ2FtZS5vbnN0b3ZlLmNvbSIsImF1ZCI6Imh0dHBzOi8vbHVkeS5nYW1lLm9uc3RvdmUuY29tL3Jlc291cmNlcyIsImNsaWVudF9pZCI6IjEwMDAwMDAwMDA1ODUzMTMifQ.nCeA4l8BqB5TanzsyM9lzQE66oVUZ2JpVBNeNx0e9sskRLvb7syqxJRaOJNvcxkcKUCGhKQSEWWl231TcCeRs2MTKtZbXj1GICst346O140hK3qKiuhzdhnpIDggCfjb-WmlmJ-mFZa7jJC9Y3h8ZRKiNXPeLxdVdrTyz4QYbGd0Y8BF3QNDxIioqOxOzteyHHxRekW77OPEDbr8ze73TsvZ0ZaBtizIc84mZ_YYTVeseVOnwGHm5NeiqhhdePwLNLkCWzYRIKyLBU-GOYc2QLib_iAXx2_FSWgq7MQSnmM4rejF7T1U0RfZDr_qKgE55XylrPaY9h-yrhASZfPqDw'
        ],

    // 랜덤 API 키 선택 함수
    getRandomApiKey() {
        if (this.API_KEYS.length === 0) {
            throw new Error('API 키가 설정되지 않았습니다. 환경변수 LOSTARK_API_KEYS를 확인하세요.');
        }
        const randomIndex = Math.floor(Math.random() * this.API_KEYS.length);
        console.log(`🔑 API 키 ${randomIndex + 1}/${this.API_KEYS.length} 사용 중...`);
        return this.API_KEYS[randomIndex];
    },

    // 하위 호환성을 위한 단일 키 접근 (첫 번째 키 반환)
    get API_KEY() {
        return this.API_KEYS[0];
    },
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