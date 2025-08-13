// 모달 관련 기능

// 이미지 분석 모달 열기
function openImageAnalysisModal(characterName, raid, difficulty, characterClass, selectedGate) {
    // 캐릭터 선택 정보를 전역 변수에 저장
    selectedCharacterInfo = {
        characterName: characterName || '',
        characterClass: characterClass || '',
        raidName: raid || '',
        gateNumber: selectedGate || '',
        difficulty: difficulty || ''
    };

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

    // 왼쪽 이미지 미리보기 제거
    const existingImageContainer = document.querySelector('.left-image-preview');
    if (existingImageContainer) {
        existingImageContainer.remove();
    }

    // 현재 이미지 파일 초기화
    currentImageFile = null;

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


// 왼쪽 이미지 업로드 처리 (통계용)
function handleLeftImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // 이미지를 왼쪽 영역에 표시
        displayImageInLeftArea(img.src, file.name);

        console.log('이미지 로드 완료! OCR 분석 시작...');
        showLeftUploadStatus('OCR 분석 중...', 'loading');
        performOCR(canvas);
    };

    // 현재 이미지 파일을 전역 변수에 저장
    currentImageFile = file;
    
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
    performOCR(originalCanvas);
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

    // 1.5. 불필요한 단어 제거
    const wordCleanedText = removeUnnecessaryWords(cleanedText);
    console.log('불필요한 단어 제거 후:', wordCleanedText);

    // 2. 공백 정리 테스트
    const spaceCleaned = cleanWhitespace(wordCleanedText);
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

// 불필요한 단어 제거 함수
function removeUnnecessaryWords(text) {
    const unnecessaryWords = [
        '분석기',
        '종합',
        '정보',
        '공격',
        '지원',
        '타임',
        '라인',
        '관리',
        '추가',
        '주요',
        '기록',
        '님',
        '?'
    ];

    let cleanedText = text;

    // 각 불필요한 단어를 제거
    unnecessaryWords.forEach(word => {
        // "?" 같은 특수 문자는 이스케이프 처리
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // 한글 단어의 경우 공백으로 둘러싸인 경우만 제거
        if (/[가-힣]/.test(word)) {
            // 공백 또는 줄바꿈으로 둘러싸인 한글 단어 제거
            const koreanRegex = new RegExp(`(\\s|^)${escapedWord}(\\s|$)`, 'g');
            cleanedText = cleanedText.replace(koreanRegex, ' ');
        } else {
            // 영어나 숫자는 단어 경계 사용
            const wordRegex = new RegExp(`\\b${escapedWord}\\b`, 'g');
            cleanedText = cleanedText.replace(wordRegex, '');
        }

        // 줄의 시작이나 끝에 나타나는 경우
        const lineRegex = new RegExp(`^\\s*${escapedWord}\\s*$`, 'gm');
        cleanedText = cleanedText.replace(lineRegex, '');
    });

    // 연속된 공백을 하나로 정리
    cleanedText = cleanedText.replace(/\s{2,}/g, ' ');

    // 빈 줄 정리
    cleanedText = cleanedText.replace(/\n\s*\n/g, '\n');

    return cleanedText.trim();
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

        processedLines.push(line);
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

// 전투 시간 추출 함수
function extractCombatTime(lines) {
    for (const line of lines) {
        // "주요 정보 (전투 시간 13 : 16)" 패턴
        const timeMatch = line.match(/전투\s*시간\s*(\d+)\s*:\s*(\d+)/);
        if (timeMatch) {
            const minutes = timeMatch[1];
            const seconds = timeMatch[2];
            return {
                time: `${minutes}:${seconds.padStart(2, '0')}`,
                raw: line
            };
        }
    }
    return { time: null, raw: null };
}

// 테이블 형태 데이터 매칭 함수
function matchTableData(lines) {
    const data = {};

    // 라벨 행과 값 행을 찾아서 매칭
    for (let i = 0; i < lines.length - 1; i++) {
        const labelLine = lines[i];
        const valueLine = lines[i + 1];

        // 라벨 행 패턴: 여러 개의 한글 라벨이 포함된 행
        if (labelLine.includes('피해량') && labelLine.includes('초당') && labelLine.includes('유효율')) {
            console.log('테이블 라벨 행 발견:', labelLine);
            console.log('테이블 값 행:', valueLine);

            // 라벨 추출
            const labels = extractLabelsFromLine(labelLine);
            // 값 추출  
            const values = extractValuesFromLine(valueLine);

            console.log('추출된 라벨:', labels);
            console.log('추출된 값:', values);

            // 라벨과 값 매칭
            const minLength = Math.min(labels.length, values.length);
            for (let j = 0; j < minLength; j++) {
                if (labels[j] && values[j]) {
                    data[labels[j]] = values[j];
                }
            }

            break; // 첫 번째 테이블만 처리
        }
    }

    return data;
}

// 라벨 행에서 라벨들 추출
function extractLabelsFromLine(line) {
    const labels = [];

    // 정규식으로 라벨 패턴 추출
    const patterns = [
        /피해량/g,
        /초당\s*피해량/g,
        /연가심공\s*유효율/g,
        /치명타\s*피해\s*증가\s*유효율/g
    ];

    patterns.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
            matches.forEach(match => {
                const cleanLabel = match.replace(/\s+/g, ' ').trim();
                if (!labels.includes(cleanLabel)) {
                    labels.push(cleanLabel);
                }
            });
        }
    });

    return labels;
}

// 값 행에서 값들 추출
function extractValuesFromLine(line) {
    const values = [];

    // 숫자 패턴 추출 (억, %, 쉼표 포함)
    const numberPattern = /[\d,]+\.?\d*[억%]?/g;
    const matches = line.match(numberPattern);

    if (matches) {
        matches.forEach(match => {
            // 유효한 값만 추가 (너무 작은 숫자나 의미없는 값 제외)
            if (match !== '0' && match !== '0.' && !match.match(/^0+$/)) {
                values.push(match);
            }
        });
    }

    return values;
}

// 3. 구조화된 파싱 함수 (고도화 버전 - 에러 처리 포함)
function parseStructuredData(text) {
    console.log('text', text)
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

        // 5단계: 전투 시간 추출
        const combatTimeResult = extractCombatTime(correctedLines);
        if (combatTimeResult.time) {
            data['전투 시간'] = combatTimeResult.time;
        }

        // 6단계: 테이블 형태 데이터 매칭
        const tableMatches = matchTableData(correctedLines);
        Object.assign(data, tableMatches);

        // 7단계: 기존 패턴 매칭 (백업용)
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
                            if (label && value && !data[label]) { // 중복 방지
                                data[label] = value;
                            }
                        }
                    } catch (patternError) {
                        console.warn('패턴 매칭 중 오류:', patternError, 'Line:', line);
                    }
                });

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

// 저장 모달 표시 함수 (바로 저장으로 변경)
function showSaveModal() {
    const data = collectTableData();
    const dataCount = Object.keys(data).length;

    if (dataCount === 0) {
        alert('저장할 데이터가 없습니다.');
        return;
    }

    // 저장된 캐릭터 선택 정보 확인
    const characterName = selectedCharacterInfo.characterName || '';
    const characterClass = selectedCharacterInfo.characterClass || '';
    const raidName = selectedCharacterInfo.raidName || '';
    const gateNumber = selectedCharacterInfo.gateNumber || '';
    const difficulty = selectedCharacterInfo.difficulty || '';

    // 필수 정보가 있는지 확인
    if (!characterName || !raidName) {
        alert('캐릭터명과 레이드명이 필요합니다.\n\n캐릭터를 선택하고 레이드 분석 모달을 통해 진입해주세요.');
        return;
    }

    // 확인 메시지
    const confirmMessage = `다음 정보로 기록을 저장하시겠습니까?\n\n` +
        `캐릭터: ${characterName} (${characterClass || '미선택'})\n` +
        `레이드: ${raidName} ${gateNumber ? gateNumber + '관문' : ''} ${difficulty || ''}\n` +
        `데이터: ${dataCount}개 항목`;

    if (!confirm(confirmMessage)) {
        return;
    }

    // 바로 저장 실행
    saveRecordDirect(characterName, characterClass, raidName, gateNumber, difficulty, data);
}

// 바로 저장 실행 함수
async function saveRecordDirect(characterName, characterClass, raidName, gateNumber, difficulty, ocrData) {
    try {
        console.log('=== 바로 저장 실행 ===');
        console.log('캐릭터:', characterName, '직업:', characterClass);
        console.log('레이드:', raidName, '관문:', gateNumber, '난이도:', difficulty);
        console.log('OCR 데이터:', ocrData);
        console.log('이미지 파일:', getCurrentImageFile());
        console.log('==================');

        // FormData로 전송 준비
        const formData = new FormData();
        formData.append('characterName', characterName);
        formData.append('characterClass', characterClass || '');
        formData.append('raidName', raidName);
        formData.append('gateNumber', gateNumber || '');
        formData.append('difficulty', difficulty || '');
        formData.append('combatTime', ocrData['전투 시간'] || '');
        formData.append('ocrData', JSON.stringify(ocrData));
        
        // 이미지 파일 추가
        const imageFile = getCurrentImageFile();
        if (imageFile) {
            formData.append('image', imageFile);
        }

        // API 호출
        const response = await fetch('/api/save-record', {
            method: 'POST',
            body: formData
        });

        console.log('응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP 에러 응답:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}\n\n${errorText}`);
        }

        const result = await response.json();
        console.log('API 응답:', result);

        if (result.success) {
            alert('✅ 기록이 저장되었습니다!\n\n' + 
                  `캐릭터: ${characterName} (${characterClass || '미선택'})\n` +
                  `레이드: ${raidName} ${gateNumber ? gateNumber + '관문' : ''} ${difficulty || ''}\n` +
                  `데이터: ${Object.keys(ocrData).length}개 항목\n` +
                  `레코드 ID: ${result.data.recordId}`);
        } else {
            console.error('API 응답 에러:', result);
            throw new Error(result.error || '저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('저장 중 오류:', error);
        
        // 더 자세한 에러 정보 표시
        let errorMessage = '❌ 저장 중 오류가 발생했습니다.\n\n';
        errorMessage += `오류: ${error.message}\n`;
        
        // fetch 오류인 경우 추가 정보
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage += '\n네트워크 연결을 확인해주세요.';
        }
        
        alert(errorMessage);
    }
}

// 저장 모달 닫기
function closeSaveModal() {
    const modal = document.getElementById('saveRecordModal');
    if (modal) {
        modal.remove();
    }
}

// 실제 저장 실행
async function saveRecord() {
    try {
        // 입력값 수집
        const characterName = document.getElementById('saveCharacterName').value.trim();
        const characterClass = document.getElementById('saveCharacterClass').value;
        const raidName = document.getElementById('saveRaidName').value.trim();
        const gateNumber = document.getElementById('saveGateNumber').value;
        const difficulty = document.getElementById('saveDifficulty').value;

        // 필수 필드 검증
        if (!characterName) {
            alert('캐릭터명을 입력해주세요.');
            return;
        }
        if (!raidName) {
            alert('레이드명을 입력해주세요.');
            return;
        }

        // OCR 데이터 수집
        const ocrData = collectTableData();
        
        // 현재 이미지 파일 가져오기
        const imageFile = getCurrentImageFile();
        
        console.log('=== 저장할 기록 데이터 ===');
        console.log('캐릭터:', characterName, '직업:', characterClass);
        console.log('레이드:', raidName, '관문:', gateNumber, '난이도:', difficulty);
        console.log('OCR 데이터:', ocrData);
        console.log('이미지 파일:', imageFile);
        console.log('========================');

        // FormData로 전송 준비
        const formData = new FormData();
        formData.append('characterName', characterName);
        formData.append('characterClass', characterClass || '');
        formData.append('raidName', raidName);
        formData.append('gateNumber', gateNumber || '');
        formData.append('difficulty', difficulty || '');
        formData.append('combatTime', ocrData['전투 시간'] || '');
        formData.append('ocrData', JSON.stringify(ocrData));
        
        // 이미지 파일 추가
        if (imageFile) {
            formData.append('image', imageFile);
        }

        // 저장 버튼 비활성화 및 로딩 표시
        const saveButton = document.querySelector('button[onclick="saveRecord()"]');
        const originalButtonText = saveButton.textContent;
        saveButton.textContent = '💾 저장 중...';
        saveButton.disabled = true;

        try {
            // API 호출
            const response = await fetch('/api/save-record', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ 기록이 저장되었습니다!\n\n' + 
                      `캐릭터: ${characterName} (${characterClass || '미선택'})\n` +
                      `레이드: ${raidName} ${gateNumber ? gateNumber + '관문' : ''} ${difficulty || ''}\n` +
                      `데이터: ${Object.keys(ocrData).length}개 항목\n` +
                      `레코드 ID: ${result.data.recordId}`);

                closeSaveModal();
            } else {
                throw new Error(result.error || '저장에 실패했습니다.');
            }
        } catch (fetchError) {
            console.error('API 호출 오류:', fetchError);
            alert('❌ 저장 중 오류가 발생했습니다.\n' + fetchError.message);
        } finally {
            // 버튼 상태 복원
            saveButton.textContent = originalButtonText;
            saveButton.disabled = false;
        }

    } catch (error) {
        console.error('저장 중 오류:', error);
        alert('❌ 저장 중 오류가 발생했습니다.');
    }
}

// 현재 업로드된 이미지 파일 가져오기 (전역 변수로 저장해야 함)
let currentImageFile = null;

// 캐릭터 선택 정보 저장용 전역 변수들
let selectedCharacterInfo = {
    characterName: '',
    characterClass: '',
    raidName: '',
    gateNumber: '',
    difficulty: ''
};

function getCurrentImageFile() {
    return currentImageFile;
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

// HTML 미리보기 표시 함수 (우측 영역에 표시)
function displayHTMLPreview(html) {
    // 기존 미리보기 제거
    const existingPreview = document.querySelector('.ocr-preview');
    if (existingPreview) {
        existingPreview.remove();
    }

    // 우측 콘텐츠 영역에 미리보기 추가
    const rightContentArea = document.querySelector('.right-content-area');
    if (rightContentArea) {
        const previewContainer = document.createElement('div');
        previewContainer.innerHTML = html;
        rightContentArea.appendChild(previewContainer);
        console.log('HTML 미리보기를 우측 영역에 추가했습니다.');
    } else {
        // right-content-area가 없으면 body에 추가
        const previewContainer = document.createElement('div');
        previewContainer.innerHTML = html;
        document.body.appendChild(previewContainer);
        console.log('HTML 미리보기를 body에 추가했습니다 (우측 영역을 찾을 수 없음).');
    }
}

// 왼쪽 영역에 이미지 표시 함수
function displayImageInLeftArea(imageSrc, fileName) {
    // 기존 이미지 표시 영역 제거
    const existingImageContainer = document.querySelector('.left-image-preview');
    if (existingImageContainer) {
        existingImageContainer.remove();
    }

    // 왼쪽 업로드 박스 찾기
    const leftUploadBox = document.getElementById('leftUploadBox');
    if (!leftUploadBox) {
        console.error('leftUploadBox를 찾을 수 없습니다.');
        return;
    }

    // 이미지 미리보기 컨테이너 생성
    const imageContainer = document.createElement('div');
    imageContainer.className = 'left-image-preview';
    imageContainer.style.cssText = `
        margin-top: 10px;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        padding: 10px;
        background: #f8f9fa;
        text-align: center;
    `;

    // 이미지 요소 생성
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = fileName;
    img.style.cssText = `
        max-width: 100%;
        max-height: 300px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    // 파일명 표시
    const fileNameLabel = document.createElement('div');
    fileNameLabel.textContent = fileName;
    fileNameLabel.style.cssText = `
        margin-top: 8px;
        font-size: 12px;
        color: #6c757d;
        font-weight: 500;
    `;

    // 컨테이너에 이미지와 파일명 추가
    imageContainer.appendChild(img);
    imageContainer.appendChild(fileNameLabel);

    // 왼쪽 업로드 박스 아래에 이미지 표시
    leftUploadBox.parentNode.insertBefore(imageContainer, leftUploadBox.nextSibling);

    console.log('이미지가 왼쪽 영역에 표시되었습니다:', fileName);
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
