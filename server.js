/**
 * 로스트아크 OCR 분석 서버 (로컬 개발용)
 * 
 * Express.js 서버로 이미지 업로드 및 OCR 분석 API를 제공합니다.
 * 
 * 주요 기능:
 * - 정적 파일 서빙 (public 폴더)
 * - 이미지 파일 업로드 처리 (multer)
 * - Python OCR 스크립트 실행
 * - JSON 형태로 분석 결과 반환
 * 
 * 참고:
 * - 로컬 개발 환경용 서버입니다
 * - Vercel 배포 시에는 api/ocr.js 서버리스 함수가 사용됩니다
 */

const express = require('express');
const path = require('path');
const multer = require('multer');           // 파일 업로드 처리
const { spawn } = require('child_process');  // Python 프로세스 실행
const fs = require('fs');
const { testConnection } = require('./config/database');  // MySQL 연결
const { LOSTARK_API } = require('./config/constants');     // 로스트아크 API 상수

const app = express();
const PORT = process.env.PORT || 1707;  // 환경변수 또는 기본 포트 1707

/**
 * 업로드 폴더 생성
 * 이미지 파일이 임시로 저장될 디렉토리를 생성합니다.
 */
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

/**
 * Multer 파일 업로드 설정
 * 
 * 이미지 파일을 서버에 저장하고 관리하는 설정입니다.
 * - 저장 위치: ./uploads 폴더
 * - 파일명: 중복 방지를 위한 유니크 접미사 추가
 * - 파일 크기 제한: 10MB
 * - 파일 타입 제한: 이미지 파일만 허용
 */

// 디스크 저장소 설정
const storage = multer.diskStorage({
    // 파일 저장 경로 설정
    destination: function (req, file, cb) {
        cb(null, uploadDir);  // uploads 폴더에 저장
    },

    // 파일명 생성 (중복 방지)
    filename: function (req, file, cb) {
        // 타임스탬프 + 랜덤숫자로 유니크한 파일명 생성
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // 원본 확장자 유지: fieldname-uniqueSuffix.ext
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Multer 미들웨어 설정
const upload = multer({
    storage: storage,

    // 파일 크기 제한 설정
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB 제한
    },

    // 파일 타입 필터링
    fileFilter: function (req, file, cb) {
        // 이미지 MIME 타입만 허용 (image/jpeg, image/png 등)
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);  // 허용
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다.'));  // 거부
        }
    }
});

/**
 * Express 미들웨어 설정
 */
// 정적 파일 서빙 (HTML, CSS, JS 파일들)
app.use(express.static(path.join(__dirname, 'public')));

// JSON 요청 바디 파싱
app.use(express.json());

/**
 * 라우트 설정
 */

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * API 키 제공 엔드포인트
 * 
 * GET /api/config
 * - 클라이언트에서 사용할 API 키를 제공
 */
app.get('/api/config', (req, res) => {
    res.json({
        success: true,
        apiKey: LOSTARK_API.API_KEY
    });
});

/**
 * OCR 분석 API 엔드포인트
 * 
 * POST /api/ocr
 * - 이미지 파일을 업로드받아 Python OCR 스크립트로 분석
 * - 분석 결과를 JSON 형태로 반환
 * 
 * @param {File} image - 분석할 이미지 파일 (multipart/form-data)
 * @returns {Object} 분석 결과 JSON
 */
app.post('/api/ocr', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    const imagePath = req.file.path;
    const pythonScript = path.join(__dirname, 'simple_ocr.py');

    // Python 스크립트 실행
    const pythonProcess = spawn('python', [pythonScript, imagePath]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
    });

    pythonProcess.on('close', (code) => {
        // 임시 파일 삭제
        fs.unlink(imagePath, (err) => {
            if (err) console.error('파일 삭제 실패:', err);
        });

        console.log(`Python 스크립트 종료 코드: ${code}`);
        console.log('Python stdout:', result);
        console.log('Python stderr:', error);

        if (code !== 0) {
            console.error('Python 스크립트 오류:', error);

            // Python에서 JSON 에러를 출력했는지 확인
            try {
                const errorResult = JSON.parse(result);
                return res.status(500).json(errorResult);
            } catch (e) {
                return res.status(500).json({
                    success: false,
                    error: 'OCR 처리 중 오류가 발생했습니다.',
                    details: error,
                    pythonOutput: result
                });
            }
        }

        try {
            if (!result.trim()) {
                return res.status(500).json({
                    success: false,
                    error: 'Python 스크립트에서 결과를 반환하지 않았습니다.',
                    pythonOutput: result,
                    pythonError: error
                });
            }

            const ocrResult = JSON.parse(result);
            // OCR 스크립트에서 이미 성공 여부와 HTML 테이블을 포함한 구조를 반환
            res.json(ocrResult);
        } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            console.error('원본 결과:', result);
            res.status(500).json({
                success: false,
                error: 'OCR 결과 처리 중 오류가 발생했습니다.',
                parseError: parseError.message,
                rawResult: result
            });
        }
    });
});

/**
 * 로스트아크 API 테스트 엔드포인트
 * 
 * POST /api/lostark/test
 * - API 키로 로스트아크 API 연결 테스트
 * - "다시시작하는창술사" 캐릭터의 형제 캐릭터 목록 조회
 */
app.post('/api/lostark/test', async (req, res) => {
    const { apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({
            success: false,
            error: 'API 키가 필요합니다.'
        });
    }

    try {
        // 테스트용 캐릭터 "다시시작하는창술사"로 형제 캐릭터 목록 조회
        const testCharacterName = '다시시작하는창술사';
        
        // 1단계: 형제 캐릭터 목록 조회
        const siblingsUrl = `${LOSTARK_API.BASE_URL}/characters/${encodeURIComponent(testCharacterName)}/siblings`;
        
        console.log(`📋 API 테스트: ${testCharacterName} 형제 캐릭터 조회 중...`);
        console.log(`URL: ${siblingsUrl}`);

        const siblingsResponse = await fetch(siblingsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        const siblingsData = await siblingsResponse.json();

        if (!siblingsResponse.ok) {
            console.error(`❌ API 테스트 실패:`, siblingsResponse.status, siblingsData);
            
            let errorMessage = 'API 연결에 실패했습니다.';
            if (siblingsResponse.status === 429) {
                errorMessage = 'API 호출 제한에 도달했습니다. 잠시 후 다시 시도해주세요.';
            } else if (siblingsResponse.status === 401) {
                errorMessage = 'API 키가 유효하지 않습니다.';
            }

            return res.status(siblingsResponse.status).json({
                success: false,
                error: errorMessage,
                details: siblingsData
            });
        }

        console.log(`✅ API 테스트 성공: ${testCharacterName} 형제 캐릭터 목록:`, siblingsData);

        // 2단계: 각 캐릭터의 프로필 정보 조회 (최대 5명)
        let profileResults = [];
        if (Array.isArray(siblingsData) && siblingsData.length > 0) {
            const charactersToProcess = siblingsData.slice(0, 5); // 테스트용으로 최대 5명만
            console.log(`=== ${charactersToProcess.length}명의 캐릭터 프로필 조회 시작 ===`);

            for (const character of charactersToProcess) {
                try {
                    const profileUrl = `${LOSTARK_API.BASE_URL}/armories/characters/${encodeURIComponent(character.CharacterName)}/profiles`;
                    console.log(`📋 ${character.CharacterName} 프로필 조회 중...`);

                    const profileResponse = await fetch(profileUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Accept': 'application/json'
                        }
                    });

                    const profileData = await profileResponse.json();

                    if (profileResponse.ok) {
                        console.log(`✅ ${character.CharacterName} 프로필:`, profileData);
                        profileResults.push({
                            character: character.CharacterName,
                            success: true,
                            data: profileData
                        });
                    } else {
                        console.error(`❌ ${character.CharacterName} 프로필 조회 실패:`, profileResponse.status, profileData);
                        profileResults.push({
                            character: character.CharacterName,
                            success: false,
                            error: profileData
                        });
                    }
                } catch (profileError) {
                    console.error(`❌ ${character.CharacterName} 프로필 API 호출 오류:`, profileError.message);
                    profileResults.push({
                        character: character.CharacterName,
                        success: false,
                        error: profileError.message
                    });
                }
            }

            console.log(`=== API 테스트 완료 ===`);
        }

        res.json({
            success: true,
            result: siblingsData,
            profiles: profileResults,
            message: `API 연결 성공! ${testCharacterName}의 형제 캐릭터 ${siblingsData.length}명을 찾았습니다.`
        });
    } catch (error) {
        console.error('로스트아크 API 호출 실패:', error);
        res.status(500).json({
            success: false,
            error: 'API 호출 중 서버 오류가 발생했습니다.',
            details: error.message
        });
    }
});

/**
 * API 연결 테스트 엔드포인트 (about 페이지용)
 * 
 * POST /api/lostark/connect
 * - API 키 유효성만 검증
 */
app.post('/api/lostark/connect', async (req, res) => {
    const { apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({
            success: false,
            error: 'API 키가 필요합니다.'
        });
    }

    try {
        // TODO: API 호출 구현
        res.json({
            success: true,
            message: '테스트용 응답'
        });
    } catch (error) {
        console.error('API 연결 테스트 실패:', error);
        res.status(500).json({
            success: false,
            error: 'API 연결 테스트 중 서버 오류가 발생했습니다.',
            details: error.message
        });
    }
});

/**
 * 개별 캐릭터 검색 API 엔드포인트
 * 
 * POST /api/lostark/character
 * - 특정 캐릭터 이름으로 형제 캐릭터 목록 및 프로필 정보 조회
 */
app.post('/api/lostark/character', async (req, res) => {
    const { apiKey, characterName } = req.body;

    if (!apiKey) {
        return res.status(400).json({
            success: false,
            error: 'API 키가 필요합니다.'
        });
    }

    if (!characterName) {
        return res.status(400).json({
            success: false,
            error: '캐릭터명이 필요합니다.'
        });
    }

    try {
        // 1단계: 형제 캐릭터 목록 조회
        const siblingsUrl = `${LOSTARK_API.BASE_URL}/characters/${encodeURIComponent(characterName)}/siblings`;
        
        console.log(`📋 ${characterName} 형제 캐릭터 조회 중...`);
        console.log(`URL: ${siblingsUrl}`);

        const siblingsResponse = await fetch(siblingsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        const siblingsData = await siblingsResponse.json();

        if (!siblingsResponse.ok) {
            console.error(`❌ ${characterName} 형제 캐릭터 조회 실패:`, siblingsResponse.status, siblingsData);
            
            let errorMessage = '캐릭터를 찾을 수 없습니다.';
            if (siblingsResponse.status === 404) {
                errorMessage = '존재하지 않는 캐릭터입니다.';
            } else if (siblingsResponse.status === 429) {
                errorMessage = 'API 호출 제한에 도달했습니다. 잠시 후 다시 시도해주세요.';
            } else if (siblingsResponse.status === 401) {
                errorMessage = 'API 키가 유효하지 않습니다.';
            }

            return res.status(siblingsResponse.status).json({
                success: false,
                error: errorMessage,
                details: siblingsData
            });
        }

        console.log(`✅ ${characterName} 형제 캐릭터 목록:`, siblingsData);

        // 2단계: 각 캐릭터의 프로필 정보 조회
        let profileResults = [];
        if (Array.isArray(siblingsData) && siblingsData.length > 0) {
            console.log(`=== ${siblingsData.length}명의 캐릭터 프로필 조회 시작 ===`);

            for (const character of siblingsData) {
                try {
                    const profileUrl = `${LOSTARK_API.BASE_URL}/armories/characters/${encodeURIComponent(character.CharacterName)}/profiles`;
                    console.log(`📋 ${character.CharacterName} 프로필 조회 중...`);

                    const profileResponse = await fetch(profileUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Accept': 'application/json'
                        }
                    });

                    const profileData = await profileResponse.json();

                    if (profileResponse.ok) {
                        console.log(`✅ ${character.CharacterName} 프로필:`, profileData);
                        profileResults.push({
                            character: character.CharacterName,
                            success: true,
                            data: profileData
                        });
                    } else {
                        console.error(`❌ ${character.CharacterName} 프로필 조회 실패:`, profileResponse.status, profileData);
                        profileResults.push({
                            character: character.CharacterName,
                            success: false,
                            error: profileData
                        });
                    }
                } catch (profileError) {
                    console.error(`❌ ${character.CharacterName} 프로필 API 호출 오류:`, profileError.message);
                    profileResults.push({
                        character: character.CharacterName,
                        success: false,
                        error: profileError.message
                    });
                }
            }

            console.log(`=== 모든 캐릭터 프로필 조회 완료 ===`);
        }

        res.json({
            success: true,
            result: siblingsData,
            profiles: profileResults,
            message: '캐릭터 검색 성공'
        });

    } catch (error) {
        console.error('캐릭터 검색 API 호출 실패:', error);
        res.status(500).json({
            success: false,
            error: '캐릭터 검색 중 서버 오류가 발생했습니다.',
            details: error.message
        });
    }
});

app.listen(PORT, async () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);

    // MySQL 연결 테스트
    await testConnection();
});