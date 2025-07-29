// 캐릭터 검색/표시 기능

// 개별 캐릭터 카드 표시 (about 페이지용)
function displayCharacterCard(characterData, characterName) {
    const characterSearchResult = document.getElementById('characterSearchResult');
    let cardHtml = `
        <div style="margin-top: 20px;">
            <h3>🎮 검색 결과</h3>
            <div style="display: flex; justify-content: center; margin-top: 20px;">
    `;

    if (characterData && characterData.CharacterImage) {
        cardHtml += `
            <div class="character-card" 
                 style="text-align: center; border: 2px solid #3498db; border-radius: 10px; padding: 20px; background: white; max-width: 300px;">
                <img src="${characterData.CharacterImage}" 
                     alt="${characterName}" 
                     style="max-width: 150px; max-height: 200px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div style="display: none; color: #e74c3c; padding: 20px;">이미지 로드 실패</div>
                <h4 style="margin: 15px 0 10px 0; color: #2c3e50; font-size: 1.2em;">${characterName}</h4>
                <div style="text-align: left; margin-top: 15px;">
                    <p style="margin: 5px 0; color: #555;"><strong>클래스:</strong> ${characterData.CharacterClassName || '정보 없음'}</p>
                    <p style="margin: 5px 0; color: #555;"><strong>아이템 레벨:</strong> ${characterData.ItemAvgLevel || '정보 없음'}</p>
                    <p style="margin: 5px 0; color: #555;"><strong>서버:</strong> ${characterData.ServerName || '정보 없음'}</p>
                    <p style="margin: 5px 0; color: #555;"><strong>길드:</strong> ${characterData.GuildName || '길드 없음'}</p>
                </div>
            </div>
        `;
    } else {
        cardHtml += `
            <div class="character-card"
                 style="text-align: center; border: 2px solid #e74c3c; border-radius: 10px; padding: 20px; background: #fff5f5; max-width: 300px;">
                <div style="width: 150px; height: 150px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #666; margin: 0 auto;">
                    <span>이미지 없음</span>
                </div>
                <h4 style="margin: 15px 0 10px 0; color: #e74c3c; font-size: 1.2em;">${characterName}</h4>
                <p style="margin: 0; color: #999;">캐릭터 정보를 가져올 수 없습니다.</p>
            </div>
        `;
    }

    cardHtml += `
            </div>
        </div>
    `;

    characterSearchResult.innerHTML = cardHtml;
}

// 캐릭터 이미지 표시 함수 (features 페이지용)
function displayCharacterImages(profiles) {
    const apiResult = document.getElementById('apiResult');
    let imageHtml = '<div style="margin-top: 30px;"><h3>🎮 캐릭터 선택</h3><div id="characterCards" style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">';
    
    profiles.forEach((profile, index) => {
        if (profile.success && profile.data && profile.data.CharacterImage) {
            imageHtml += `
                <div class="character-card" data-character="${profile.character}" data-index="${index}" 
                     style="text-align: center; border: 2px solid #3498db; border-radius: 10px; padding: 15px; background: white; cursor: pointer; transition: all 0.3s ease;">
                    <img src="imgs/sea.jpeg" 
                    // <img src="${profile.data.CharacterImage}" 
                         alt="${profile.character}" 
                         style="max-width: 150px; max-height: 200px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div style="display: none; color: #e74c3c; padding: 20px;">이미지 로드 실패</div>
                    <h4 style="margin: 10px 0 5px 0; color: #2c3e50;">${profile.character}</h4>
                    <p style="margin: 0; font-size: 12px; color: #666;">
                        ${profile.data.CharacterClassName || '클래스 정보 없음'} 
                        ${profile.data.ItemAvgLevel ? '• ' + profile.data.ItemAvgLevel : ''}
                    </p>
                </div>
            `;
        } else {
            imageHtml += `
                <div class="character-card" data-character="${profile.character}" data-index="${index}"
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
                    <p>1관문, 2관문</p>
                </div>
                <div class="raid-option" data-raid="카제로스1막" data-difficulty="하드">
                    <h4>카제로스 1막 <span class="difficulty-hard">[하드]</span></h4>
                    <p>1관문, 2관문</p>
                </div>
                
                <!-- 카제로스 2막 -->
                <div class="raid-option" data-raid="카제로스2막" data-difficulty="노말">
                    <h4>카제로스 2막 <span class="difficulty-normal">[노말]</span></h4>
                    <p>1관문, 2관문</p>
                </div>
                <div class="raid-option" data-raid="카제로스2막" data-difficulty="하드">
                    <h4>카제로스 2막 <span class="difficulty-hard">[하드]</span></h4>
                    <p>1관문, 2관문</p>
                </div>
                
                <!-- 카제로스 3막 -->
                <div class="raid-option" data-raid="카제로스3막" data-difficulty="노말">
                    <h4>카제로스 3막 <span class="difficulty-normal">[노말]</span></h4>
                    <p>1관문, 2관문, 3관문</p>
                </div>
                <div class="raid-option" data-raid="카제로스3막" data-difficulty="하드">
                    <h4>카제로스 3막 <span class="difficulty-hard">[하드]</span></h4>
                    <p>1관문, 2관문, 3관문</p>
                </div>
                
                <!-- 카멘 -->
                <div class="raid-option" data-raid="카멘" data-difficulty="익스트림">
                    <h4>카멘 <span class="difficulty-extreme">[익스트림]</span></h4>
                    <p>1관문</p>
                </div>
            </div>
        </div>
    `;
    
    // 기존 API 결과에 캐릭터 이미지 추가
    const currentContent = apiResult.innerHTML;
    apiResult.innerHTML = currentContent + imageHtml;
    
    // 캐릭터 카드 클릭 이벤트 추가
    addCharacterCardEvents();
}

// 캐릭터 카드 클릭 이벤트 함수
function addCharacterCardEvents() {
    const characterCards = document.querySelectorAll('.character-card');
    const raidSelection = document.getElementById('raidSelection');
    const selectedCharacterName = document.getElementById('selectedCharacterName');
    
    characterCards.forEach(card => {
        card.addEventListener('click', function() {
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
            card.addEventListener('mouseenter', function() {
                if (card.style.border !== '3px solid #e74c3c') {
                    card.style.transform = 'translateY(-5px)';
                    card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                }
            });
            
            card.addEventListener('mouseleave', function() {
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
    
    raidCards.forEach(card => {
        // 기존 이벤트 리스너 제거 (중복 방지)
        card.replaceWith(card.cloneNode(true));
    });
    
    // 새로운 카드들에 이벤트 추가
    const newRaidCards = document.querySelectorAll('.raid-option');
    newRaidCards.forEach(card => {
        card.addEventListener('click', function() {
            const raid = card.dataset.raid;
            const difficulty = card.dataset.difficulty;
            openImageAnalysisModal(characterName, raid, difficulty);
        });
    });
}