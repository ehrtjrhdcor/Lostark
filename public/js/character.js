// 캐릭터 검색/표시 기능


// 캐릭터 이미지 표시 함수 (features 페이지용)
function displayCharacterImages(profiles) {
    console.log('=== displayCharacterImages 호출됨 ===');
    console.log('profiles:', profiles);
    console.log('profiles 길이:', profiles ? profiles.length : 'undefined');
    
    const apiResult = document.getElementById('apiResult');
    if (!apiResult) {
        console.error('apiResult 요소를 찾을 수 없습니다');
        return;
    }
    
    // profiles가 비어있거나 없는 경우 처리
    if (!profiles || profiles.length === 0) {
        console.log('프로필 데이터가 비어있습니다');
        const errorHtml = '<div style="margin-top: 30px; text-align: center; color: #e74c3c;"><h3>⚠️ 캐릭터 정보 없음</h3><p>캐릭터 데이터를 찾을 수 없습니다.</p></div>';
        apiResult.innerHTML += errorHtml;
        return;
    }

    let imageHtml = '<div style="margin-top: 30px;"><h3>🎮 캐릭터 선택</h3><div id="characterCards" style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">';

    profiles.forEach((profile, index) => {
        console.log(`프로필 ${index}:`, profile);
        console.log(`프로필 ${index} success:`, profile.success);
        console.log(`프로필 ${index} data:`, profile.data);
        
        if (profile.success && profile.data && profile.data.CharacterImage) {
            imageHtml += `
                <div class="character-card" data-character="${profile.character}" data-class="${profile.data.CharacterClassName || ''}" data-index="${index}" 
                     style="text-align: center; border: 2px solid #3498db; border-radius: 10px; padding: 15px; background: white; cursor: pointer; transition: all 0.3s ease;">
                    <img src="${profile.data.CharacterImage}" 
                         alt="${profile.character}" 
                         style="max-width: 150px; max-height: 200px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div style="display: none; color: #e74c3c; padding: 20px;">이미지 로드 실패</div>
                    <h4 style="margin: 10px 0 5px 0; color: #2c3e50;">${profile.character}</h4>
                    <p style="margin: 0; font-size: 12px; color: #666;">
                    ${profile.data.CharacterClassName || '클래스 정보 없음'} 
                    ${profile.data.ItemAvgLevel ? '아이템 레벨: ' + profile.data.ItemAvgLevel : ''}
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #666;">
                    ${profile.data.CombatPower ? '전투력: ' + profile.data.CombatPower : ''}
                    </p>
                </div>
            `;
        } else {
            imageHtml += `
                <div class="character-card" data-character="${profile.character}" data-class="" data-index="${index}"
                     style="text-align: center; border: 2px solid #e74c3c; border-radius: 10px; padding: 15px; background: #fff5f5; cursor: not-allowed; opacity: 0.6;">
                    <div style="width: 150px; height: 150px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #666;">
                        <span>이미지 없음</span>
                    </div>
                    <h4 style="margin: 10px 0 5px 0; color: #e74c3c;">${profile.character}</h4>
                    <p style="margin: 0; font-size: 12px; color: #999;">프로필 조회 실패</p>
                </div>
            `;
        }
    });

    imageHtml += '</div></div>';

    // 레이드 선택 섹션 (초기에는 숨김)
    imageHtml += `
        <div id="raidSelection" class="raid-selection-container hidden">
            <h3>⚔️ 레이드 선택</h3>
            <p>선택된 캐릭터: <span id="selectedCharacterName" class="selected-character-name"></span></p>
            <div class="raid-grid">
                <!-- 카제로스 1막 -->
                <div class="raid-option" data-raid="카제로스1막" data-difficulty="노말">
                    <h4>카제로스 1막 <span class="difficulty-normal">[노말]</span></h4>
                </div>
                <div class="raid-option" data-raid="카제로스1막" data-difficulty="하드">
                    <h4>카제로스 1막 <span class="difficulty-hard">[하드]</span></h4>
                </div>
                
                <!-- 카제로스 2막 -->
                <div class="raid-option" data-raid="카제로스2막" data-difficulty="노말">
                    <h4>카제로스 2막 <span class="difficulty-normal">[노말]</span></h4>
                </div>
                <div class="raid-option" data-raid="카제로스2막" data-difficulty="하드">
                    <h4>카제로스 2막 <span class="difficulty-hard">[하드]</span></h4>
                </div>
                
                <!-- 카제로스 3막 -->
                <div class="raid-option" data-raid="카제로스3막" data-difficulty="노말">
                    <h4>카제로스 3막 <span class="difficulty-normal">[노말]</span></h4>
                </div>
                <div class="raid-option" data-raid="카제로스3막" data-difficulty="하드">
                    <h4>카제로스 3막 <span class="difficulty-hard">[하드]</span></h4>
                </div>
                
                <!-- 카멘 -->
                <div class="raid-option" data-raid="카멘" data-difficulty="익스트림">
                    <h4>카멘 <span class="difficulty-extreme">[익스트림]</span></h4>
                </div>
            </div>
        </div>
    `;

    // 기존 API 결과에 캐릭터 이미지 추가
    const currentContent = apiResult.innerHTML;
    console.log('현재 apiResult 내용:', currentContent);
    console.log('추가할 imageHtml:', imageHtml);
    
    apiResult.innerHTML = currentContent + imageHtml;
    
    console.log('업데이트 후 apiResult 내용:', apiResult.innerHTML);

    // 캐릭터 카드 클릭 이벤트 추가
    addCharacterCardEvents();
}

// 캐릭터 카드 클릭 이벤트 함수
function addCharacterCardEvents() {
    const characterCards = document.querySelectorAll('.character-card');
    const raidSelection = document.getElementById('raidSelection');
    const selectedCharacterName = document.getElementById('selectedCharacterName');

    characterCards.forEach(card => {
        card.addEventListener('click', function () {
            // 프로필 조회 실패한 캐릭터는 선택 불가
            if (card.style.cursor === 'not-allowed') {
                return;
            }

            // 이전 선택 해제
            characterCards.forEach(c => {
                c.style.border = '2px solid #3498db';
                c.style.boxShadow = 'none';
                c.style.backgroundColor = 'white';
            });

            // 현재 카드 선택 표시
            card.style.border = '3px solid #e74c3c';
            card.style.boxShadow = '0 0 15px rgba(231, 76, 60, 0.3)';
            card.style.backgroundColor = '#fff5f5';

            // 선택된 캐릭터 이름 표시
            const characterName = card.dataset.character;
            selectedCharacterName.textContent = characterName;

            // 레이드 선택 섹션 표시
            raidSelection.classList.remove('hidden');

            console.log('선택된 캐릭터:', characterName);

            // 레이드 카드 클릭 이벤트 추가
            addRaidCardEvents(characterName);
        });

        // 호버 효과 (선택 가능한 카드만)
        if (card.style.cursor !== 'not-allowed') {
            card.addEventListener('mouseenter', function () {
                if (card.style.border !== '3px solid #e74c3c') {
                    card.style.transform = 'translateY(-5px)';
                    card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                }
            });

            card.addEventListener('mouseleave', function () {
                if (card.style.border !== '3px solid #e74c3c') {
                    card.style.transform = 'translateY(0)';
                    card.style.boxShadow = 'none';
                }
            });
        }
    });
}

// 레이드 카드 클릭 이벤트 함수
function addRaidCardEvents(characterName) {
    const raidCards = document.querySelectorAll('.raid-option');

    // 선택된 캐릭터 카드에서 직업 정보 가져오기
    const selectedCard = document.querySelector(`[data-character="${characterName}"]`);
    const characterClass = selectedCard ? selectedCard.dataset.class : '';

    raidCards.forEach(card => {
        // 기존 이벤트 리스너 제거 (중복 방지)
        card.replaceWith(card.cloneNode(true));
    });

    // 새로운 카드들에 이벤트 추가
    const newRaidCards = document.querySelectorAll('.raid-option');
    newRaidCards.forEach(card => {
        card.addEventListener('click', function () {
            const raid = card.dataset.raid;
            const difficulty = card.dataset.difficulty;
            showGateSelectionModal(characterName, raid, difficulty, characterClass);
        });
    });
}

// 관문 선택 모달 표시 함수
function showGateSelectionModal(characterName, raid, difficulty, characterClass) {
    // 레이드별 관문 정보 정의
    const gateInfo = {
        '카제로스1막': [1, 2],
        '카제로스2막': [1, 2],
        '카제로스3막': [1, 2, 3],
        '카멘': [0]
    };

    const gates = gateInfo[raid] || [];
    
    // 모달 HTML 생성
    const modalHtml = `
        <div id="gateSelectionModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 10px; padding: 30px; max-width: 400px; width: 90%;">
                <h3 style="margin-top: 0; color: #2c3e50; text-align: center;">관문 선택</h3>
                <p style="text-align: center; color: #666; margin-bottom: 20px;">
                    <strong>${characterName}</strong><br>
                    ${raid} [${difficulty}]
                </p>
                <div id="gateButtons" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 20px;">
                    ${gates.map(gate => `
                        <button class="gate-btn" data-gate="${gate}" 
                                style="padding: 10px 20px; border: 2px solid #3498db; background: white; color: #3498db; border-radius: 5px; cursor: pointer; transition: all 0.3s;">
                            ${gate === 0 ? '전체' : gate + '관문'}
                        </button>
                    `).join('')}
                </div>
                <div style="text-align: center;">
                    <button id="cancelGateSelection" 
                            style="padding: 8px 20px; border: 1px solid #ccc; background: white; color: #666; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                        취소
                    </button>
                </div>
            </div>
        </div>
    `;

    // 모달을 body에 추가
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 관문 버튼 클릭 이벤트
    const gateButtons = document.querySelectorAll('.gate-btn');
    gateButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const selectedGate = this.dataset.gate;
            
            // 모달 제거
            document.getElementById('gateSelectionModal').remove();
            
            // OCR 모달 열기
            openImageAnalysisModal(characterName, raid, difficulty, characterClass, selectedGate);
        });

        // 호버 효과
        btn.addEventListener('mouseenter', function() {
            this.style.background = '#3498db';
            this.style.color = 'white';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.background = 'white';
            this.style.color = '#3498db';
        });
    });

    // 취소 버튼 클릭 이벤트
    document.getElementById('cancelGateSelection').addEventListener('click', function() {
        document.getElementById('gateSelectionModal').remove();
    });

    // 모달 외부 클릭 시 닫기
    document.getElementById('gateSelectionModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

