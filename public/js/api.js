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
        window.location.hostname.includes('netlify') ||
        (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

    if (isVercel) {
        return '/api/lostark';
    } else {
        // 로컬 환경
        switch (action) {
            case 'test': return '/api/lostark/test';
            case 'connect': return '/api/lostark/connect';
            case 'character': return '/api/lostark/character';
            default: return '/api/lostark/test';
        }
    }
}

/**
 * API 요청 본문 생성
 */
function getRequestBody(action, apiKey, characterName = null) {
    const isVercel = window.location.hostname.includes('vercel') ||
        window.location.hostname.includes('netlify') ||
        (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

    if (isVercel) {
        return JSON.stringify({
            action: action,
            apiKey: apiKey,
            characterName: characterName
        });
    } else {
        const body = { apiKey: apiKey };
        if (characterName) {
            body.characterName = characterName;
        }
        return JSON.stringify(body);
    }
}

/**
 * features 페이지에서 사용하는 로스트아크 API 연결 테스트 함수
 * @param {string} apiKey - 로스트아크 개발자 API 키
 */
function testLostArkAPI(apiKey) {
    showApiLoading();

    // TODO: API 호출 구현
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
                // 성공 시 이미지 카드로 표시
                if (data.profiles && data.profiles.length > 0) {
                    displayCharacterImagesForAbout(data.profiles);
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