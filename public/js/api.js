// 로스트아크 API 관련 함수들

// API 상수
const API_BASE_URL = 'https://developer-lostark.game.onstove.com/';

// features 페이지 API 테스트
function testLostArkAPI(apiKey) {
    fetch('/api/lostark/test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey: apiKey })
    })
    .then(response => response.json())
    .then(data => {
        const apiResult = document.getElementById('apiResult');
        if (data.success) {
            apiResult.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #27ae60;">
                    <h3>✅ API 연결 성공!</h3>
                    <p>로스트아크 API가 정상적으로 연결되었습니다.</p>
                </div>
            `;

            // 크롬 콘솔에 siblings 응답 출력
            console.log('=== 🏹 로스트아크 API 응답 ===');
            console.log('Siblings 데이터:', data.result);

            // 각 캐릭터의 프로필 정보 콘솔 출력
            if (data.profiles && data.profiles.length > 0) {
                console.log(`\n=== 📋 ${data.profiles.length}명의 캐릭터 프로필 정보 ===`);
                data.profiles.forEach((profile, index) => {
                    if (profile.success) {
                        console.log(`\n${index + 1}. ✅ ${profile.character} 프로필:`);
                        console.log(profile.data);
                    } else {
                        console.log(`\n${index + 1}. ❌ ${profile.character} 프로필 조회 실패:`);
                        console.log(profile.error);
                    }
                });
                console.log('\n=== 모든 캐릭터 프로필 출력 완료 ===');

                // 캐릭터 이미지를 웹에 표시
                displayCharacterImages(data.profiles);
            }
        } else {
            showApiError(data.error || '알 수 없는 오류가 발생했습니다.');
        }
    })
    .catch(error => {
        console.error('API 호출 오류:', error);
        showApiError('서버와 연결할 수 없습니다.');
    });
}

// about 페이지 API 테스트
function testAboutLostArkAPI(apiKey) {
    fetch('/api/lostark/test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey: apiKey })
    })
    .then(response => response.json())
    .then(data => {
        const aboutApiResult = document.getElementById('aboutApiResult');
        if (data.success) {
            window.currentApiKey = apiKey;
            aboutApiResult.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #27ae60;">
                    <h3>✅ API 연결 성공!</h3>
                    <p>로스트아크 API가 정상적으로 연결되었습니다.</p>
                    <p>이제 캐릭터를 검색할 수 있습니다.</p>
                </div>
            `;
            
            // 캐릭터 검색 활성화
            const characterSearchInput = document.getElementById('characterSearchInput');
            const characterSearchBtn = document.getElementById('characterSearchBtn');
            characterSearchInput.disabled = false;
            characterSearchBtn.disabled = false;
            characterSearchInput.focus();
        } else {
            showAboutApiError(data.error || '알 수 없는 오류가 발생했습니다.');
        }
    })
    .catch(error => {
        console.error('API 호출 오류:', error);
        showAboutApiError('서버와 연결할 수 없습니다.');
    });
}

// 개별 캐릭터 검색
function searchCharacter(characterName) {
    const characterSearchResult = document.getElementById('characterSearchResult');
    characterSearchResult.style.display = 'block';
    characterSearchResult.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <h3>캐릭터 검색 중...</h3>
            <p>"${characterName}" 캐릭터 정보를 가져오고 있습니다.</p>
        </div>
    `;

    fetch('/api/lostark/character', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            apiKey: window.currentApiKey,
            characterName: characterName 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayCharacterCard(data.character, characterName);
        } else {
            showCharacterSearchError(data.error || '캐릭터를 찾을 수 없습니다.');
        }
    })
    .catch(error => {
        console.error('캐릭터 검색 오류:', error);
        showCharacterSearchError('서버와 연결할 수 없습니다.');
    });
}