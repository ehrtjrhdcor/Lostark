// 모달 관련 기능

// 이미지 분석 모달 열기
function openImageAnalysisModal(characterName, raid, difficulty, characterClass) {
    const modal = document.getElementById('imageAnalysisModal');
    const modalCharacterName = document.getElementById('modalCharacterName');
    const modalRaidName = document.getElementById('modalRaidName');

    modalCharacterName.textContent = characterName;
    modalRaidName.textContent = `${raid} [${difficulty}]`;

    modal.style.display = 'block';

    // 모달 바깥 클릭 방지
    modal.onclick = function (event) {
        event.stopPropagation();
    };

    // 모달 콘텐츠 클릭시 전파 중단
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.onclick = function (event) {
            event.stopPropagation();
        };
    }

    // 모달 내 파일 업로드 이벤트 초기화
    initModalFileUpload();

    console.log(`이미지 분석 모달 열림: ${characterName} - ${raid} [${difficulty}]`);
}

// 이미지 분석 모달 닫기
function closeImageAnalysisModal() {
    const modal = document.getElementById('imageAnalysisModal');
    modal.style.display = 'none';

    // 새로운 모달 구조 초기화
    const leftFileInput = document.getElementById('leftFileInput');
    const rightFileInput = document.getElementById('rightFileInput');
    const rightContentArea = document.querySelector('.right-content-area');

    if (leftFileInput) leftFileInput.value = '';
    if (rightFileInput) rightFileInput.value = '';

    // 통계 표 초기화
    const statsInputs = document.querySelectorAll('.stats-input input');
    statsInputs.forEach(input => input.value = '');

    // 오른쪽 영역 초기화 (스킬 표 포함)
    if (rightContentArea) {
        rightContentArea.innerHTML = '';
    }

    // 기존 모달 요소들도 초기화 (호환성 유지)
    const modalFileInput = document.getElementById('modalFileInput');
    const modalImagePreview = document.getElementById('modalImagePreview');
    const modalAnalysisResult = document.getElementById('modalAnalysisResult');

    if (modalFileInput) modalFileInput.value = '';
    if (modalImagePreview) modalImagePreview.classList.add('hidden');
    if (modalAnalysisResult) modalAnalysisResult.classList.add('hidden');
}

// 모달 내 파일 업로드 초기화
function initModalFileUpload() {
    initLeftUpload();
    initRightUpload();
}

// 왼쪽 이미지 업로드 초기화
function initLeftUpload() {
    const leftUploadBox = document.getElementById('leftUploadBox');
    const leftFileInput = document.getElementById('leftFileInput');

    if (!leftUploadBox || !leftFileInput) return;

    // 왼쪽 업로드 박스 클릭
    leftUploadBox.addEventListener('click', function () {
        leftFileInput.click();
    });

    // 왼쪽 파일 선택 이벤트
    leftFileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            handleLeftImageUpload(file);
        }
    });

    // 드래그 앤 드롭 이벤트
    leftUploadBox.addEventListener('dragover', function (e) {
        e.preventDefault();
        leftUploadBox.classList.add('dragover');
    });

    leftUploadBox.addEventListener('dragleave', function (e) {
        e.preventDefault();
        leftUploadBox.classList.remove('dragover');
    });

    leftUploadBox.addEventListener('drop', function (e) {
        e.preventDefault();
        leftUploadBox.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleLeftImageUpload(files[0]);
        }
    });
}

// 오른쪽 이미지 업로드 초기화
function initRightUpload() {
    const rightUploadBox = document.getElementById('rightUploadBox');
    const rightFileInput = document.getElementById('rightFileInput');

    if (!rightUploadBox || !rightFileInput) return;

    // 오른쪽 업로드 박스 클릭
    rightUploadBox.addEventListener('click', function () {
        rightFileInput.click();
    });

    // 오른쪽 파일 선택 이벤트
    rightFileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            handleRightImageUpload(file);
        }
    });

    // 드래그 앤 드롭 이벤트
    rightUploadBox.addEventListener('dragover', function (e) {
        e.preventDefault();
        rightUploadBox.classList.add('dragover');
    });

    rightUploadBox.addEventListener('dragleave', function (e) {
        e.preventDefault();
        rightUploadBox.classList.remove('dragover');
    });

    rightUploadBox.addEventListener('drop', function (e) {
        e.preventDefault();
        rightUploadBox.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleRightImageUpload(files[0]);
        }
    });
}

// 왼쪽 이미지 업로드 처리 (통계용)
function handleLeftImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
    }

    // 이미지 전처리 시작
    preprocessImage(file);
}

// 이미지 표시 및 선택 준비 함수 (전처리 X)
function preprocessImage(file) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function () {
        // 캔버스 크기 설정
        canvas.width = img.width;
        canvas.height = img.height;

        // 이미지를 캔버스에 그리기 (전처리 없이 원본 표시)
        ctx.drawImage(img, 0, 0);

        // Canvas를 페이지에 표시
        displayCanvasForSelection(canvas);

        // 드래그 선택 기능 활성화
        setupDragSelection(canvas);

        console.log('이미지 로드 완료! 원하는 영역을 드래그해서 선택하세요.');
        showLeftUploadStatus('영역을 드래그해서 선택하세요', 'info');
    };

    // 파일을 이미지로 로드
    const reader = new FileReader();
    reader.onload = function (e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Canvas를 페이지에 표시하는 함수
function displayCanvasForSelection(canvas) {
    // 기존 캔버스 제거
    const existingCanvas = document.querySelector('#selectionCanvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }

    // 새 캔버스 설정
    canvas.id = 'selectionCanvas';
    canvas.style.border = '2px solid #007bff';
    canvas.style.cursor = 'crosshair';
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';

    // 왼쪽 업로드 박스 아래에 캔버스 추가
    const leftUploadBox = document.getElementById('leftUploadBox');
    if (leftUploadBox) {
        leftUploadBox.parentNode.insertBefore(canvas, leftUploadBox.nextSibling);
    } else {
        document.body.appendChild(canvas);
    }
}

// 드래그 선택 기능 설정
function setupDragSelection(canvas) {
    let isSelecting = false;
    let startX, startY, currentX, currentY;
    let selectionRect = null;

    // 마우스 다운 (드래그 시작)
    canvas.addEventListener('mousedown', function (e) {
        const rect = canvas.getBoundingClientRect();
        startX = (e.clientX - rect.left) * (canvas.width / rect.width);
        startY = (e.clientY - rect.top) * (canvas.height / rect.height);
        isSelecting = true;

        console.log('드래그 시작:', startX, startY);
        showLeftUploadStatus('드래그 중...', 'info');
    });

    // 마우스 이동 (드래그 중)
    canvas.addEventListener('mousemove', function (e) {
        if (!isSelecting) return;

        const rect = canvas.getBoundingClientRect();
        currentX = (e.clientX - rect.left) * (canvas.width / rect.width);
        currentY = (e.clientY - rect.top) * (canvas.height / rect.height);

        // 선택 영역 그리기
        drawSelectionRect(canvas, startX, startY, currentX, currentY);
    });

    // 마우스 업 (드래그 완료)
    canvas.addEventListener('mouseup', function (e) {
        if (!isSelecting) return;

        const rect = canvas.getBoundingClientRect();
        currentX = (e.clientX - rect.left) * (canvas.width / rect.width);
        currentY = (e.clientY - rect.top) * (canvas.height / rect.height);

        isSelecting = false;

        // 선택 영역 정보 저장
        selectionRect = {
            x: Math.min(startX, currentX),
            y: Math.min(startY, currentY),
            width: Math.abs(currentX - startX),
            height: Math.abs(currentY - startY)
        };

        console.log('선택 완료:', selectionRect);
        showLeftUploadStatus(`영역 선택됨: ${Math.round(selectionRect.width)}x${Math.round(selectionRect.height)}`, 'success');

        // OCR 분석 버튼 표시
        showOCRButton(canvas, selectionRect);
    });
}

// 선택 영역 실시간 그리기 함수
function drawSelectionRect(canvas, startX, startY, currentX, currentY) {
    const ctx = canvas.getContext('2d');

    // 캔버스를 다시 그려서 이전 선택 영역 제거
    const img = new Image();
    img.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // 선택 영역 계산
        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        // 선택 영역 하이라이트
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // 반투명 오버레이
        ctx.fillStyle = 'rgba(255, 0, 102, 0.2)';
        ctx.fillRect(x, y, width, height);

        // 선택 영역 크기 정보 표시
        if (width > 50 && height > 20) {
            ctx.fillStyle = '#ff0066';
            ctx.font = '14px Arial';
            ctx.fillText(`${Math.round(width)} × ${Math.round(height)}`, x + 5, y - 5);
        }
    };

    // 현재 캔버스의 이미지 데이터를 사용
    img.src = canvas.toDataURL();
}

// OCR 분석 버튼 표시 함수
function showOCRButton(canvas, selectionRect) {
    // 기존 버튼 제거
    const existingButton = document.querySelector('#ocrAnalyzeBtn');
    if (existingButton) {
        existingButton.remove();
    }

    // OCR 분석 버튼 생성
    const ocrButton = document.createElement('button');
    ocrButton.id = 'ocrAnalyzeBtn';
    ocrButton.textContent = '🔍 선택 영역 OCR 분석';
    ocrButton.style.cssText = `
        background: #28a745;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        margin: 10px 0;
        display: block;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

    // 버튼 호버 효과
    ocrButton.addEventListener('mouseenter', () => {
        ocrButton.style.background = '#218838';
    });
    ocrButton.addEventListener('mouseleave', () => {
        ocrButton.style.background = '#28a745';
    });

    // 클릭 이벤트
    ocrButton.addEventListener('click', () => {
        processSelectedArea(canvas, selectionRect);
    });

    // 캔버스 아래에 버튼 추가
    canvas.parentNode.insertBefore(ocrButton, canvas.nextSibling);

    console.log('OCR 분석 버튼 생성됨');
}

// 선택 영역 처리 메인 함수
function processSelectedArea(originalCanvas, selectionRect) {
    console.log('선택 영역 처리 시작:', selectionRect);
    showLeftUploadStatus('선택 영역 추출 중...', 'info');

    // 1. 선택 영역만 추출
    const selectedAreaCanvas = extractSelectedArea(originalCanvas, selectionRect);

    // // 2. 추출된 영역에 고급 전처리 적용
    // const processedCanvas = applyAdvancedPreprocessing(selectedAreaCanvas);

    // 3. 전처리된 영역으로 OCR 분석
    performOCROnSelectedArea(selectedAreaCanvas);
}

// 선택된 영역만 추출하는 함수
function extractSelectedArea(originalCanvas, rect) {
    // 새로운 캔버스 생성 (선택 영역 크기)
    const extractedCanvas = document.createElement('canvas');
    extractedCanvas.width = rect.width;
    extractedCanvas.height = rect.height;
    const extractedCtx = extractedCanvas.getContext('2d');

    // 원본 이미지의 선택 영역만 새 캔버스에 그리기
    const originalCtx = originalCanvas.getContext('2d');
    const imageData = originalCtx.getImageData(rect.x, rect.y, rect.width, rect.height);
    extractedCtx.putImageData(imageData, 0, 0);

    console.log(`영역 추출 완료: ${rect.width}x${rect.height}`);

    // 추출된 영역을 화면에 미리보기로 표시
    showExtractedPreview(extractedCanvas);

    return extractedCanvas;
}

// 추출된 영역 미리보기 표시
function showExtractedPreview(extractedCanvas) {
    // 기존 미리보기 제거
    const existingPreview = document.querySelector('#extractedPreview');
    if (existingPreview) {
        existingPreview.remove();
    }

    // 미리보기 컨테이너 생성
    const previewContainer = document.createElement('div');
    previewContainer.id = 'extractedPreview';
    previewContainer.style.cssText = `
        margin: 20px 0;
        padding: 15px;
        border: 2px solid #28a745;
        border-radius: 8px;
        background: #f8f9fa;
    `;

    // 제목 추가
    const title = document.createElement('h4');
    title.textContent = '📋 추출된 영역';
    title.style.cssText = `
        color: #28a745;
        margin: 0 0 10px 0;
        font-size: 16px;
    `;
    previewContainer.appendChild(title);

    // 추출된 캔버스 스타일링
    const previewCanvas = extractedCanvas.cloneNode(true);
    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.drawImage(extractedCanvas, 0, 0);

    previewCanvas.style.cssText = `
        border: 1px solid #dee2e6;
        max-width: 300px;
        height: auto;
        display: block;
    `;

    previewContainer.appendChild(previewCanvas);

    // 크기 정보 추가
    const info = document.createElement('p');
    info.textContent = `크기: ${extractedCanvas.width} × ${extractedCanvas.height} 픽셀`;
    info.style.cssText = `
        margin: 10px 0 0 0;
        color: #6c757d;
        font-size: 14px;
    `;
    previewContainer.appendChild(info);

    // OCR 버튼 아래에 미리보기 추가
    const ocrButton = document.querySelector('#ocrAnalyzeBtn');
    if (ocrButton) {
        ocrButton.parentNode.insertBefore(previewContainer, ocrButton.nextSibling);
    }
}

// 선택 영역에 고급 전처리 적용
function applyAdvancedPreprocessing(selectedCanvas) {
    console.log('선택 영역 고급 전처리 시작...');
    showLeftUploadStatus('고급 전처리 적용 중...', 'info');

    // 전처리할 캔버스 복사
    const processCanvas = document.createElement('canvas');
    processCanvas.width = selectedCanvas.width;
    processCanvas.height = selectedCanvas.height;
    const processCtx = processCanvas.getContext('2d');
    processCtx.drawImage(selectedCanvas, 0, 0);

    // === 고급 전처리 단계별 적용 ===

    // 1단계: 해상도 향상 (2배 확대)
    console.log('1/6: 해상도 향상...');
    const scaledCanvas = scaleUpImage(processCanvas, processCtx, 2.0);
    const scaledCtx = scaledCanvas.getContext('2d');

    // 2단계: 노이즈 제거 (Gaussian blur)
    console.log('2/6: 노이즈 제거...');
    applyGaussianBlur(scaledCanvas, scaledCtx, 1.0);

    // 3단계: 그레이스케일 변환
    console.log('3/6: 그레이스케일 변환...');
    convertToGrayscale(scaledCanvas, scaledCtx);

    // 4단계: 히스토그램 평활화
    console.log('4/6: 히스토그램 평활화...');
    applyHistogramEqualization(scaledCanvas, scaledCtx);

    // 5단계: 대비 향상 및 선명화
    console.log('5/6: 대비 향상 및 선명화...');
    enhanceContrastAndSharpness(scaledCanvas, scaledCtx);

    // 6단계: 적응형 이진화
    console.log('6/6: 적응형 이진화...');
    applyAdaptiveThreshold(scaledCanvas, scaledCtx);

    console.log('선택 영역 고급 전처리 완료!');
    showLeftUploadStatus('전처리 완료, OCR 분석 중...', 'info');

    // 전처리된 결과 미리보기 표시
    showProcessedPreview(scaledCanvas);

    return scaledCanvas;
}

// 전처리된 결과 미리보기 표시
function showProcessedPreview(processedCanvas) {
    // 기존 전처리 미리보기 제거
    const existingProcessed = document.querySelector('#processedPreview');
    if (existingProcessed) {
        existingProcessed.remove();
    }

    // 전처리 결과 컨테이너 생성
    const processedContainer = document.createElement('div');
    processedContainer.id = 'processedPreview';
    processedContainer.style.cssText = `
        margin: 20px 0;
        padding: 15px;
        border: 2px solid #6f42c1;
        border-radius: 8px;
        background: #f8f9fa;
    `;

    // 제목 추가
    const title = document.createElement('h4');
    title.textContent = '🚀 전처리된 영역';
    title.style.cssText = `
        color: #6f42c1;
        margin: 0 0 10px 0;
        font-size: 16px;
    `;
    processedContainer.appendChild(title);

    // 전처리된 캔버스 스타일링
    const previewCanvas = processedCanvas.cloneNode(true);
    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.drawImage(processedCanvas, 0, 0);

    previewCanvas.style.cssText = `
        border: 1px solid #dee2e6;
        max-width: 400px;
        height: auto;
        display: block;
        image-rendering: pixelated;
    `;

    processedContainer.appendChild(previewCanvas);

    // 처리 정보 추가
    const info = document.createElement('p');
    info.textContent = `크기: ${processedCanvas.width} × ${processedCanvas.height} 픽셀 (6단계 전처리 완료)`;
    info.style.cssText = `
        margin: 10px 0 0 0;
        color: #6c757d;
        font-size: 14px;
    `;
    processedContainer.appendChild(info);

    // 추출된 영역 미리보기 아래에 전처리 결과 추가
    const extractedPreview = document.querySelector('#extractedPreview');
    if (extractedPreview) {
        extractedPreview.parentNode.insertBefore(processedContainer, extractedPreview.nextSibling);
    }
}

// 선택 영역 전용 OCR 분석
function performOCROnSelectedArea(processedCanvas) {
    console.log('선택 영역 OCR 분석 시작...');
    showLeftUploadStatus('OCR 분석 중...', 'info');

    // Tesseract.js로 선택 영역만 OCR 분석
    Tesseract.recognize(
        processedCanvas,
        'kor+eng', // 한국어 + 영어
        {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round(m.progress * 100);
                    showLeftUploadStatus(`OCR 진행중... ${progress}%`, 'info');
                    console.log(`OCR 진행률: ${progress}%`);
                }
            },
            // 고급 OCR 설정
            tessedit_pageseg_mode: '6', // 단일 텍스트 블록 모드
            tessedit_ocr_engine_mode: '1', // LSTM 엔진
            preserve_interword_spaces: '1', // 단어 간 공백 보존
        }
    ).then(({ data: { text, confidence, words } }) => {
        console.log('=== 선택 영역 OCR 완료 ===');
        console.log('추출된 텍스트:', text);
        console.log('전체 신뢰도:', Math.round(confidence) + '%');
        console.log('단어별 분석:', words);

        if (confidence > 30) {
            showLeftUploadStatus('OCR 분석 완료!', 'success');

            // OCR 결과를 기존 텍스트 처리 파이프라인으로 전달
            processOCRResult(text, confidence);

            // 선택 영역 OCR 전용 결과 표시
            showSelectedAreaOCRResult(text, confidence, words, processedCanvas);
        } else {
            showLeftUploadStatus('OCR 분석 실패 (낮은 신뢰도)', 'error');
            console.log('OCR 신뢰도가 너무 낮습니다:', confidence + '%');

            // 낮은 신뢰도여도 결과는 표시
            showSelectedAreaOCRResult(text, confidence, words, processedCanvas, true);
        }
    }).catch(error => {
        console.error('선택 영역 OCR 오류:', error);
        showLeftUploadStatus('OCR 분석 중 오류 발생', 'error');
    });
}

// 선택 영역 OCR 결과 전용 표시
function showSelectedAreaOCRResult(text, confidence, words, processedCanvas, isLowConfidence = false) {
    // 기존 OCR 결과 제거
    const existingResult = document.querySelector('#selectedOCRResult');
    if (existingResult) {
        existingResult.remove();
    }

    // OCR 결과 컨테이너 생성
    const resultContainer = document.createElement('div');
    resultContainer.id = 'selectedOCRResult';
    const borderColor = isLowConfidence ? '#dc3545' : '#17a2b8';
    resultContainer.style.cssText = `
        margin: 20px 0;
        padding: 20px;
        border: 3px solid ${borderColor};
        border-radius: 10px;
        background: ${isLowConfidence ? '#f8d7da' : '#d1ecf1'};
    `;

    // 제목 추가
    const title = document.createElement('h3');
    title.textContent = isLowConfidence ? '⚠️ OCR 결과 (낮은 신뢰도)' : '🎯 선택 영역 OCR 결과';
    title.style.cssText = `
        color: ${borderColor};
        margin: 0 0 15px 0;
        font-size: 18px;
    `;
    resultContainer.appendChild(title);

    // 추출된 텍스트 표시
    const textResult = document.createElement('div');
    textResult.style.cssText = `
        background: white;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #dee2e6;
        margin-bottom: 15px;
        font-family: 'Courier New', monospace;
        white-space: pre-wrap;
        font-size: 16px;
        line-height: 1.4;
    `;
    textResult.textContent = text || '(텍스트를 추출하지 못했습니다)';
    resultContainer.appendChild(textResult);

    // 통계 정보
    const stats = document.createElement('div');
    stats.style.cssText = `
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 4px;
        font-size: 14px;
    `;

    const confidenceColor = confidence > 70 ? '#28a745' : confidence > 30 ? '#ffc107' : '#dc3545';
    stats.innerHTML = `
        <span><strong>신뢰도:</strong> <span style="color: ${confidenceColor}; font-weight: bold;">${Math.round(confidence)}%</span></span>
        <span><strong>추출된 단어 수:</strong> ${words ? words.length : 0}개</span>
        <span><strong>처리 크기:</strong> ${processedCanvas.width}×${processedCanvas.height}px</span>
    `;
    resultContainer.appendChild(stats);

    // 단어별 신뢰도 표시 (높은 신뢰도인 경우만)
    if (!isLowConfidence && words && words.length > 0) {
        const wordsTitle = document.createElement('h5');
        wordsTitle.textContent = '📝 단어별 분석';
        wordsTitle.style.cssText = 'color: #495057; margin: 15px 0 10px 0;';
        resultContainer.appendChild(wordsTitle);

        const wordsContainer = document.createElement('div');
        wordsContainer.style.cssText = `
            max-height: 200px;
            overflow-y: auto;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 10px;
        `;

        words.forEach(word => {
            const wordSpan = document.createElement('span');
            const wordConfidence = Math.round(word.confidence);
            const wordColor = wordConfidence > 70 ? '#28a745' : wordConfidence > 30 ? '#ffc107' : '#dc3545';

            wordSpan.style.cssText = `
                display: inline-block;
                margin: 2px;
                padding: 2px 6px;
                background: ${wordColor};
                color: white;
                border-radius: 3px;
                font-size: 12px;
                font-weight: bold;
            `;
            wordSpan.textContent = `${word.text} (${wordConfidence}%)`;
            wordsContainer.appendChild(wordSpan);
        });

        resultContainer.appendChild(wordsContainer);
    }

    // 전처리된 영역 미리보기 아래에 결과 추가
    const processedPreview = document.querySelector('#processedPreview');
    if (processedPreview) {
        processedPreview.parentNode.insertBefore(resultContainer, processedPreview.nextSibling);
    }

    console.log('선택 영역 OCR 결과 표시 완료');
}

// === 고급 전처리 함수들 ===

// 1. 해상도 향상 함수 (Bicubic interpolation 근사)
function scaleUpImage(canvas, ctx, scale) {
    const newWidth = Math.floor(canvas.width * scale);
    const newHeight = Math.floor(canvas.height * scale);

    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = newWidth;
    scaledCanvas.height = newHeight;
    const scaledCtx = scaledCanvas.getContext('2d');

    // 고품질 스케일링 설정
    scaledCtx.imageSmoothingEnabled = true;
    scaledCtx.imageSmoothingQuality = 'high';

    // 이미지 확대
    scaledCtx.drawImage(canvas, 0, 0, newWidth, newHeight);

    console.log(`해상도 향상: ${canvas.width}x${canvas.height} → ${newWidth}x${newHeight}`);
    return scaledCanvas;
}

// 2. 가우시안 블러 (노이즈 제거)
function applyGaussianBlur(canvas, ctx, radius) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // 간단한 박스 블러로 가우시안 블러 근사
    const tempData = new Uint8ClampedArray(data);
    const kernelSize = Math.max(1, Math.floor(radius * 2));

    for (let y = kernelSize; y < height - kernelSize; y++) {
        for (let x = kernelSize; x < width - kernelSize; x++) {
            let r = 0, g = 0, b = 0, count = 0;

            // 커널 적용
            for (let ky = -kernelSize; ky <= kernelSize; ky++) {
                for (let kx = -kernelSize; kx <= kernelSize; kx++) {
                    const idx = ((y + ky) * width + (x + kx)) * 4;
                    r += tempData[idx];
                    g += tempData[idx + 1];
                    b += tempData[idx + 2];
                    count++;
                }
            }

            const idx = (y * width + x) * 4;
            data[idx] = r / count;
            data[idx + 1] = g / count;
            data[idx + 2] = b / count;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    console.log('가우시안 블러 적용 완료');
}

// 3. 그레이스케일 변환
function convertToGrayscale(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);
    console.log('그레이스케일 변환 완료');
}

// 4. 히스토그램 평활화
function applyHistogramEqualization(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const histogram = new Array(256).fill(0);

    // 히스토그램 계산
    for (let i = 0; i < data.length; i += 4) {
        histogram[data[i]]++;
    }

    // 누적 분포 함수 계산
    const cdf = new Array(256).fill(0);
    cdf[0] = histogram[0];
    for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + histogram[i];
    }

    // 정규화
    const totalPixels = canvas.width * canvas.height;
    const cdfMin = cdf.find(val => val > 0);

    // 평활화 적용
    for (let i = 0; i < data.length; i += 4) {
        const oldValue = data[i];
        const newValue = Math.round(((cdf[oldValue] - cdfMin) / (totalPixels - cdfMin)) * 255);
        data[i] = newValue;
        data[i + 1] = newValue;
        data[i + 2] = newValue;
    }

    ctx.putImageData(imageData, 0, 0);
    console.log('히스토그램 평활화 완료');
}

// 5. 대비 향상 및 선명화 (Unsharp mask)
function enhanceContrastAndSharpness(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const tempData = new Uint8ClampedArray(data);
    const width = canvas.width;
    const height = canvas.height;

    // Unsharp mask 커널 (-1 주변, +9 중앙)
    const kernel = [
        -1, -1, -1,
        -1, 9, -1,
        -1, -1, -1
    ];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let sum = 0;

            // 3x3 커널 적용
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const idx = ((y + ky) * width + (x + kx)) * 4;
                    const kernelIdx = (ky + 1) * 3 + (kx + 1);
                    sum += tempData[idx] * kernel[kernelIdx];
                }
            }

            const idx = (y * width + x) * 4;
            const enhanced = Math.min(255, Math.max(0, sum));
            data[idx] = enhanced;
            data[idx + 1] = enhanced;
            data[idx + 2] = enhanced;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    console.log('대비 향상 및 선명화 완료');
}

// 6. 적응형 이진화 (Adaptive Threshold)
function applyAdaptiveThreshold(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    const windowSize = 15; // 적응형 윈도우 크기
    const c = 10; // 임계값 보정 상수

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            let count = 0;

            // 주변 윈도우의 평균 계산
            const startY = Math.max(0, y - windowSize / 2);
            const endY = Math.min(height - 1, y + windowSize / 2);
            const startX = Math.max(0, x - windowSize / 2);
            const endX = Math.min(width - 1, x + windowSize / 2);

            for (let wy = startY; wy <= endY; wy++) {
                for (let wx = startX; wx <= endX; wx++) {
                    const idx = (wy * width + wx) * 4;
                    sum += data[idx];
                    count++;
                }
            }

            const mean = sum / count;
            const idx = (y * width + x) * 4;
            const threshold = mean - c;

            // 이진화 적용
            const binaryValue = data[idx] > threshold ? 255 : 0;
            data[idx] = binaryValue;
            data[idx + 1] = binaryValue;
            data[idx + 2] = binaryValue;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    console.log('적응형 이진화 완료');
}

// Tesseract OCR 분석 함수
function performOCR(canvas) {
    showLeftUploadStatus('OCR 분석 중...', 'info');

    // Tesseract.js 사용하여 OCR 수행
    Tesseract.recognize(
        canvas,
        'kor', // 한국어 + 영어 인식
        {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round(m.progress * 100);
                    showLeftUploadStatus(`OCR 진행중... ${progress}%`, 'info');
                }
            }
        }
    ).then(({ data: { text, confidence } }) => {
        console.log('OCR 결과:', JSON.stringify({
            text: text,
            confidence: confidence,
            timestamp: new Date().toISOString()
        }, null, 2));

        if (confidence > 30) { // 신뢰도 30% 이상일 때만 결과 표시
            showLeftUploadStatus('OCR 분석 완료', 'success');

            // OCR 결과 처리
            processOCRResult(text, confidence);
        } else {
            showLeftUploadStatus('OCR 분석 실패 (낮은 신뢰도)', 'error');
            console.log('OCR 신뢰도가 너무 낮습니다:', confidence);
        }
    }).catch(error => {
        console.error('OCR 오류:', error);
        showLeftUploadStatus('OCR 분석 중 오류 발생', 'error');
    });
}

// OCR 결과 처리 함수
function processOCRResult(text, confidence) {
    console.log('OCR 텍스트 처리 시작');
    console.log('원본 텍스트:', text);
    console.log('신뢰도:', confidence + '%');

    // 1. 줄바꿈 정리 테스트
    const cleanedText = cleanLineBreaks(text);
    console.log('줄바꿈 정리 후:', cleanedText);

    // 2. 공백 정리 테스트
    const spaceCleaned = cleanWhitespace(cleanedText);
    console.log('공백 정리 후:', spaceCleaned);

    // 3. 구조화된 파싱 테스트
    const parsedData = parseStructuredData(spaceCleaned);
    console.log('파싱된 데이터:', JSON.stringify(parsedData, null, 2));

    // 4. 테이블 형태로 정리 테스트
    const tableData = formatAsTable(parsedData);
    console.log('테이블 형태:\n', tableData);

    // 5. HTML 미리보기 생성 및 표시
    const htmlPreview = generateHTMLPreview(parsedData);
    displayHTMLPreview(htmlPreview);
    console.log('HTML 미리보기 생성 완료!');

    // 다음 단계로 진행 (통계 분석 등)
    // TODO: 게임 통계 분석 함수 호출
}

// 1. 줄바꿈 정리 함수
function cleanLineBreaks(text) {
    return text
        .replace(/\\n/g, '\n')  // \\n을 실제 줄바꿈으로 변환
        .replace(/\n{3,}/g, '\n\n')  // 3개 이상 연속 줄바꿈을 2개로 제한
        .trim();
}

// 2. 공백 정리 함수
function cleanWhitespace(text) {
    return text
        .replace(/\s{4,}/g, '\t')  // 4개 이상 공백을 탭으로 변환
        .replace(/\s{2,}/g, ' ')   // 2개 이상 공백을 1개로 변환 (단, 탭 제외)
        .replace(/\t+/g, '\t')     // 연속 탭을 1개로 변환
        .replace(/\t/g, '    ');   // 탭을 4개 공백으로 변환해서 보기 좋게
}

// 3. 구조화된 파싱 함수
function parseStructuredData(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const data = {};

    lines.forEach(line => {
        // 한글 라벨 + 숫자/퍼센트 패턴 추출
        const patterns = [
            // "피해 증가 유효율    97.86%" 형태
            /([가-힣a-zA-Z\s]+?)\s+([\d,\.%억만]+)/g,
            // "1분 피해량    153.26억" 형태  
            /(\d+분?\s*[가-힣]+)\s+([\d,\.%억만]+)/g,
            // "백어택 적중률    50.09%" 형태
            /([가-힣]+\s*적중률)\s+([\d,\.%]+)/g
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(line)) !== null) {
                const label = match[1].trim();
                const value = match[2].trim();
                if (label && value) {
                    data[label] = value;
                }
            }
        });

        // 큰 숫자 (190,499,169,150 같은) 별도 처리
        const bigNumbers = line.match(/\b\d{3,}(?:,\d{3})*\b/g);
        if (bigNumbers) {
            bigNumbers.forEach((num, index) => {
                data[`큰수값_${index + 1}`] = num;
            });
        }
    });

    return data;
}

// 4. 테이블 형태 포매팅 함수
function formatAsTable(data) {
    const entries = Object.entries(data);
    if (entries.length === 0) {
        return '데이터 없음';
    }

    // 테이블 헤더
    const table = [];
    table.push('┌─────────────────────────────┬─────────────────────────────┐');
    table.push('│            항목             │            값               │');
    table.push('├─────────────────────────────┼─────────────────────────────┤');

    // 데이터 행들
    entries.forEach(([key, value]) => {
        const paddedKey = key.padEnd(25, ' ').substring(0, 25);
        const paddedValue = value.padEnd(25, ' ').substring(0, 25);
        table.push(`│ ${paddedKey} │ ${paddedValue} │`);
    });

    table.push('└─────────────────────────────┴─────────────────────────────┘');

    return table.join('\n');
}

// 5. HTML 미리보기 생성 함수
function generateHTMLPreview(data) {
    const entries = Object.entries(data);
    if (entries.length === 0) {
        return '<div class="ocr-preview"><h3>OCR 분석 결과</h3><p>데이터 없음</p></div>';
    }

    let html = `
        <div class="ocr-preview" style="
            background: #f8f9fa; 
            border: 1px solid #dee2e6; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 10px 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        ">
            <h3 style="color: #495057; margin-bottom: 15px;">📊 OCR 분석 결과</h3>
            <table style="
                width: 100%; 
                border-collapse: collapse; 
                background: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-radius: 6px;
                overflow: hidden;
            ">
                <thead>
                    <tr style="background: #6c757d; color: white;">
                        <th style="padding: 12px; text-align: left; font-weight: 600;">항목</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600;">값</th>
                    </tr>
                </thead>
                <tbody>
    `;

    entries.forEach(([key, value], index) => {
        const rowColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        html += `
            <tr style="background: ${rowColor};">
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: 500;">${key}</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #0066cc; font-weight: 600;">${value}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
            <div style="margin-top: 15px; font-size: 0.9em; color: #6c757d;">
                <span>📅 분석 시간: ${new Date().toLocaleString()}</span> | 
                <span>📈 총 ${entries.length}개 데이터 추출</span>
            </div>
        </div>
    `;

    return html;
}

// HTML 미리보기 표시 함수
function displayHTMLPreview(html) {
    // 기존 미리보기 제거
    const existingPreview = document.querySelector('.ocr-preview');
    if (existingPreview) {
        existingPreview.remove();
    }

    // 왼쪽 업로드 박스 아래에 미리보기 추가
    const leftUploadBox = document.getElementById('leftUploadBox');
    if (leftUploadBox) {
        const previewContainer = document.createElement('div');
        previewContainer.innerHTML = html;
        leftUploadBox.parentNode.insertBefore(previewContainer, leftUploadBox.nextSibling);
    } else {
        // leftUploadBox가 없으면 body에 추가
        const previewContainer = document.createElement('div');
        previewContainer.innerHTML = html;
        document.body.appendChild(previewContainer);
        console.log('HTML 미리보기를 body에 추가했습니다.');
    }
}

// 왼쪽 업로드 상태 표시
function showLeftUploadStatus(message, type = 'info') {
    const leftUploadBox = document.getElementById('leftUploadBox');
    const originalContent = leftUploadBox.innerHTML;

    let color = '#3498db';
    let icon = '📁';

    switch (type) {
        case 'loading':
            color = '#f39c12';
            icon = '🔍';
            break;
        case 'success':
            color = '#27ae60';
            icon = '✅';
            break;
        case 'error':
            color = '#e74c3c';
            icon = '❌';
            break;
    }

    leftUploadBox.innerHTML = `
        <div class="upload-icon-small">${icon}</div>
        <span class="upload-text-small" style="color: ${color}">${message}</span>
    `;

    // 3초 후 원래 상태로 복원 (로딩이 아닌 경우)
    if (type !== 'loading') {
        setTimeout(() => {
            leftUploadBox.innerHTML = originalContent;
        }, 3000);
    }
}


// 오른쪽 이미지 업로드 처리 (스킬용)
function handleRightImageUpload(file) {
    alert("개발중입니다.");
    if (!file || !file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
    }

    console.log('오른쪽 스킬 이미지 업로드:', file.name);

    // 로딩 표시
    showRightUploadStatus('🔍 스킬 이미지 분석 중...', 'loading');

    // OCR 분석 시작
    analyzeSkillImage(file);
}

// 오른쪽 업로드 상태 표시
function showRightUploadStatus(message, type = 'info') {
    const rightUploadBox = document.getElementById('rightUploadBox');
    const originalContent = rightUploadBox.innerHTML;

    let color = '#3498db';
    let icon = '📁';

    switch (type) {
        case 'loading':
            color = '#f39c12';
            icon = '🔍';
            break;
        case 'success':
            color = '#27ae60';
            icon = '✅';
            break;
        case 'error':
            color = '#e74c3c';
            icon = '❌';
            break;
    }

    rightUploadBox.innerHTML = `
        <div class="upload-icon-small">${icon}</div>
        <span class="upload-text-small" style="color: ${color}">${message}</span>
    `;

    // 3초 후 원래 상태로 복원 (로딩이 아닌 경우)
    if (type !== 'loading') {
        setTimeout(() => {
            rightUploadBox.innerHTML = originalContent;
        }, 3000);
    }
}

// 기존 displayRightImage 함수 (호환성 유지용 - 사용되지 않음)
function displayRightImage(imageSrc, fileName) {
    // 이 함수는 더 이상 사용되지 않습니다.
    // 오른쪽 이미지 업로드는 자동으로 OCR 분석을 실행합니다.
    console.log('displayRightImage 호출됨 (사용되지 않음):', fileName);
}

// 기존 모달 이미지 업로드 처리 (호환성 유지)
function handleModalImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
    }

    const modalImagePreview = document.getElementById('modalImagePreview');
    const modalPreviewImage = document.getElementById('modalPreviewImage');
    const modalAnalysisResult = document.getElementById('modalAnalysisResult');

    if (modalImagePreview && modalPreviewImage) {
        const reader = new FileReader();
        reader.onload = function (e) {
            modalPreviewImage.src = e.target.result;
            modalImagePreview.classList.remove('hidden');
            showModalLoading();
            analyzeModalImage(file);
        };
        reader.readAsDataURL(file);
    }
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
