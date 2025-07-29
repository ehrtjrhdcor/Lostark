// 모달 관련 기능

// 이미지 분석 모달 열기
function openImageAnalysisModal(characterName, raid, difficulty) {
    const modal = document.getElementById('imageAnalysisModal');
    const modalCharacterName = document.getElementById('modalCharacterName');
    const modalRaidName = document.getElementById('modalRaidName');
    
    modalCharacterName.textContent = characterName;
    modalRaidName.textContent = `${raid} [${difficulty}]`;
    
    modal.style.display = 'block';
    
    // 모달 내 파일 업로드 이벤트 초기화
    initModalFileUpload();
    
    console.log(`이미지 분석 모달 열림: ${characterName} - ${raid} [${difficulty}]`);
}

// 이미지 분석 모달 닫기
function closeImageAnalysisModal() {
    const modal = document.getElementById('imageAnalysisModal');
    modal.style.display = 'none';
    
    // 모달 내용 초기화
    document.getElementById('modalFileInput').value = '';
    document.getElementById('modalImagePreview').classList.add('hidden');
    document.getElementById('modalAnalysisResult').classList.add('hidden');
}

// 모달 내 파일 업로드 초기화
function initModalFileUpload() {
    const modalFileInput = document.getElementById('modalFileInput');
    const modalSelectBtn = document.getElementById('modalSelectBtn');
    const modalUploadBox = document.getElementById('modalUploadBox');
    const modalImagePreview = document.getElementById('modalImagePreview');
    const modalPreviewImage = document.getElementById('modalPreviewImage');
    const modalAnalysisResult = document.getElementById('modalAnalysisResult');

    // 기존 이벤트 리스너 제거를 위한 복제
    const newModalSelectBtn = modalSelectBtn.cloneNode(true);
    modalSelectBtn.parentNode.replaceChild(newModalSelectBtn, modalSelectBtn);
    
    const newModalUploadBox = modalUploadBox.cloneNode(true);
    modalUploadBox.parentNode.replaceChild(newModalUploadBox, modalUploadBox);
    
    const newModalFileInput = modalFileInput.cloneNode(true);
    modalFileInput.parentNode.replaceChild(newModalFileInput, modalFileInput);

    // 새로운 요소들로 참조 업데이트
    const updatedModalFileInput = document.getElementById('modalFileInput');
    const updatedModalSelectBtn = document.getElementById('modalSelectBtn');
    const updatedModalUploadBox = document.getElementById('modalUploadBox');

    // 파일 선택 버튼 클릭
    updatedModalSelectBtn.addEventListener('click', function() {
        updatedModalFileInput.click();
    });

    // 파일 업로드 박스 클릭
    updatedModalUploadBox.addEventListener('click', function() {
        updatedModalFileInput.click();
    });

    // 파일 선택 이벤트
    updatedModalFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleModalImageUpload(file);
        }
    });

    // 드래그 앤 드롭 이벤트
    updatedModalUploadBox.addEventListener('dragover', function(e) {
        e.preventDefault();
        updatedModalUploadBox.classList.add('dragover');
    });

    updatedModalUploadBox.addEventListener('dragleave', function(e) {
        e.preventDefault();
        updatedModalUploadBox.classList.remove('dragover');
    });

    updatedModalUploadBox.addEventListener('drop', function(e) {
        e.preventDefault();
        updatedModalUploadBox.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleModalImageUpload(files[0]);
        }
    });
}

// 모달에서 이미지 업로드 처리
function handleModalImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
    }

    const modalImagePreview = document.getElementById('modalImagePreview');
    const modalPreviewImage = document.getElementById('modalPreviewImage');
    const modalAnalysisResult = document.getElementById('modalAnalysisResult');

    const reader = new FileReader();
    reader.onload = function(e) {
        modalPreviewImage.src = e.target.result;
        modalImagePreview.classList.remove('hidden');
        showModalLoading();
        analyzeModalImage(file);
    };
    reader.readAsDataURL(file);
}

// 모달 로딩 표시
function showModalLoading() {
    const modalAnalysisResult = document.getElementById('modalAnalysisResult');
    modalAnalysisResult.classList.remove('hidden');
    modalAnalysisResult.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <h3>이미지 분석 중...</h3>
            <p>레이드 스크린샷을 분석하고 있습니다.</p>
        </div>
    `;
}

// 모달에서 이미지 분석
function analyzeModalImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    fetch('/api/ocr', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const modalAnalysisResult = document.getElementById('modalAnalysisResult');
        if (data.success && data.table_html) {
            modalAnalysisResult.innerHTML = data.table_html;
        } else {
            showModalError(data.error || '알 수 없는 오류가 발생했습니다.');
        }
    })
    .catch(error => {
        console.error('분석 오류:', error);
        showModalError('서버와 연결할 수 없습니다.');
    });
}

// 모달 에러 표시
function showModalError(message) {
    const modalAnalysisResult = document.getElementById('modalAnalysisResult');
    modalAnalysisResult.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
            <h3>❌ 오류 발생</h3>
            <p>${message}</p>
            <small>다른 이미지로 다시 시도해보세요.</small>
        </div>
    `;
}