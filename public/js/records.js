// OCR 기록 조회 및 표시 기능

// 전역 변수
let currentRecordsPage = 1;
let currentRecordsData = null;
let currentFilters = {
    character: '',
    raid: ''
};

/**
 * 기록 페이지 초기화
 */
function initializeRecordsPage() {
    console.log('📊 기록 페이지 초기화...');

    // 이벤트 리스너 등록
    setupRecordsEventListeners();

    // 초기 데이터 로드
    loadRecords();
}

/**
 * 기록 페이지 이벤트 리스너 설정
 */
function setupRecordsEventListeners() {
    // 검색 버튼
    const searchBtn = document.getElementById('recordsSearchBtn');
    const resetBtn = document.getElementById('recordsResetBtn');
    const characterFilter = document.getElementById('recordsCharacterFilter');
    const raidFilter = document.getElementById('recordsRaidFilter');

    if (searchBtn) {
        searchBtn.addEventListener('click', performRecordsSearch);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetRecordsFilters);
    }

    // 엔터 키 검색 지원
    if (characterFilter) {
        characterFilter.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                performRecordsSearch();
            }
        });
    }

    if (raidFilter) {
        raidFilter.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                performRecordsSearch();
            }
        });
    }

    // 페이지네이션 버튼들
    const firstPageBtn = document.getElementById('recordsFirstPageBtn');
    const prevPageBtn = document.getElementById('recordsPrevPageBtn');
    const nextPageBtn = document.getElementById('recordsNextPageBtn');
    const lastPageBtn = document.getElementById('recordsLastPageBtn');

    if (firstPageBtn) {
        firstPageBtn.addEventListener('click', () => goToRecordsPage(1));
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentRecordsPage > 1) {
                goToRecordsPage(currentRecordsPage - 1);
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentRecordsData && currentRecordsPage < currentRecordsData.pagination.totalPages) {
                goToRecordsPage(currentRecordsPage + 1);
            }
        });
    }

    if (lastPageBtn) {
        lastPageBtn.addEventListener('click', () => {
            if (currentRecordsData) {
                goToRecordsPage(currentRecordsData.pagination.totalPages);
            }
        });
    }
}

/**
 * 기록 검색 실행
 */
function performRecordsSearch() {
    const characterFilter = document.getElementById('recordsCharacterFilter');
    const raidFilter = document.getElementById('recordsRaidFilter');

    currentFilters.character = characterFilter ? characterFilter.value.trim() : '';
    currentFilters.raid = raidFilter ? raidFilter.value.trim() : '';
    currentRecordsPage = 1; // 검색 시 첫 페이지로 이동

    console.log('🔍 기록 검색:', currentFilters);
    loadRecords();
}

/**
 * 검색 필터 초기화
 */
function resetRecordsFilters() {
    const characterFilter = document.getElementById('recordsCharacterFilter');
    const raidFilter = document.getElementById('recordsRaidFilter');

    if (characterFilter) characterFilter.value = '';
    if (raidFilter) raidFilter.value = '';

    currentFilters = { character: '', raid: '' };
    currentRecordsPage = 1;

    console.log('🔄 검색 필터 초기화');
    loadRecords();
}

/**
 * 특정 페이지로 이동
 */
function goToRecordsPage(page) {
    currentRecordsPage = page;
    loadRecords();
}

/**
 * OCR 기록 목록 로드
 */
async function loadRecords() {
    try {
        showRecordsLoading();

        // API 요청 URL 생성
        const params = new URLSearchParams({
            page: currentRecordsPage,
            limit: 20,
            character: currentFilters.character || '',
            raid: currentFilters.raid || '',
            sortBy: 'created_at',
            sortOrder: 'DESC'
        });

        console.log(`📊 기록 로드 요청: 페이지 ${currentRecordsPage}, 필터:`, currentFilters);

        const response = await fetch(`/api/records?${params}`);
        console.log('response', response);
        const result = await response.json();

        console.log('API 응답 전체:', result);

        if (result.success) {
            currentRecordsData = result.data;
            console.log('기록 데이터:', result.data);
            console.log('기록 배열:', result.data.records);
            console.log('기록 배열 타입:', typeof result.data.records);
            console.log('배열인가?', Array.isArray(result.data.records));

            displayRecords(result.data.records);
            updateRecordsPagination(result.data.pagination);
            console.log(`✅ 기록 로드 완료: ${result.data.records?.length || 0}개`);
        } else {
            throw new Error(result.error || '기록 로드 실패');
        }

    } catch (error) {
        console.error('기록 로드 실패:', error);
        showRecordsError(error.message);
    }
}

/**
 * 로딩 상태 표시
 */
function showRecordsLoading() {
    hideAllRecordsStates();
    const loadingDiv = document.getElementById('recordsLoading');
    if (loadingDiv) {
        loadingDiv.classList.remove('hidden');
    }
}

/**
 * 오류 상태 표시
 */
function showRecordsError(message) {
    hideAllRecordsStates();
    const errorDiv = document.getElementById('recordsError');
    const errorMessage = document.getElementById('recordsErrorMessage');

    if (errorDiv && errorMessage) {
        errorMessage.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

/**
 * 빈 상태 표시
 */
function showRecordsEmpty() {
    hideAllRecordsStates();
    const emptyDiv = document.getElementById('recordsEmpty');
    if (emptyDiv) {
        emptyDiv.classList.remove('hidden');
    }
}

/**
 * 모든 상태 UI 숨기기
 */
function hideAllRecordsStates() {
    const states = ['recordsLoading', 'recordsError', 'recordsEmpty', 'recordsTable', 'recordsPagination'];
    states.forEach(stateId => {
        const element = document.getElementById(stateId);
        if (element) {
            element.classList.add('hidden');
        }
    });
}

/**
 * 기록 목록 표시
 */
function displayRecords(records) {
    console.log('displayRecords 호출됨, records:', records);
    console.log('records 타입:', typeof records);
    console.log('배열인가?', Array.isArray(records));

    if (!records) {
        console.log('records가 null/undefined입니다.');
        showRecordsEmpty();
        return;
    }

    if (!Array.isArray(records)) {
        console.error('records가 배열이 아닙니다:', records);
        showRecordsError('데이터 형식이 올바르지 않습니다.');
        return;
    }

    if (records.length === 0) {
        console.log('records 배열이 비어있습니다.');
        showRecordsEmpty();
        return;
    }

    hideAllRecordsStates();

    const table = document.getElementById('recordsTable');
    const tbody = document.getElementById('recordsTableBody');

    if (!table || !tbody) {
        console.error('기록 테이블 요소를 찾을 수 없습니다.');
        showRecordsError('테이블 요소를 찾을 수 없습니다.');
        return;
    }

    // 테이블 본문 초기화
    tbody.innerHTML = '';

    console.log(`${records.length}개 기록 표시 시작`);

    // 각 기록을 행으로 추가
    records.forEach((record, index) => {
        try {
            const row = createRecordRow(record, index);
            tbody.appendChild(row);
        } catch (rowError) {
            console.error(`기록 ${index} 생성 실패:`, rowError, record);
        }
    });

    // 테이블 표시
    table.classList.remove('hidden');
    console.log('테이블 표시 완료');
}

/**
 * 기록 행 생성
 */
function createRecordRow(record, index) {
    const row = document.createElement('tr');
    const rowColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
    row.style.background = rowColor;

    // 날짜 포매팅
    const createdDate = new Date(record.created_at);
    const formattedDate = createdDate.toLocaleDateString('ko-KR', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    // 관문 표시
    const gateDisplay = record.gate_number ? `${record.gate_number}관문` : '-';

    // 난이도 표시
    const difficultyDisplay = record.difficulty || '-';

    // 전투 시간 표시
    const combatTimeDisplay = record.combat_time || '-';

    // 직업 표시
    const classDisplay = record.character_class || '-';

    row.innerHTML = `
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #495057;">
            ${escapeHtml(record.character_name)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #6c757d;">
            ${escapeHtml(classDisplay)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #007bff;">
            ${escapeHtml(record.raid_name)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: center; color: #6c757d;">
            ${escapeHtml(gateDisplay)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: center;">
            <span style="
                background: ${getDifficultyColor(record.difficulty)};
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            ">${escapeHtml(difficultyDisplay)}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: center; color: #495057;">
            ${escapeHtml(combatTimeDisplay)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: center;">
            <span style="
                background: #17a2b8;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            ">${record.stats_count}개</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 13px;">
            ${formattedDate}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: center;">
            <button onclick="viewRecordDetail('${record.id}')" style="
                background: #28a745;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                margin-right: 4px;
            " title="상세 보기">👁️ 보기</button>
            ${record.image_url ? `
                <button onclick="viewRecordImage('${record.image_url}')" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                " title="이미지 보기">🖼️ 이미지</button>
            ` : ''}
        </td>
    `;

    return row;
}

/**
 * 난이도에 따른 색상 반환
 */
function getDifficultyColor(difficulty) {
    switch (difficulty?.toLowerCase()) {
        case '노말': return '#28a745';
        case '하드': return '#ffc107';
        case '헬': case '인페르노': return '#dc3545';
        case '익스트림': return '#6f42c1';
        default: return '#6c757d';
    }
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 페이지네이션 업데이트
 */
function updateRecordsPagination(pagination) {
    if (!pagination) return;

    // 페이지네이션 표시
    const paginationDiv = document.getElementById('recordsPagination');
    if (paginationDiv && pagination.totalPages > 0) {
        paginationDiv.classList.remove('hidden');
    }

    // 페이지 정보 업데이트
    const pageInfo = document.getElementById('recordsPageInfo');
    const totalInfo = document.getElementById('recordsTotalInfo');

    if (pageInfo) {
        pageInfo.textContent = `${pagination.currentPage} / ${pagination.totalPages}`;
    }

    if (totalInfo) {
        totalInfo.textContent = `총 ${pagination.totalRecords}개 기록`;
    }

    // 버튼 상태 업데이트
    const firstPageBtn = document.getElementById('recordsFirstPageBtn');
    const prevPageBtn = document.getElementById('recordsPrevPageBtn');
    const nextPageBtn = document.getElementById('recordsNextPageBtn');
    const lastPageBtn = document.getElementById('recordsLastPageBtn');

    const isFirstPage = pagination.currentPage === 1;
    const isLastPage = pagination.currentPage === pagination.totalPages;

    if (firstPageBtn) firstPageBtn.disabled = isFirstPage;
    if (prevPageBtn) prevPageBtn.disabled = isFirstPage;
    if (nextPageBtn) nextPageBtn.disabled = isLastPage;
    if (lastPageBtn) lastPageBtn.disabled = isLastPage;

    // 버튼 스타일 업데이트
    [firstPageBtn, prevPageBtn, nextPageBtn, lastPageBtn].forEach(btn => {
        if (btn) {
            if (btn.disabled) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        }
    });
}

/**
 * 기록 상세 보기
 */
async function viewRecordDetail(recordId) {
    try {
        console.log(`👁️ 기록 상세 보기: ${recordId}`);

        // 로딩 표시
        showDetailLoading();

        const response = await fetch(`/api/records/${recordId}`);
        const result = await response.json();

        if (result.success) {
            displayRecordDetailModal(result.data);
        } else {
            throw new Error(result.error || '기록 상세 조회 실패');
        }

    } catch (error) {
        console.error('기록 상세 조회 실패:', error);
        alert('기록 상세 정보를 불러오는데 실패했습니다: ' + error.message);
    }
}

/**
 * 기록 이미지 보기
 */
function viewRecordImage(imagePath) {
    if (!imagePath) {
        alert('이미지 경로가 없습니다.');
        return;
    }

    console.log(`🖼️ 이미지 보기: ${imagePath}`);

    // 이미지 모달 생성
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        cursor: pointer;
    `;

    const img = document.createElement('img');
    // Cloudinary URL인 경우 https://로 시작하므로 그대로 사용, 아니면 / 추가
    img.src = imagePath.startsWith('https://') ? imagePath : `/${imagePath}`;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;

    img.onerror = () => {
        modal.innerHTML = `
            <div style="
                color: white;
                text-align: center;
                padding: 20px;
                background: rgba(0,0,0,0.7);
                border-radius: 8px;
            ">
                <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                <div>이미지를 로드할 수 없습니다.</div>
                <div style="font-size: 14px; color: #ccc; margin-top: 8px;">${imagePath}</div>
            </div>
        `;
    };

    modal.appendChild(img);

    // 클릭시 닫기
    modal.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    document.body.appendChild(modal);
}

/**
 * 상세 보기 로딩 표시 (임시)
 */
function showDetailLoading() {
    // 간단한 로딩 알림 - 나중에 모달로 개선
    console.log('📊 상세 정보 로딩 중...');
}

/**
 * 기록 상세 모달 표시
 */
function displayRecordDetailModal(data) {
    const { record, stats, parsedOcrData } = data;

    // 기존 모달 제거
    const existingModal = document.getElementById('recordDetailModal');
    if (existingModal) {
        existingModal.remove();
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.id = 'recordDetailModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        padding: 20px;
        box-sizing: border-box;
    `;

    const createdDate = new Date(record.created_at);
    const formattedDate = createdDate.toLocaleString('ko-KR');

    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 30px;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #dee2e6; padding-bottom: 15px;">
                <h2 style="margin: 0; color: #495057;">📊 기록 상세 보기</h2>
                <button onclick="closeRecordDetailModal()" style="
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                ">&times; 닫기</button>
            </div>

            <!-- 기본 정보 -->
            <div style="margin-bottom: 25px;">
                <h3 style="color: #495057; margin-bottom: 15px; border-bottom: 1px solid #dee2e6; padding-bottom: 8px;">📋 기본 정보</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div><strong>캐릭터:</strong> ${escapeHtml(record.character_name)}</div>
                    <div><strong>직업:</strong> ${escapeHtml(record.character_class || '-')}</div>
                    <div><strong>레이드:</strong> ${escapeHtml(record.raid_name)}</div>
                    <div><strong>관문:</strong> ${record.gate_number ? record.gate_number + '관문' : '-'}</div>
                    <div><strong>난이도:</strong> 
                        <span style="
                            background: ${getDifficultyColor(record.difficulty)};
                            color: white;
                            padding: 2px 8px;
                            border-radius: 12px;
                            font-size: 12px;
                            font-weight: 600;
                        ">${escapeHtml(record.difficulty || '-')}</span>
                    </div>
                    <div><strong>전투 시간:</strong> ${escapeHtml(record.combat_time || '-')}</div>
                    <div><strong>기록 시간:</strong> ${formattedDate}</div>
                    <div><strong>스탯 개수:</strong> ${stats.length}개</div>
                </div>
            </div>

            <!-- 이미지 -->
            ${record.image_url ? `
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #495057; margin-bottom: 15px; border-bottom: 1px solid #dee2e6; padding-bottom: 8px;">🖼️ 분석 이미지</h3>
                    <div style="text-align: center; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <img src="${record.image_url.startsWith('https://') ? record.image_url : '/' + record.image_url}" alt="OCR 분석 이미지" style="
                            max-width: 100%;
                            max-height: 300px;
                            border-radius: 8px;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                            cursor: pointer;
                        " onclick="viewRecordImage('${record.image_url}')" title="클릭하여 크게 보기" />
                    </div>
                </div>
            ` : ''}

            <!-- OCR 스탯 데이터 -->
            <div style="margin-bottom: 25px;">
                <h3 style="color: #495057; margin-bottom: 15px; border-bottom: 1px solid #dee2e6; padding-bottom: 8px;">📈 OCR 분석 결과</h3>
                ${Object.keys(parsedOcrData).length > 0 ? `
                    <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #6c757d; color: white;">
                                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6;">항목</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6;">값</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(parsedOcrData).map(([key, value], index) => `
                                    <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
                                        <td style="padding: 8px; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #495057;">${escapeHtml(key)}</td>
                                        <td style="padding: 8px; border-bottom: 1px solid #dee2e6; color: #007bff; font-weight: 600;">${escapeHtml(value)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div style="color: #6c757d; font-style: italic;">OCR 데이터가 없습니다.</div>'}
            </div>
        </div>
    `;

    // 모달 외부 클릭시 닫기
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeRecordDetailModal();
        }
    });

    document.body.appendChild(modal);

    console.log(`✅ 기록 상세 모달 표시: ${record.character_name} - ${record.raid_name}`);
}

/**
 * 기록 상세 모달 닫기
 */
function closeRecordDetailModal() {
    const modal = document.getElementById('recordDetailModal');
    if (modal) {
        modal.remove();
    }
}

// 페이지가 기록 페이지로 전환될 때 자동 초기화를 위한 함수
function onRecordsPageShow() {
    if (!currentRecordsData) {
        initializeRecordsPage();
    }
}