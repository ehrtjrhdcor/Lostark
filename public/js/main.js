// 메인 초기화 코드

// 전역 변수
window.currentApiKey = '';

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function () {
    initializeEventListeners();
    initializeModalEvents();
    loadApiKey();
});

// 이벤트 리스너 초기화
function initializeEventListeners() {

    // features 페이지 캐릭터 검색 관련 요소
    const apiKeyInput = document.getElementById('apiKeyInput');
    const featuresCharacterSearchInput = document.getElementById('featuresCharacterSearchInput');
    const featuresCharacterSearchBtn = document.getElementById('featuresCharacterSearchBtn');

    // features 페이지 캐릭터 검색 버튼
    if (featuresCharacterSearchBtn && featuresCharacterSearchInput) {
        featuresCharacterSearchBtn.addEventListener('click', function () {
            const characterName = featuresCharacterSearchInput.value.trim();

            // Vercel 환경 확인
            const isVercel = window.location.hostname.includes('vercel') ||
                window.location.hostname.includes('netlify');

            if (!isVercel) {
                // 로컬 환경에서만 API 키 필요
                const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
                if (!apiKey) {
                    alert('API 키를 입력해주세요.');
                    return;
                }
            }

            if (!characterName) {
                alert('캐릭터명을 입력해주세요.');
                return;
            }

            const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
            testLostArkAPI(apiKey, characterName);
        });

        // 엔터 키 검색 지원
        featuresCharacterSearchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                featuresCharacterSearchBtn.click();
            }
        });

        // API 키 입력창에서도 엔터 키 지원
        apiKeyInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                featuresCharacterSearchInput.focus();
            }
        });
    }

}

// 모달 관련 이벤트 초기화
function initializeModalEvents() {
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function (e) {
        const modal = document.getElementById('imageAnalysisModal');
        if (e.target === modal) {
            closeImageAnalysisModal();
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('imageAnalysisModal');
            if (modal && modal.style.display === 'block') {
                closeImageAnalysisModal();
            }
        }
    });
}

/**
 * 서버에서 API 키를 가져와서 입력창에 자동 설정
 */
async function loadApiKey() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();

        if (data.success && data.apiKey) {
            // features 페이지 API 키 입력창
            const apiKeyInput = document.getElementById('apiKeyInput');
            if (apiKeyInput) {
                apiKeyInput.value = data.apiKey;
            }


            // 전역 변수에도 저장
            window.currentApiKey = data.apiKey;

            console.log('API 키가 자동으로 설정되었습니다.');
        }
    } catch (error) {
        console.error('API 키를 가져오는 중 오류 발생:', error);
        // 오류 발생 시에도 기본값으로 설정 (하드코딩된 값)
        const defaultApiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyIsImtpZCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyJ9.eyJpc3MiOiJodHRwczovL2x1Z HkuZ2FtZS5vbnN0b3ZlLmNvbSIsImF1ZCI6Imh0dHBzOi8vbHVkeS5nYW1lLm9uc3RvdmUuY29tL3Jl c291cmNlcyIsImNsaWVudF9pZCI6IjEwMDAwMDAwMDAwMDExNTIifQ.PUF70zE_m-9vTT_vRQ0TTuDWs ulxRss9ZrW8wSUnGsds65C6NgD-qCmSv45XAuoU0NyJXjmttsbDEf-_-Y8x7im7ycVeooqXJLJXIdZ8ukkJZtm_-0S-WodhcVV7UYj9dvXdTWLyYWmY-y4q2HIIouE6ohPFtcESariEztQ3muVqF2i0FLFfiPN 6KEnbJqVr6XO4XMY1HOQszKATOG0Npb0v0JItBdEwYrudbkxQwF5fd3tct6_v56m_eMo8HkRjka0BeKTShDR7q0MKSd1GXBnrJ9JXOhKMC9kqGqD08YEkR2Nrr2jWsF7E3mHhxUSNZYppcN6G87wj6UnEs5ySpw';

        const apiKeyInput = document.getElementById('apiKeyInput');
        if (apiKeyInput) {
            apiKeyInput.value = defaultApiKey;
        }


        window.currentApiKey = defaultApiKey;
        console.log('기본 API 키가 설정되었습니다.');
    }
}

