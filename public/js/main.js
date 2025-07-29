// 메인 초기화 코드

// 전역 변수
window.currentApiKey = '';

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function () {
    initializeEventListeners();
    initializeModalEvents();
});

// 이벤트 리스너 초기화
function initializeEventListeners() {
    // features 페이지 API 연결 버튼
    const connectBtn = document.getElementById('connectBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    
    if (connectBtn && apiKeyInput) {
        connectBtn.addEventListener('click', function () {
            const apiKey = apiKeyInput.value.trim();
            if (!apiKey) {
                alert('API 키를 입력해주세요.');
                return;
            }
            
            showApiLoading();
            testLostArkAPI(apiKey);
        });
    }

    // about 페이지 API 연결 버튼
    const aboutConnectBtn = document.getElementById('aboutConnectBtn');
    const aboutApiKeyInput = document.getElementById('aboutApiKeyInput');
    const characterSearchInput = document.getElementById('characterSearchInput');
    const characterSearchBtn = document.getElementById('characterSearchBtn');
    
    if (aboutConnectBtn && aboutApiKeyInput) {
        aboutConnectBtn.addEventListener('click', function () {
            const apiKey = aboutApiKeyInput.value.trim();
            if (!apiKey) {
                alert('API 키를 입력해주세요.');
                return;
            }
            
            showAboutApiLoading();
            testAboutLostArkAPI(apiKey);
        });
    }

    // 캐릭터 검색 버튼
    if (characterSearchBtn && characterSearchInput) {
        characterSearchBtn.addEventListener('click', function () {
            const characterName = characterSearchInput.value.trim();
            if (!characterName) {
                alert('캐릭터명을 입력해주세요.');
                return;
            }
            
            if (!window.currentApiKey) {
                alert('먼저 API 키를 연결해주세요.');
                return;
            }
            
            searchCharacter(characterName);
        });

        // 캐릭터 검색 입력 엔터키 이벤트
        characterSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                characterSearchBtn.click();
            }
        });
    }
}

// 모달 관련 이벤트 초기화
function initializeModalEvents() {
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('imageAnalysisModal');
        if (e.target === modal) {
            closeImageAnalysisModal();
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('imageAnalysisModal');
            if (modal && modal.style.display === 'block') {
                closeImageAnalysisModal();
            }
        }
    });
}

// 전역 함수로 showPage 노출 (HTML onclick에서 사용)
window.showPage = showPage;
window.closeImageAnalysisModal = closeImageAnalysisModal;