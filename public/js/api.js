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
 * 개별 캐릭터 검색
 * @param {string} characterName - 검색할 캐릭터명
 */
function searchCharacter(characterName) {
    const characterSearchResult = document.getElementById('characterSearchResult');
    characterSearchResult.style.display = 'block';
    characterSearchResult.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <h3>캐릭터 검색 중...</h3>
            <p>"${characterName}" 캐릭터의 형제 캐릭터 목록을 가져오고 있습니다.</p>
        </div>
    `;

    // 추가 로딩 단계를 위한 변수
    let currentStep = 1;

    // 1단계: 형제 캐릭터 목록 조회
    fetch(getApiEndpoint('character'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: getRequestBody('character', window.currentApiKey, characterName)
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
                // 형제 캐릭터 목록을 찾았으면 프로필 로딩 메시지 표시
                if (data.result && data.result.length > 0) {
                    characterSearchResult.innerHTML = `
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            <h3>캐릭터 프로필 로딩 중...</h3>
                            <p>${data.result.length}명의 형제 캐릭터 정보를 가져오고 있습니다.</p>
                            <div style="margin-top: 15px;">
                                <div style="background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden;">
                                    <div id="profileLoadingBar" style="background: #3498db; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
                                </div>
                                <p style="margin-top: 10px; font-size: 14px; color: #666;">
                                    <span id="profileProgress">0</span> / ${data.result.length} 완료
                                </p>
                            </div>
                        </div>
                    `;
                    
                    // 프로필 로딩 진행상황 시뮬레이션
                    simulateProfileLoading(data.result.length, data.profiles);
                } else {
                    showCharacterSearchError('형제 캐릭터를 찾을 수 없습니다.');
                }
            } else {
                showCharacterSearchError(data.error || '캐릭터를 찾을 수 없습니다.');
            }
        })
        .catch(error => {
            console.error('캐릭터 검색 오류:', error);
            showCharacterSearchError('서버와 연결할 수 없습니다.');
        });
}

/**
 * 프로필 로딩 진행상황 시뮬레이션
 * @param {number} totalCount - 전체 캐릭터 수
 * @param {Array} profiles - 프로필 데이터
 */
function simulateProfileLoading(totalCount, profiles) {
    const progressBar = document.getElementById('profileLoadingBar');
    const progressText = document.getElementById('profileProgress');
    let currentProgress = 0;
    
    // 서버에서 실제 처리 시간을 고려한 진행률 업데이트
    const updateInterval = 300; // 300ms마다 업데이트
    const totalTime = Math.min(totalCount * 200, 2000); // 최대 2초
    const incrementPerUpdate = (100 / (totalTime / updateInterval));
    
    const progressInterval = setInterval(() => {
        currentProgress += incrementPerUpdate;
        const displayProgress = Math.min(Math.floor(currentProgress), totalCount);
        
        if (progressBar && progressText) {
            progressBar.style.width = `${(displayProgress / totalCount) * 100}%`;
            progressText.textContent = displayProgress;
        }
        
        if (currentProgress >= totalCount) {
            clearInterval(progressInterval);
            // 로딩 완료 후 잠시 대기 후 결과 표시
            setTimeout(() => {
                if (profiles && profiles.length > 0) {
                    displayCharacterImagesForAbout(profiles);
                } else {
                    showCharacterSearchError('캐릭터 프로필을 가져올 수 없습니다.');
                }
            }, 500);
        }
    }, updateInterval);
}