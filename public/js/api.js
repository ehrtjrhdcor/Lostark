/**
 * 로스트아크 API 관련 함수들
 * 서버 API 엔드포인트를 통해 로스트아크 데이터를 가져옴
 */

/**
 * 배포 환경 상수
 */
const DEPLOY_CONFIG = {
    VERCEL_URL: 'https://lostark-lyart.vercel.app'
};

/**
 * 환경에 따른 API 엔드포인트 결정
 * - 로컬 개발: /api/lostark/test, /api/lostark/connect, /api/lostark/character
 * - Vercel 배포: /api/lostark (action 파라미터로 구분)
 */
function getApiEndpoint(action) {
    // Vercel 배포 환경인지 확인 (도메인에 vercel이 포함되어 있으면)
    const isVercel = window.location.hostname.includes('vercel') ||
        window.location.hostname.includes('netlify');
    
    // 로컬 환경 확인 (localhost, 127.0.0.1, 또는 192.168.x.x 대역)
    const isLocal = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        window.location.hostname.startsWith('172.');

    if (isVercel) {
        return '/api/lostark';
    } else if (isLocal) {
        // 로컬 환경
        switch (action) {
            case 'test': return '/api/lostark/test';
            case 'connect': return '/api/lostark/connect';
            case 'character': return '/api/lostark/character';
            default: return '/api/lostark/test';
        }
    } else {
        // 기타 환경은 Vercel 방식 사용
        return '/api/lostark';
    }
}

/**
 * API 요청 본문 생성
 */
function getRequestBody(action, apiKey, characterName = null) {
    const isVercel = window.location.hostname.includes('vercel') ||
        window.location.hostname.includes('netlify');
    
    const isLocal = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        window.location.hostname.startsWith('172.');

    if (isVercel) {
        return JSON.stringify({
            action: action,
            apiKey: apiKey,
            characterName: characterName
        });
    } else if (isLocal) {
        const body = { apiKey: apiKey };
        if (characterName) {
            body.characterName = characterName;
        }
        return JSON.stringify(body);
    } else {
        // 기타 환경은 Vercel 방식 사용
        return JSON.stringify({
            action: action,
            apiKey: apiKey,
            characterName: characterName
        });
    }
}

/**
 * features 페이지에서 사용하는 로스트아크 API 연결 테스트 함수
 * @param {string} apiKey - 로스트아크 개발자 API 키
 * @param {string} characterName - 검색할 캐릭터명
 */
function testLostArkAPI(apiKey, characterName) {
    showApiLoading();

    fetch(getApiEndpoint('character'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: getRequestBody('character', apiKey, characterName)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('서버에서 JSON이 아닌 응답을 받았습니다.');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // API 연결 성공 후 캐릭터 목록 표시
                if (data.result && data.result.length > 0) {
                    displayCharacterImages(data.profiles || []);
                    // 캐릭터 카드 표시 후 로딩 제거
                    const apiResult = document.getElementById('apiResult');
                    const loadingDiv = apiResult.querySelector('.loading');
                    if (loadingDiv) {
                        loadingDiv.remove();
                    }
                } else {
                    showApiError('형제 캐릭터를 찾을 수 없습니다.');
                }
            } else {
                showApiError(data.error || 'API 연결에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('API 테스트 오류:', error);
            showApiError('서버와 연결할 수 없습니다.');
        });
}

/**
 * about 페이지 API 테스트
 * @param {string} apiKey - 로스트아크 개발자 API 키
 */
function testAboutLostArkAPI(apiKey) {
    showAboutApiLoading();

    // TODO: API 호출 구현
}

/**
 * 개별 캐릭터 검색 (about 페이지)
 * 1. 형제 캐릭터 목록 조회
 * 2. 각 캐릭터 프로필 순차 조회 및 실시간 표시
 * @param {string} characterName - 검색할 캐릭터명
 */
async function searchCharacter(characterName) {
    const characterSearchResult = document.getElementById('characterSearchResult');
    characterSearchResult.style.display = 'block';
    characterSearchResult.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <h3>형제 캐릭터 목록 조회 중...</h3>
            <p>"${characterName}" 캐릭터의 형제 캐릭터를 찾고 있습니다.</p>
        </div>
    `;

    try {
        // 1단계: 형제 캐릭터 목록 조회
        const siblingsResponse = await fetch(getApiEndpoint('character_siblings'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: getRequestBody('character_siblings', window.currentApiKey, characterName)
        });

        if (!siblingsResponse.ok) {
            const errorData = await siblingsResponse.json();
            throw new Error(errorData.error || '형제 캐릭터 목록을 가져오는데 실패했습니다.');
        }

        const siblingsData = await siblingsResponse.json();

        if (!siblingsData.success || !siblingsData.result || siblingsData.result.length === 0) {
            showCharacterSearchError('형제 캐릭터를 찾을 수 없습니다.');
            return;
        }

        const characters = siblingsData.result;
        const totalCount = characters.length;

        // 2단계: 프로필 순차 조회를 위한 UI 설정
        characterSearchResult.innerHTML = `
            <div class="loading">
                <h3>캐릭터 프로필 로딩 중...</h3>
                <p>${totalCount}명의 형제 캐릭터 정보를 가져오고 있습니다.</p>
                <div class="progress-bar-container">
                    <div id="profileLoadingBar" class="progress-bar"></div>
                </div>
                <p class="progress-text">
                    <span id="profileProgress">0</span> / ${totalCount} 완료
                </p>
            </div>
            <div id="characterCardContainer" class="character-card-container"></div>
        `;

        const progressBar = document.getElementById('profileLoadingBar');
        const progressText = document.getElementById('profileProgress');
        const characterCardContainer = document.getElementById('characterCardContainer');

        // 각 캐릭터 프로필 순차 조회
        for (let i = 0; i < totalCount; i++) {
            const character = characters[i];
            try {
                const profileResponse = await fetch(getApiEndpoint('character_profile'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: getRequestBody('character_profile', window.currentApiKey, character.CharacterName)
                });

                const profileData = await profileResponse.json();
                appendCharacterCardForAbout(characterCardContainer, profileData);

            } catch (error) {
                console.error(`${character.CharacterName} 프로필 조회 오류:`, error);
                const errorProfile = {
                    character: character.CharacterName,
                    success: false,
                    error: '프로필 조회 실패'
                };
                appendCharacterCardForAbout(characterCardContainer, errorProfile);
            }

            // 진행률 업데이트
            const currentProgress = i + 1;
            progressBar.style.width = `${(currentProgress / totalCount) * 100}%`;
            progressText.textContent = currentProgress;
        }

        // 로딩 완료 후 로딩 UI 숨기기
        const loadingDiv = characterSearchResult.querySelector('.loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }

    } catch (error) {
        console.error('캐릭터 검색 오류:', error);
        showCharacterSearchError(error.message || '서버와 연결할 수 없습니다.');
    }
}

