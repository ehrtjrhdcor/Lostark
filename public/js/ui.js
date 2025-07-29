// UI 상호작용, 페이지 전환

// 페이지 전환 함수
function showPage(pageId) {
    // 모든 페이지 숨기기
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // 선택된 페이지 보이기
    document.getElementById(pageId).classList.add('active');

    // 사이드바 메뉴 활성 상태 업데이트
    const menuItems = document.querySelectorAll('.sidebar a');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });

    // 클릭된 메뉴 항목에 active 클래스 추가
    event.target.classList.add('active');
}

// features 페이지 API 로딩 표시
function showApiLoading() {
    const apiResult = document.getElementById('apiResult');
    apiResult.classList.remove('hidden');
    apiResult.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <h3>API 연결 테스트 중...</h3>
            <p>로스트아크 API에 연결하고 있습니다.</p>
        </div>
    `;
}

// features 페이지 API 에러 표시
function showApiError(message) {
    const apiResult = document.getElementById('apiResult');
    apiResult.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
            <h3>❌ API 연결 실패</h3>
            <p>${message}</p>
            <small>API 키를 확인하고 다시 시도해주세요.</small>
        </div>
    `;
}

// about 페이지 API 로딩 표시
function showAboutApiLoading() {
    const aboutApiResult = document.getElementById('aboutApiResult');
    aboutApiResult.classList.remove('hidden');
    aboutApiResult.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <h3>API 연결 테스트 중...</h3>
            <p>로스트아크 API에 연결하고 있습니다.</p>
        </div>
    `;
}

// about 페이지 API 에러 표시
function showAboutApiError(message) {
    const aboutApiResult = document.getElementById('aboutApiResult');
    aboutApiResult.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
            <h3>❌ API 연결 실패</h3>
            <p>${message}</p>
            <small>API 키를 확인하고 다시 시도해주세요.</small>
        </div>
    `;
}

// 캐릭터 검색 에러 표시
function showCharacterSearchError(message) {
    const characterSearchResult = document.getElementById('characterSearchResult');
    characterSearchResult.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
            <h3>❌ 검색 실패</h3>
            <p>${message}</p>
            <small>캐릭터명을 확인하고 다시 시도해주세요.</small>
        </div>
    `;
}