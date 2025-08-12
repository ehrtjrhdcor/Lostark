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
const { testConnection, executeQuery } = require('./config/database');  // MySQL 연결
const { LOSTARK_API } = require('./config/constants');     // 로스트아크 API 상수
const cacheManager = require('./config/cache-manager');    // 캐시 매니저
const { nanoid } = require('nanoid');       // 고유 ID 생성

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
        apiKey: LOSTARK_API.getRandomApiKey()
    });
});


/**
 * 이미지 OCR 처리 엔드포인트
 * 
 * POST /api/process-images
 * - Python OCR 스크립트를 실행하여 게임 통계 추출
 */
app.post('/api/process-images', async (req, res) => {
    try {
        console.log('🖼️ 이미지 OCR 처리 시작...');

        // Python OCR 스크립트 실행
        const pythonProcess = spawn('python', ['ocr_processor.py'], {
            cwd: __dirname,
            stdio: 'pipe'
        });

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
            console.log('Python 출력:', data.toString());
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
            console.error('Python 에러:', data.toString());
        });

        pythonProcess.on('close', async (code) => {
            try {
                if (code !== 0) {
                    console.error('Python 스크립트 오류:', errorData);
                    return res.status(500).json({
                        success: false,
                        error: 'OCR 처리 실패',
                        details: errorData
                    });
                }

                // JSON 결과 파일 읽기
                const resultPath = path.join(__dirname, 'game_ocr_results.json');

                if (fs.existsSync(resultPath)) {
                    const resultData = fs.readFileSync(resultPath, 'utf-8');
                    const ocrResults = JSON.parse(resultData);

                    console.log('✅ OCR 처리 완료:', ocrResults.combined_stats);

                    return res.json({
                        success: true,
                        message: 'OCR 분석 완료',
                        stats: ocrResults.combined_stats,
                        raw_results: ocrResults
                    });
                } else {
                    throw new Error('결과 파일을 찾을 수 없습니다');
                }

            } catch (parseError) {
                console.error('결과 파싱 오류:', parseError);
                return res.status(500).json({
                    success: false,
                    error: '결과 파싱 실패',
                    details: parseError.message
                });
            }
        });

        pythonProcess.on('error', (error) => {
            console.error('Python 프로세스 오류:', error);
            return res.status(500).json({
                success: false,
                error: 'Python 실행 실패',
                details: error.message
            });
        });

    } catch (error) {
        console.error('이미지 처리 API 오류:', error);
        res.status(500).json({
            success: false,
            error: '서버 오류',
            details: error.message
        });
    }
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
                'Authorization': `Bearer ${LOSTARK_API.getRandomApiKey()}`,
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
                            'Authorization': `Bearer ${LOSTARK_API.getRandomApiKey()}`,
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
 * 개별 캐릭터 검색 API 엔드포인트 (캐싱 적용)
 * 
 * POST /api/lostark/character
 * - 특정 캐릭터 이름으로 형제 캐릭터 목록 및 프로필 정보 조회
 * - 24시간 캐시 적용으로 API 호출 최적화
 */
app.post('/api/lostark/character', async (req, res) => {
    const { apiKey, characterName } = req.body;
    const startTime = Date.now();

    if (!characterName) {
        return res.status(400).json({
            success: false,
            error: '캐릭터명이 필요합니다.'
        });
    }

    try {
        // 1단계: 캐시된 형제 캐릭터 목록 확인
        let siblingsData = await cacheManager.getCachedSiblings(characterName);
        console.log('siblingsData', siblingsData)
        let fromCache = true;

        if (siblingsData.length === 0) {
            fromCache = false;
            console.log(`🔍 ${characterName} 형제 캐릭터 API 조회 중...`);

            // API 호출
            const siblingsUrl = `${LOSTARK_API.BASE_URL}/characters/${encodeURIComponent(characterName)}/siblings`;
            const apiKey = LOSTARK_API.getRandomApiKey();
            const keyIndex = LOSTARK_API.API_KEYS.indexOf(apiKey) + 1;

            const siblingsResponse = await fetch(siblingsUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json'
                }
            });

            const responseTime = Date.now() - startTime;
            siblingsData = await siblingsResponse.json();

            // API 호출 로그 기록
            await cacheManager.logApiCall(
                '/characters/siblings',
                keyIndex,
                characterName,
                siblingsResponse.ok,
                responseTime,
                siblingsResponse.ok ? null : JSON.stringify(siblingsData)
            );

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

            // 캐시에 저장
            await cacheManager.cacheSiblings(characterName, siblingsData);
        } else {
            // DB 형태를 API 형태로 변환
            siblingsData = siblingsData.map(row => ({
                ServerName: row.server_name,
                CharacterName: row.character_name,
                CharacterLevel: row.character_level,
                CharacterClassName: row.character_class,
                ItemAvgLevel: row.item_avg_level
            }));
        }

        console.log(`✅ ${characterName} 형제 캐릭터 ${siblingsData.length}명 (캐시: ${fromCache})`);

        // 2단계: 각 캐릭터의 프로필 정보 조회 (캐시 우선)
        let profileResults = [];
        if (Array.isArray(siblingsData) && siblingsData.length > 0) {
            console.log(`=== ${siblingsData.length}명의 캐릭터 프로필 조회 시작 ===`);

            // 배치 처리를 위한 딜레이 설정
            const batchDelay = await cacheManager.getSetting('batch_processing_delay_ms', 1000);

            for (let i = 0; i < siblingsData.length; i++) {
                const character = siblingsData[i];

                try {
                    // 캐시된 프로필 확인
                    let cachedProfile = await cacheManager.getCachedProfile(character.CharacterName);

                    if (cachedProfile) {
                        // 캐시에서 가져온 경우
                        profileResults.push({
                            character: character.CharacterName,
                            success: true,
                            data: {
                                CharacterImage: cachedProfile.character_image,
                                ExpeditionLevel: cachedProfile.expedition_level,
                                PvpGradeName: cachedProfile.pvp_grade,
                                TownLevel: cachedProfile.town_level,
                                TownName: cachedProfile.town_name,
                                Title: cachedProfile.title,
                                GuildName: cachedProfile.guild_name,
                                GuildMemberGrade: cachedProfile.guild_member_grade,
                                UsingSkillPoint: cachedProfile.using_skill_point,
                                TotalSkillPoint: cachedProfile.total_skill_point,
                                CombatPower: cachedProfile.combat_power,
                                ServerName: cachedProfile.server_name,
                                CharacterLevel: cachedProfile.character_level,
                                CharacterClassName: cachedProfile.character_class,
                                ItemAvgLevel: cachedProfile.item_avg_level
                            }
                        });
                        console.log(`📋 ${character.CharacterName} 프로필 (캐시)`);
                    } else {
                        // API에서 가져와야 하는 경우
                        const profileUrl = `${LOSTARK_API.BASE_URL}/armories/characters/${encodeURIComponent(character.CharacterName)}/profiles`;
                        const apiKey = LOSTARK_API.getRandomApiKey();
                        const keyIndex = LOSTARK_API.API_KEYS.indexOf(apiKey) + 1;

                        console.log(`🔍 ${character.CharacterName} 프로필 API 조회 중...`);

                        const profileStartTime = Date.now();
                        const profileResponse = await fetch(profileUrl, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Accept': 'application/json'
                            }
                        });

                        const profileData = await profileResponse.json();
                        const profileResponseTime = Date.now() - profileStartTime;

                        // API 호출 로그 기록
                        await cacheManager.logApiCall(
                            '/armories/characters/profiles',
                            keyIndex,
                            character.CharacterName,
                            profileResponse.ok,
                            profileResponseTime,
                            profileResponse.ok ? null : JSON.stringify(profileData)
                        );

                        if (profileResponse.ok) {
                            console.log(`✅ ${character.CharacterName} 프로필 (API)`);

                            // 캐시에 저장
                            await cacheManager.cacheProfile(character.CharacterName, profileData);

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

                        // 배치 처리 딜레이 (API 제한 방지)
                        if (i < siblingsData.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, batchDelay));
                        }
                    }
                } catch (profileError) {
                    console.error(`❌ ${character.CharacterName} 프로필 처리 오류:`, profileError.message);
                    profileResults.push({
                        character: character.CharacterName,
                        success: false,
                        error: profileError.message
                    });
                }
            }

            console.log(`=== 모든 캐릭터 프로필 조회 완료 ===`);
        }

        // 캐시 통계 정보 추가
        const cacheStats = await cacheManager.getCacheStats();

        res.json({
            success: true,
            result: siblingsData,
            profiles: profileResults,
            message: '캐릭터 검색 성공',
            cache: {
                fromCache: fromCache,
                stats: cacheStats
            }
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

/**
 * 캐시 통계 조회 API
 * 
 * GET /api/cache/stats
 * - 캐시 사용량 및 API 호출 통계 조회
 */
app.get('/api/cache/stats', async (req, res) => {
    try {
        const stats = await cacheManager.getCacheStats();

        res.json({
            success: true,
            stats: {
                ...stats,
                cacheEnabled: true,
                cacheDuration: '24시간',
                apiKeysCount: LOSTARK_API.API_KEYS.length,
                maxCallsPerHour: LOSTARK_API.API_KEYS.length * 100
            }
        });
    } catch (error) {
        console.error('캐시 통계 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '캐시 통계 조회 실패',
            details: error.message
        });
    }
});

/**
 * 캐시 초기화 API
 * 
 * DELETE /api/cache/clear
 * - 캐시된 데이터 초기화
 */
app.delete('/api/cache/clear', async (req, res) => {
    try {
        const { type = 'all' } = req.query;

        if (type === 'all' || type === 'siblings') {
            await cacheManager.pool.execute('DELETE FROM character_siblings');
        }

        if (type === 'all' || type === 'profiles') {
            await cacheManager.pool.execute('DELETE FROM character_profiles');
        }

        res.json({
            success: true,
            message: `캐시 초기화 완료: ${type}`,
            cleared: type
        });
    } catch (error) {
        console.error('캐시 초기화 실패:', error);
        res.status(500).json({
            success: false,
            error: '캐시 초기화 실패',
            details: error.message
        });
    }
});

/**
 * OCR 기록 저장 API
 * 
 * POST /api/save-record
 * - OCR 분석 결과를 데이터베이스에 저장
 * - 이미지 파일은 로컬에 저장하고 경로만 DB에 저장
 */
app.post('/api/save-record', upload.single('image'), async (req, res) => {
    let connection;
    try {
        console.log('📊 OCR 기록 저장 요청 수신...');
        console.log('요청 데이터:', req.body);
        console.log('업로드된 파일:', req.file);

        // JSON 데이터 파싱
        const {
            characterName,
            characterClass,
            raidName,
            gateNumber,
            difficulty,
            combatTime,
            ocrData
        } = req.body;

        // 필수 필드 검증
        if (!characterName || !raidName) {
            return res.status(400).json({
                success: false,
                error: '캐릭터명과 레이드명은 필수입니다.'
            });
        }

        // OCR 데이터 파싱 (문자열로 전송된 경우)
        let parsedOcrData = {};
        try {
            parsedOcrData = typeof ocrData === 'string' ? JSON.parse(ocrData) : ocrData;
        } catch (parseError) {
            console.error('OCR 데이터 파싱 오류:', parseError);
            parsedOcrData = {};
        }

        // 이미지 파일 처리
        let imagePath = null;
        if (req.file) {
            // 새로운 파일명 생성: img_YYYYMMDD_nanoid(6).ext
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const fileExtension = path.extname(req.file.originalname);
            const newFileName = `img_${today}_${nanoid(6)}${fileExtension}`;
            const newFilePath = path.join(uploadDir, newFileName);

            // 파일 이름 변경
            fs.renameSync(req.file.path, newFilePath);
            imagePath = `uploads/${newFileName}`;

            console.log(`📷 이미지 저장: ${imagePath}`);
        }

        // 데이터베이스 트랜잭션 시작
        connection = await executeQuery('START TRANSACTION');

        // 1. 메인 레코드 저장 (ocr_records 테이블)
        const recordId = nanoid(10); // UUID 대신 nanoid 사용
        const insertRecordQuery = `
            INSERT INTO ocr_records (
                id, character_name, character_class, raid_name, 
                gate_number, difficulty, combat_time, 
                image_url, raw_ocr_data, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        await executeQuery(insertRecordQuery, [
            recordId,
            characterName,
            characterClass || null,
            raidName,
            gateNumber ? parseInt(gateNumber) : null,
            difficulty || null,
            combatTime || null,
            imagePath,
            JSON.stringify(parsedOcrData)
        ]);

        console.log(`✅ 메인 레코드 저장 완료: ${recordId}`);

        // 2. 스탯 데이터 저장 (ocr_stats 테이블)
        let statsCount = 0;
        if (parsedOcrData && Object.keys(parsedOcrData).length > 0) {
            const insertStatQuery = `
                INSERT INTO ocr_stats (
                    id, record_id, stat_name, stat_value, stat_category, created_at
                ) VALUES (?, ?, ?, ?, ?, NOW())
            `;

            for (const [statName, statValue] of Object.entries(parsedOcrData)) {
                if (statValue !== null && statValue !== undefined) {
                    const statId = nanoid(10);

                    // 스탯 카테고리 자동 분류
                    let category = 'general';
                    if (statName.includes('피해') || statName.includes('데미지')) {
                        category = 'damage';
                    } else if (statName.includes('시간') || statName.includes('Time')) {
                        category = 'time';
                    } else if (statName.includes('회복') || statName.includes('힐')) {
                        category = 'healing';
                    }

                    await executeQuery(insertStatQuery, [
                        statId,
                        recordId,
                        statName,
                        String(statValue),
                        category
                    ]);

                    statsCount++;
                }
            }
        }

        // 트랜잭션 커밋
        await executeQuery('COMMIT');

        console.log(`✅ OCR 기록 저장 완료: 메인 1건, 스탯 ${statsCount}건`);

        res.json({
            success: true,
            message: 'OCR 기록이 성공적으로 저장되었습니다.',
            data: {
                recordId,
                characterName,
                raidName,
                statsCount,
                imagePath,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        // 트랜잭션 롤백
        if (connection) {
            try {
                await executeQuery('ROLLBACK');
            } catch (rollbackError) {
                console.error('롤백 오류:', rollbackError);
            }
        }

        console.error('OCR 기록 저장 실패:', error);
        res.status(500).json({
            success: false,
            error: 'OCR 기록 저장 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

app.listen(PORT, async () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);

    // MySQL 연결 테스트
    await testConnection();
});