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
    modal.onclick = function(event) {
        event.stopPropagation();
    };

    // 모달 콘텐츠 클릭시 전파 중단
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.onclick = function(event) {
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
        rightContentArea.innerHTML = '<p>스킬별 데미지 분석을 위해 스킬 이미지를 업로드해주세요.</p>';
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

    console.log('왼쪽 통계 이미지 업로드:', file.name);
    
    // 로딩 표시
    showLeftUploadStatus('🔍 통계 이미지 분석 중...', 'loading');
    
    // OCR 분석 시작
    analyzeStatsImage(file);
}

// 왼쪽 업로드 상태 표시
function showLeftUploadStatus(message, type = 'info') {
    const leftUploadBox = document.getElementById('leftUploadBox');
    const originalContent = leftUploadBox.innerHTML;
    
    let color = '#3498db';
    let icon = '📁';
    
    switch(type) {
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

// 통계 이미지 OCR 분석
function analyzeStatsImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        // Tesseract.js를 사용한 OCR 분석
        Tesseract.recognize(
            e.target.result,
            'kor+eng', // 한국어 + 영어 인식
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        showLeftUploadStatus(`🔍 텍스트 인식 중... ${progress}%`, 'loading');
                    }
                }
            }
        ).then(({ data: { text } }) => {
            console.log('OCR 결과:', text);
            parseStatsData(text);
            showLeftUploadStatus('✅ 분석 완료!', 'success');
        }).catch(error => {
            console.error('OCR 오류:', error);
            showLeftUploadStatus('❌ 분석 실패', 'error');
        });
    };
    reader.readAsDataURL(file);
}

// OCR 결과 파싱 및 표에 자동 입력
function parseStatsData(text) {
    console.log('파싱할 텍스트:', text);
    
    // 각 통계 항목을 찾기 위한 정규식 패턴들
    const patterns = {
        damage: /피해량[\s\S]*?([0-9,]+)/i,
        dps: /초당\s*피해량[\s\S]*?([0-9,]+)/i,
        oneminDamage: /1분\s*피해량[\s\S]*?([0-9,]+)/i,
        oneminDps: /1분\s*초당\s*피해량[\s\S]*?([0-9,]+)/i,
        critRate: /치명타\s*적중률[\s\S]*?([0-9.]+)%/i,
        backAttack: /백어택\s*적중률[\s\S]*?([0-9.]+)%/i,
        headAttack: /헤드어택\s*적중률[\s\S]*?([0-9.]+)%/i,
        damageTaken: /받은\s*피해량[\s\S]*?([0-9,]+)/i,
        damageReduction: /피해\s*감소량[\s\S]*?([0-9,]+)/i,
        stagger: /무력화[\s\S]*?([0-9,]+)/i,
        counter: /카운터[\s\S]*?([0-9]+)/i,
        justGuard: /저스트\s*가드[\s\S]*?([0-9]+)/i,
        battleItem: /배틀\s*아이템[\s\S]*?([0-9]+)/i
    };
    
    // 추출된 데이터를 저장할 객체
    const extractedData = {};
    
    // 각 패턴으로 데이터 추출
    for (const [key, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern);
        if (match && match[1]) {
            extractedData[key] = match[1].replace(/,/g, ''); // 쉼표 제거
            console.log(`${key}: ${extractedData[key]}`);
        }
    }
    
    // 표 입력 필드에 데이터 자동 입력
    fillStatsTable(extractedData);
}

// 통계 표에 데이터 자동 입력
function fillStatsTable(data) {
    const table = document.querySelector('.stats-table');
    if (!table) return;
    
    // 각 행의 입력 필드에 데이터 매핑
    const rows = table.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        const inputs = row.querySelectorAll('input');
        
        switch(index) {
            case 0: // 피해량 / 초당 피해량
                if (inputs[0] && data.damage) inputs[0].value = data.damage;
                if (inputs[1] && data.dps) inputs[1].value = data.dps;
                break;
            case 1: // 1분 피해량 / 1분 초당 피해량
                if (inputs[0] && data.oneminDamage) inputs[0].value = data.oneminDamage;
                if (inputs[1] && data.oneminDps) inputs[1].value = data.oneminDps;
                break;
            case 2: // 치명타 적중률 / 백어택 적중률
                if (inputs[0] && data.critRate) inputs[0].value = data.critRate + '%';
                if (inputs[1] && data.backAttack) inputs[1].value = data.backAttack + '%';
                break;
            case 3: // 헤드어택 적중률 / 받은 피해량
                if (inputs[0] && data.headAttack) inputs[0].value = data.headAttack + '%';
                if (inputs[1] && data.damageTaken) inputs[1].value = data.damageTaken;
                break;
            case 4: // 피해 감소량 / 무력화
                if (inputs[0] && data.damageReduction) inputs[0].value = data.damageReduction;
                if (inputs[1] && data.stagger) inputs[1].value = data.stagger;
                break;
            case 5: // 카운터 성공 횟수 / 저스트 가드 성공 횟수
                if (inputs[0] && data.counter) inputs[0].value = data.counter;
                if (inputs[1] && data.justGuard) inputs[1].value = data.justGuard;
                break;
            case 6: // 배틀 아이템 사용횟수
                if (inputs[0] && data.battleItem) inputs[0].value = data.battleItem;
                break;
        }
    });
    
    // 입력된 필드들에 하이라이트 효과
    const filledInputs = table.querySelectorAll('input[value]:not([value=""])');
    filledInputs.forEach(input => {
        input.style.backgroundColor = '#e8f5e8';
        input.style.borderColor = '#28a745';
        // 3초 후 원래 색상으로 복원
        setTimeout(() => {
            input.style.backgroundColor = '';
            input.style.borderColor = '';
        }, 3000);
    });
}

// 오른쪽 이미지 업로드 처리 (스킬용)
function handleRightImageUpload(file) {
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
    
    switch(type) {
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

// 스킬 이미지 OCR 분석
function analyzeSkillImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        // Tesseract.js를 사용한 OCR 분석
        Tesseract.recognize(
            e.target.result,
            'kor+eng', // 한국어 + 영어 인식
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        showRightUploadStatus(`🔍 스킬 텍스트 인식 중... ${progress}%`, 'loading');
                    }
                }
            }
        ).then(({ data: { text } }) => {
            console.log('스킬 OCR 결과:', text);
            parseSkillData(text);
            showRightUploadStatus('✅ 스킬 분석 완료!', 'success');
        }).catch(error => {
            console.error('스킬 OCR 오류:', error);
            showRightUploadStatus('❌ 스킬 분석 실패', 'error');
        });
    };
    reader.readAsDataURL(file);
}

// 스킬 OCR 결과 파싱
function parseSkillData(text) {
    console.log('스킬 파싱할 텍스트:', text);
    
    const skills = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // 각 라인을 분석해서 스킬 데이터 추출
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 스킬명과 수치들을 포함한 라인인지 확인
        // 피해량과 지분(%)이 포함된 라인을 찾음
        const skillMatch = line.match(/^(.+?)\s+([0-9,]+)억?\s+([0-9,]+)만?\s+([0-9.]+)%/);
        if (skillMatch) {
            const skillName = skillMatch[1].trim();
            const damage1 = skillMatch[2].replace(/,/g, '');
            const damage2 = skillMatch[3].replace(/,/g, '');
            const damageShare = parseFloat(skillMatch[4]);
            
            // 추가 데이터 추출 (헤드/백어택, 치명타, 사용횟수)
            const restOfLine = line.substring(skillMatch.index + skillMatch[0].length);
            const additionalData = restOfLine.match(/([0-9.]+)%.*?([0-9.]+)%.*?([0-9]+)/);
            
            const skill = {
                name: skillName,
                damageShare: damageShare,
                damage: `${damage1}억`,
                dps: `${damage2}만`,
                headBackRate: additionalData ? additionalData[1] + '%' : '-',
                critRate: additionalData ? additionalData[2] + '%' : '-',
                usageCount: additionalData ? additionalData[3] : '-'
            };
            
            skills.push(skill);
        }
    }
    
    // 피해량 지분 높은 순으로 정렬
    skills.sort((a, b) => b.damageShare - a.damageShare);
    
    console.log('추출된 스킬 데이터:', skills);
    displaySkillTable(skills);
}

// 스킬 표 생성 및 표시
function displaySkillTable(skills) {
    const rightContentArea = document.querySelector('.right-content-area');
    
    if (skills.length === 0) {
        rightContentArea.innerHTML = `
            <div class="skill-analysis-container">
                <h4>🎯 스킬별 데미지 분석</h4>
                <p class="no-data">스킬 데이터를 추출할 수 없습니다. 이미지를 다시 확인해주세요.</p>
            </div>
        `;
        return;
    }
    
    let tableHtml = `
        <div class="skill-analysis-container">
            <h4>🎯 스킬별 데미지 분석</h4>
            <p class="skill-count">총 ${skills.length}개 스킬 분석 (피해량 지분 순)</p>
            <div class="skill-table-wrapper">
                <table class="skill-table">
                    <thead>
                        <tr>
                            <th>순위</th>
                            <th>스킬명</th>
                            <th>피해량 지분</th>
                            <th>헤드/백어택</th>
                            <th>치명타 적중률</th>
                            <th>사용횟수</th>
                            <th>피해량/초당피해량</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    skills.forEach((skill, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        
        tableHtml += `
            <tr class="skill-row ${rankClass}">
                <td class="rank-cell">${rank}</td>
                <td class="skill-name">${skill.name}</td>
                <td class="damage-share">${skill.damageShare}%</td>
                <td class="head-back-rate">${skill.headBackRate}</td>
                <td class="crit-rate">${skill.critRate}</td>
                <td class="usage-count">${skill.usageCount}</td>
                <td class="damage-info">${skill.damage}, ${skill.dps}</td>
            </tr>
        `;
    });
    
    tableHtml += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    rightContentArea.innerHTML = tableHtml;
}

// 모달 데이터 저장 함수
function saveModalData() {
    const saveBtn = document.querySelector('.save-btn');
    
    // 저장 중 상태로 변경
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';
    
    try {
        // 1. 캐릭터 및 레이드 정보 수집
        const characterName = document.getElementById('modalCharacterName')?.textContent || '';
        const raidInfo = document.getElementById('modalRaidName')?.textContent || '';
        
        // 2. 통계 표 데이터 수집
        const statsData = collectStatsData();
        
        // 3. 스킬 분석 데이터 수집
        const skillData = collectSkillData();
        
        // 4. 전체 데이터 구성
        const modalData = {
            timestamp: new Date().toISOString(),
            character: {
                name: characterName.replace(/\s*\(.*?\)\s*/, ''), // 직업 정보 제거
                class: extractCharacterClass(characterName),
                raid: raidInfo
            },
            stats: statsData,
            skills: skillData,
            version: '1.0'
        };
        
        // 5. 로컬스토리지에 저장
        const storageKey = `raid_analysis_${Date.now()}`;
        localStorage.setItem(storageKey, JSON.stringify(modalData));
        
        console.log('저장된 데이터:', modalData);
        
        // 저장 성공 피드백
        showSaveSuccess();
        
        // 3초 후 모달 닫기
        setTimeout(() => {
            closeImageAnalysisModal();
        }, 2000);
        
    } catch (error) {
        console.error('저장 오류:', error);
        showSaveError(error.message);
    } finally {
        // 버튼 상태 복원
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.textContent = '저장';
        }, 2000);
    }
}

// 통계 표 데이터 수집
function collectStatsData() {
    const statsData = {};
    const table = document.querySelector('.stats-table');
    
    if (!table) return statsData;
    
    const rows = table.querySelectorAll('tr');
    const labels = [
        ['damage', 'dps'],
        ['oneminDamage', 'oneminDps'], 
        ['critRate', 'backAttackRate'],
        ['headAttackRate', 'damageTaken'],
        ['damageReduction', 'stagger'],
        ['counterCount', 'justGuardCount'],
        ['battleItemCount', 'custom1'],
        ['custom2', 'custom3']
    ];
    
    rows.forEach((row, rowIndex) => {
        if (rowIndex < labels.length) {
            const inputs = row.querySelectorAll('input');
            inputs.forEach((input, inputIndex) => {
                if (inputIndex < labels[rowIndex].length) {
                    const key = labels[rowIndex][inputIndex];
                    statsData[key] = input.value.trim() || '';
                }
            });
        }
    });
    
    return statsData;
}

// 스킬 분석 데이터 수집
function collectSkillData() {
    const skillRows = document.querySelectorAll('.skill-row');
    const skills = [];
    
    skillRows.forEach(row => {
        const skill = {
            rank: row.querySelector('.rank-cell')?.textContent || '',
            name: row.querySelector('.skill-name')?.textContent || '',
            damageShare: row.querySelector('.damage-share')?.textContent || '',
            headBackRate: row.querySelector('.head-back-rate')?.textContent || '',
            critRate: row.querySelector('.crit-rate')?.textContent || '',
            usageCount: row.querySelector('.usage-count')?.textContent || '',
            damageInfo: row.querySelector('.damage-info')?.textContent || ''
        };
        skills.push(skill);
    });
    
    return skills;
}

// 캐릭터 직업 추출
function extractCharacterClass(characterText) {
    const match = characterText.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
}

// 저장 성공 피드백
function showSaveSuccess() {
    const footer = document.querySelector('.modal-footer');
    const successMsg = document.createElement('div');
    successMsg.className = 'save-feedback success';
    successMsg.innerHTML = '✅ 데이터가 성공적으로 저장되었습니다!';
    
    footer.insertBefore(successMsg, footer.firstChild);
    
    setTimeout(() => {
        successMsg.remove();
    }, 3000);
}

// 저장 실패 피드백
function showSaveError(errorMessage) {
    const footer = document.querySelector('.modal-footer');
    const errorMsg = document.createElement('div');
    errorMsg.className = 'save-feedback error';
    errorMsg.innerHTML = `❌ 저장 실패: ${errorMessage}`;
    
    footer.insertBefore(errorMsg, footer.firstChild);
    
    setTimeout(() => {
        errorMsg.remove();
    }, 5000);
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