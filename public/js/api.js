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
        // Vercel에서는 서버에서 API 키를 관리하므로 apiKey를 보내지 않음
        return JSON.stringify({
            action: action,
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

    // Vercel 환경에서는 API 키를 보내지 않음
    const action = 'character'; // character 대신 test 사용
    fetch(getApiEndpoint(action), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: getRequestBody(action, apiKey, characterName)
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
 * 캐릭터 데이터 강제 갱신 함수
 * @param {string} characterName - 갱신할 캐릭터명
 */
function refreshCharacterData(characterName) {
    showApiLoading('캐시를 무시하고 최신 데이터를 조회 중입니다...');

    const action = 'character_refresh';
    fetch(getApiEndpoint(action), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: getRequestBody(action, null, characterName)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // 강제 갱신 성공 후 캐릭터 목록 표시
            if (data.result && data.result.length > 0) {
                displayCharacterImages(data.profiles || []);
                
                // 성공 메시지 표시
                const apiResult = document.getElementById('apiResult');
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.style.cssText = 'background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #c3e6cb;';
                successMessage.innerHTML = `
                    <strong>✅ 데이터 갱신 완료!</strong><br>
                    형제 캐릭터: ${data.refreshed.siblings}명<br>
                    프로필 갱신: ${data.refreshed.profiles}명<br>
                    소요시간: ${data.refreshed.totalTime}ms
                `;
                
                // 로딩 제거 후 성공 메시지 추가
                const loadingDiv = apiResult.querySelector('.loading');
                if (loadingDiv) {
                    loadingDiv.replaceWith(successMessage);
                } else {
                    apiResult.insertBefore(successMessage, apiResult.firstChild);
                }
                
                // 3초 후 성공 메시지 제거
                setTimeout(() => {
                    if (successMessage.parentNode) {
                        successMessage.remove();
                    }
                }, 3000);
                
            } else {
                showApiError('형제 캐릭터를 찾을 수 없습니다.');
            }
        } else {
            showApiError(data.error || '데이터 갱신에 실패했습니다.');
        }
    })
    .catch(error => {
        console.error('데이터 갱신 오류:', error);
        showApiError('서버와 연결할 수 없습니다.');
    });
}


