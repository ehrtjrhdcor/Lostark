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

// 이미지 전처리 및 OCR 분석 함수
function preprocessImage(file) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function () {
        // 캔버스 크기 설정
        canvas.width = img.width;
        canvas.height = img.height;

        // 이미지를 캔버스에 그리기
        ctx.drawImage(img, 0, 0);

        console.log('이미지 로드 완료! OCR 분석 시작...');
        showLeftUploadStatus('OCR 분석 중...', 'loading');

        // 바로 OCR 분석
        performOCR(canvas);
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

    applyAdvancedPreprocessing(originalCanvas).then((processedCanvas) => { performOCR(processedCanvas) })


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

    // 5. HTML 미리보기 생성 및 표시 (원본 텍스트 포함)
    const htmlPreview = generateHTMLPreview(parsedData, text);
    displayHTMLPreview(htmlPreview);

    const dataCount = Object.keys(parsedData).length;
    console.log(`HTML 미리보기 생성 완료! (자동 파싱: ${dataCount > 0 ? dataCount + '개 성공' : '실패'})`);

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

// 불필요한 줄 필터링 함수
function filterUnnecessaryLines(lines) {
    return lines.filter((line, index) => {
        // OCR 오류 패턴 제거
        if (line.match(/\d+티하\d+.*\d+\s+\d+.*\.\.\/\./)) return false; // 2번째 줄 패턴
        if (line.match(/^\d+\s+[\d.]+\s+공격 정보\s+지원 정보\s+타임 라인/)) return false; // 4번째 줄 패턴
        if (line.match(/^\d+\?\s+\d+.*[~오+}ㅎ].*[-…\.]+/)) return false; // 8번째 줄 패턴
        if (line.match(/^\d{12,}\s+\d{9,}$/)) return false; // 9번째 줄 패턴 (큰 숫자들만)

        return true;
    });
}

// 테이블 구조 처리 함수
function processTableStructure(lines) {
    const processedLines = [];
    const tableData = {};
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = lines[i + 1];
        
        // 테이블 헤더 패턴 감지 (여러 "님"이 포함된 줄)
        if (line.includes('님') && line.split('님').length > 2 && nextLine) {
            console.log('테이블 구조 감지:', line);
            
            // 헤더 정리 ("님" 제거 및 칼럼 추출)
            const headers = line.split(/\s+/).filter(col => col.trim() && col !== '님');
            const values = nextLine.split(/\s+/).filter(val => val.trim());
            
            // 헤더와 값 매칭
            for (let j = 0; j < Math.min(headers.length, values.length); j++) {
                if (headers[j] && values[j]) {
                    tableData[headers[j]] = values[j];
                }
            }
            
            i++; // 다음 줄(데이터 행)도 건너뛰기
            console.log('테이블 추출 완료:', tableData);
        } else {
            processedLines.push(line);
        }
    }
    
    return { processedLines, tableData };
}


// 의미없는 한글자 치환 함수
function replaceSingleKoreanChars(line) {
    // 공백으로 둘러싸인 단일 한글자를 "-"로 치환
    return line.replace(/\s([가-힣])\s/g, ' - ');
}

// 게임 용어 사전 (OCR 오류 → 올바른 용어)
const GAME_TERMINOLOGY_CORRECTIONS = {
    '피하량': '피해량',
    '적률': '적중률',
    '유룰': '유효율',
    '가동룰': '가동률',
    '성공횟수': '성공 횟수',
    '사용횟수': '사용 횟수',
    '감소량': '감소량',
    '증가량': '증가량',
    '뽐하량': '피해량',
    '비하량': '피해량',
    '적충률': '적중률',
    '적중률률': '적중률',
    '유료율': '유효율',
    '백어댁': '백어택',
    '헤드어댁': '헤드어택',
    '카운더': '카운터',
    '피해감소량': '피해 감소량',
    '치명다': '치명타',
    '치멸타': '치명타'
};

// OCR 텍스트 보정 함수
function correctOCRText(line) {
    let correctedLine = line;

    // 1. 누락된 숫자 보정 ("분" 앞에 숫자가 없으면 "1" 추가)
    correctedLine = correctedLine.replace(/(?<!\d)분/g, '1분');

    // 2. 게임 용어 보정
    for (const [incorrect, correct] of Object.entries(GAME_TERMINOLOGY_CORRECTIONS)) {
        const regex = new RegExp(`\\b${incorrect}\\b`, 'g');
        correctedLine = correctedLine.replace(regex, correct);
    }

    // 3. 괄호 패턴 보정 ("전투 시간 17 : 49" → "전투 시간    17:49")
    correctedLine = correctedLine.replace(/\(([가-힣\s]+)\s+(\d+)\s*:\s*(\d+)\)/g, function (match, term, hour, min) {
        return `    ${term.trim()}    ${hour}:${min}`;
    });

    // 4. 추가 패턴 보정
    // "초당피해량" → "초당 피해량" (띄어쓰기 추가)
    correctedLine = correctedLine.replace(/초당([가-힣]+)/g, '초당 $1');

    // "치명타피해" → "치명타 피해"
    correctedLine = correctedLine.replace(/치명타([가-힣]+)/g, '치명타 $1');

    // "백어택적중률" → "백어택 적중률"
    correctedLine = correctedLine.replace(/백어택([가-힣]+)/g, '백어택 $1');
    correctedLine = correctedLine.replace(/헤드어택([가-힣]+)/g, '헤드어택 $1');

    return correctedLine;
}

// 3. 구조화된 파싱 함수 (고도화 버전 - 에러 처리 포함)
function parseStructuredData(text) {
    try {
        const lines = text.split('\n').filter(line => line.trim());
        const data = {};

        // 1단계: 불필요한 줄 필터링
        const filteredLines = filterUnnecessaryLines(lines);
        console.log(`라인 필터링: ${lines.length}개 → ${filteredLines.length}개`);

        // 2단계: 테이블 구조 처리
        const { processedLines, tableData } = processTableStructure(filteredLines);
        Object.assign(data, tableData);

        // 3단계: 의미없는 한글자 치환
        const cleanedLines = processedLines.map(line => replaceSingleKoreanChars(line));

        // 4단계: OCR 텍스트 보정 (새로 추가)
        const correctedLines = cleanedLines.map(line => correctOCRText(line));
        console.log('OCR 텍스트 보정 완료');

        // 5단계: 기존 패턴 매칭
        correctedLines.forEach(line => {
            try {
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
                    try {
                        let match;
                        while ((match = pattern.exec(line)) !== null) {
                            const label = match[1] ? match[1].trim() : '';
                            const value = match[2] ? match[2].trim() : '';
                            if (label && value) {
                                data[label] = value;
                            }
                        }
                    } catch (patternError) {
                        console.warn('패턴 매칭 중 오류:', patternError, 'Line:', line);
                    }
                });

                // 큰 숫자 (190,499,169,150 같은) 별도 처리
                try {
                    const bigNumbers = line.match(/\b\d{3,}(?:,\d{3})*\b/g);
                    if (bigNumbers) {
                        bigNumbers.forEach((num, index) => {
                            data[`큰수값_${index + 1}`] = num;
                        });
                    }
                } catch (numberError) {
                    console.warn('숫자 매칭 중 오류:', numberError, 'Line:', line);
                }

            } catch (lineError) {
                console.warn('라인 처리 중 오류:', lineError, 'Line:', line);
            }
        });

        console.log('자동 파싱 결과:', Object.keys(data).length, '개 항목 추출');
        return data;

    } catch (error) {
        console.error('parseStructuredData 전체 오류:', error);
        console.log('자동 파싱 실패 - 빈 객체 반환');
        return {};
    }
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

// 5. HTML 편집 가능한 미리보기 생성 함수 (하이브리드 버전)
function generateHTMLPreview(data, originalText = '') {
    const entries = Object.entries(data);
    const hasAutoData = entries.length > 0;

    // 자동 파싱 실패 시 기본 빈 행들 생성
    const defaultRows = hasAutoData ? entries : [
        ['항목 1', '값 1'],
        ['항목 2', '값 2'],
        ['항목 3', '값 3'],
        ['항목 4', '값 4']
    ];

    let html = `
        <div class="ocr-preview" style="
            background: #f8f9fa; 
            border: 1px solid #dee2e6; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 10px 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #495057; margin: 0;">📊 OCR 분석 결과 (편집 가능)</h3>
                <span style="font-size: 12px; color: ${hasAutoData ? '#28a745' : '#ffc107'}; font-weight: 600;">
                    ${hasAutoData ? '✅ 자동 파싱 성공' : '⚠️ 자동 파싱 실패 - 수동 입력 필요'}
                </span>
            </div>
            
            <!-- OCR 원본 텍스트 영역 -->
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 style="color: #6c757d; margin: 0; font-size: 14px;">📄 OCR 원본 텍스트</h4>
                    <button onclick="toggleOriginalText()" id="toggleTextBtn" style="
                        background: #6c757d; 
                        color: white; 
                        border: none; 
                        padding: 4px 8px; 
                        border-radius: 4px; 
                        cursor: pointer;
                        font-size: 12px;
                    ">📁 펼치기</button>
                </div>
                <div id="originalTextArea" style="
                    display: none;
                    background: white; 
                    border: 1px solid #ddd; 
                    border-radius: 6px; 
                    padding: 12px; 
                    max-height: 150px; 
                    overflow-y: auto;
                    font-family: monospace;
                    font-size: 12px;
                    white-space: pre-wrap;
                    margin-bottom: 10px;
                    position: relative;
                ">${originalText || 'OCR 원본 텍스트가 없습니다.'}
                    <button onclick="copyOriginalText()" style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 2px 6px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 10px;
                    " title="복사">📋</button>
                </div>
            </div>
            <table id="editableOCRTable" style="
                width: 100%; 
                border-collapse: collapse; 
                background: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-radius: 6px;
                overflow: hidden;
            ">
                <thead>
                    <tr style="background: #6c757d; color: white;">
                        <th style="padding: 12px; text-align: left; font-weight: 600; width: 35%;">항목</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; width: 45%;">값</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; width: 20%;">작업</th>
                    </tr>
                </thead>
                <tbody>
    `;

    defaultRows.forEach(([key, value], index) => {
        const rowColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        const keyPlaceholder = hasAutoData ? key : `항목명 입력`;
        const valuePlaceholder = hasAutoData ? value : `값 입력`;
        const keyValue = hasAutoData ? key : '';
        const valueValue = hasAutoData ? value : '';

        html += `
            <tr style="background: ${rowColor};" data-row="${index}">
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">
                    <input type="text" value="${keyValue}" placeholder="${keyPlaceholder}" style="
                        width: 100%; 
                        border: 1px solid #ddd; 
                        padding: 6px; 
                        border-radius: 4px;
                        font-size: 14px;
                        background: white;
                    " class="key-input" />
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">
                    <input type="text" value="${valueValue}" placeholder="${valuePlaceholder}" style="
                        width: 100%; 
                        border: 1px solid #ddd; 
                        padding: 6px; 
                        border-radius: 4px;
                        font-size: 14px;
                        color: #0066cc; 
                        font-weight: 600;
                        background: white;
                    " class="value-input" />
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: center;">
                    <button onclick="addTableRow(this)" style="
                        background: #28a745; 
                        color: white; 
                        border: none; 
                        padding: 4px 8px; 
                        margin: 0 2px;
                        border-radius: 4px; 
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                    " title="행 추가">+</button>
                    <button onclick="removeTableRow(this)" style="
                        background: #dc3545; 
                        color: white; 
                        border: none; 
                        padding: 4px 8px; 
                        margin: 0 2px;
                        border-radius: 4px; 
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                    " title="행 삭제">×</button>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
            <div style="margin-top: 15px; text-align: center;">
                <button onclick="addTableRow()" style="
                    background: #007bff; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    margin: 5px;
                    border-radius: 6px; 
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                ">+ 새 항목 추가</button>
                <button onclick="saveTableData()" style="
                    background: #28a745; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    margin: 5px;
                    border-radius: 6px; 
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                ">💾 저장 (JSON)</button>
            </div>
            <div style="margin-top: 15px; font-size: 0.9em; color: #6c757d; text-align: center;">
                <span>📅 분석 시간: ${new Date().toLocaleString()}</span> | 
                <span>📈 ${hasAutoData ? `자동 추출: ${entries.length}개` : '수동 입력 모드'}</span>
                ${!hasAutoData ? '<br><small style="color: #ffc107;">💡 원본 텍스트를 참고하여 수동으로 입력하세요</small>' : ''}
            </div>
        </div>
    `;

    return html;
}

// 테이블 행 추가 함수
function addTableRow(button) {
    const table = document.getElementById('editableOCRTable');
    const tbody = table.querySelector('tbody');
    const rowCount = tbody.children.length;

    let targetRow;
    if (button && button.closest) {
        // 특정 행의 + 버튼을 클릭한 경우, 해당 행 다음에 추가
        targetRow = button.closest('tr');
    } else {
        // "새 항목 추가" 버튼을 클릭한 경우, 맨 끝에 추가
        targetRow = null;
    }

    const rowColor = rowCount % 2 === 0 ? '#ffffff' : '#f8f9fa';
    const newRow = document.createElement('tr');
    newRow.style.background = rowColor;
    newRow.setAttribute('data-row', rowCount);

    newRow.innerHTML = `
        <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">
            <input type="text" value="" placeholder="새 항목명" style="
                width: 100%; 
                border: 1px solid #ddd; 
                padding: 6px; 
                border-radius: 4px;
                font-size: 14px;
                background: white;
            " class="key-input" />
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">
            <input type="text" value="" placeholder="새 값" style="
                width: 100%; 
                border: 1px solid #ddd; 
                padding: 6px; 
                border-radius: 4px;
                font-size: 14px;
                color: #0066cc; 
                font-weight: 600;
                background: white;
            " class="value-input" />
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: center;">
            <button onclick="addTableRow(this)" style="
                background: #28a745; 
                color: white; 
                border: none; 
                padding: 4px 8px; 
                margin: 0 2px;
                border-radius: 4px; 
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
            " title="행 추가">+</button>
            <button onclick="removeTableRow(this)" style="
                background: #dc3545; 
                color: white; 
                border: none; 
                padding: 4px 8px; 
                margin: 0 2px;
                border-radius: 4px; 
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
            " title="행 삭제">×</button>
        </td>
    `;

    if (targetRow) {
        // 특정 행 다음에 삽입
        targetRow.parentNode.insertBefore(newRow, targetRow.nextSibling);
    } else {
        // 테이블 끝에 추가
        tbody.appendChild(newRow);
    }

    // 새로 추가된 첫 번째 입력 필드에 포커스
    const firstInput = newRow.querySelector('.key-input');
    if (firstInput) {
        firstInput.focus();
    }

    // 행 번호 재정렬
    updateRowNumbers();

    console.log('새 행이 추가되었습니다.');
}

// 테이블 행 제거 함수
function removeTableRow(button) {
    const row = button.closest('tr');
    const table = document.getElementById('editableOCRTable');
    const tbody = table.querySelector('tbody');

    // 최소 1개 행은 유지
    if (tbody.children.length <= 1) {
        alert('최소 1개의 행은 유지되어야 합니다.');
        return;
    }

    // 행 제거 확인
    const keyInput = row.querySelector('.key-input');
    const valueInput = row.querySelector('.value-input');
    const keyValue = keyInput ? keyInput.value : '';
    const valueValue = valueInput ? valueInput.value : '';

    if (keyValue || valueValue) {
        if (!confirm(`"${keyValue || '(빈 항목)'}: ${valueValue || '(빈 값)'}" 행을 삭제하시겠습니까?`)) {
            return;
        }
    }

    row.remove();

    // 행 번호 재정렬
    updateRowNumbers();

    console.log('행이 삭제되었습니다.');
}

// 행 번호 및 배경색 재정렬 함수
function updateRowNumbers() {
    const table = document.getElementById('editableOCRTable');
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach((row, index) => {
        row.setAttribute('data-row', index);
        const rowColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        row.style.background = rowColor;
    });
}

// 테이블 데이터 수집 함수
function collectTableData() {
    const table = document.getElementById('editableOCRTable');
    if (!table) {
        console.error('편집 가능한 테이블을 찾을 수 없습니다.');
        return {};
    }

    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    const data = {};

    rows.forEach((row, index) => {
        const keyInput = row.querySelector('.key-input');
        const valueInput = row.querySelector('.value-input');

        if (keyInput && valueInput) {
            const key = keyInput.value.trim();
            const value = valueInput.value.trim();

            // 빈 항목은 제외 (키와 값 모두 비어있는 경우)
            if (key || value) {
                // 중복 키 처리: 동일한 키가 있으면 번호를 추가
                let finalKey = key || `항목_${index + 1}`;
                let counter = 1;
                while (data.hasOwnProperty(finalKey)) {
                    finalKey = `${key || `항목_${index + 1}`}_${counter}`;
                    counter++;
                }

                data[finalKey] = value || '';
            }
        }
    });

    return data;
}

// 테이블 데이터 저장 함수 (JSON으로 콘솔 출력)
function saveTableData() {
    try {
        const data = collectTableData();
        const dataCount = Object.keys(data).length;

        if (dataCount === 0) {
            alert('저장할 데이터가 없습니다.');
            return;
        }

        // JSON 형태로 콘솔에 출력
        const jsonData = {
            timestamp: new Date().toISOString(),
            dataCount: dataCount,
            ocrResults: data
        };

        console.log('=== OCR 분석 결과 (JSON) ===');
        console.log(JSON.stringify(jsonData, null, 2));
        console.log('===========================');

        // 사용자에게 저장 완료 알림
        alert(`✅ 저장 완료!\n\n📊 총 ${dataCount}개 항목이 JSON 형태로 콘솔에 출력되었습니다.\n\n개발자 도구(F12)의 Console 탭에서 확인하세요.`);

        // 콘솔 메시지도 추가
        console.log(`📝 저장 완료: ${dataCount}개 항목이 JSON으로 출력되었습니다.`);

    } catch (error) {
        console.error('데이터 저장 중 오류가 발생했습니다:', error);
        alert('❌ 데이터 저장 중 오류가 발생했습니다.\n\n자세한 내용은 개발자 도구의 Console을 확인하세요.');
    }
}

// 원본 텍스트 영역 토글 함수
function toggleOriginalText() {
    const textArea = document.getElementById('originalTextArea');
    const toggleBtn = document.getElementById('toggleTextBtn');

    if (textArea && toggleBtn) {
        const isHidden = textArea.style.display === 'none';
        textArea.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? '📂 접기' : '📁 펼치기';

        console.log(`원본 텍스트 영역 ${isHidden ? '펼침' : '접음'}`);
    }
}

// 원본 텍스트 복사 함수
function copyOriginalText() {
    const textArea = document.getElementById('originalTextArea');
    if (textArea) {
        // 버튼 텍스트 제외하고 원본 텍스트만 추출
        const fullText = textArea.textContent || textArea.innerText;
        const textToCopy = fullText.replace('📋', '').trim();

        navigator.clipboard.writeText(textToCopy).then(() => {
            console.log('원본 텍스트가 클립보드에 복사되었습니다.');

            // 일시적으로 버튼 텍스트 변경
            const copyBtn = textArea.querySelector('button');
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅';
                copyBtn.style.background = '#28a745';

                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.background = '#007bff';
                }, 1500);
            }
        }).catch(err => {
            console.error('텍스트 복사 실패:', err);
            alert('텍스트 복사에 실패했습니다.');
        });
    }
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
