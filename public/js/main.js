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

    // 캐릭터 검색 관련 요소
    const aboutApiKeyInput = document.getElementById('aboutApiKeyInput');
    const characterSearchInput = document.getElementById('characterSearchInput');
    const characterSearchBtn = document.getElementById('characterSearchBtn');

    // 캐릭터 검색 버튼
    if (characterSearchBtn && characterSearchInput && aboutApiKeyInput) {
        characterSearchBtn.addEventListener('click', function () {
            const apiKey = aboutApiKeyInput.value.trim();
            const characterName = characterSearchInput.value.trim();
            
            if (!apiKey) {
                alert('API 키를 입력해주세요.');
                return;
            }
            
            if (!characterName) {
                alert('캐릭터명을 입력해주세요.');
                return;
            }
            
            // API 키를 전역 변수에 저장
            window.currentApiKey = apiKey;
            
            searchCharacter(characterName);
        });

        // 엔터 키 검색 지원
        characterSearchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                characterSearchBtn.click();
            }
        });
        
        // API 키 입력창에서도 엔터 키 지원
        aboutApiKeyInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                characterSearchInput.focus();
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