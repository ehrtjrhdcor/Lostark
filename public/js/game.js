// 게임 관련 JavaScript

class MLGame {
    constructor() {
        this.sessionId = 'default';
        this.gameState = null;
        this.apiUrl = 'http://localhost:5000/api/game';
        this.isGameActive = false;
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.gameBoard = document.getElementById('gameBoard');
        this.gameScore = document.getElementById('gameScore');
        this.gameLog = document.getElementById('gameLog');
        this.aiSuggestion = document.getElementById('aiSuggestion');
        this.aiSuggestionText = document.getElementById('aiSuggestionText');
        
        this.newGameBtn = document.getElementById('newGameBtn');
        this.aiSuggestionBtn = document.getElementById('aiSuggestionBtn');
        this.autoPlayBtn = document.getElementById('autoPlayBtn');
    }
    
    bindEvents() {
        this.newGameBtn?.addEventListener('click', () => this.startNewGame());
        this.aiSuggestionBtn?.addEventListener('click', () => this.getAISuggestion());
        this.autoPlayBtn?.addEventListener('click', () => this.autoPlay());
    }
    
    async startNewGame() {
        try {
            this.logMessage('새 게임을 시작합니다...');
            
            const response = await fetch(`${this.apiUrl}/new`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.gameState = data.state;
                this.isGameActive = true;
                this.renderGameBoard();
                this.updateScore();
                this.logMessage('새 게임이 시작되었습니다!');
                this.hideAISuggestion();
            } else {
                this.logMessage(`오류: ${data.error}`);
            }
        } catch (error) {
            this.logMessage(`네트워크 오류: ${error.message}`);
            console.error('Error starting new game:', error);
        }
    }
    
    renderGameBoard() {
        if (!this.gameState || !this.gameBoard) return;
        
        this.gameBoard.innerHTML = '';
        
        for (let row = 0; row < 3; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'game-row';
            
            const rowLabel = document.createElement('div');
            rowLabel.className = 'row-label';
            rowLabel.textContent = `행${row + 1}`;
            rowDiv.appendChild(rowLabel);
            
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                cell.className = 'game-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const isClicked = this.gameState.clicked[row][col];
                const probability = this.gameState.probabilities[row][col];
                const result = this.gameState.results?.[row]?.[col];
                
                if (isClicked) {
                    // 성공/실패에 따른 표시
                    if (result === true) {
                        cell.classList.add('clicked', 'success');
                        cell.textContent = 'O';
                    } else if (result === false) {
                        cell.classList.add('clicked', 'failure');
                        cell.textContent = 'X';
                    } else {
                        cell.classList.add('clicked');
                        cell.textContent = '?';
                    }
                } else {
                    // 클릭 가능 여부 체크 (순차적 진행)
                    const isClickable = this.isPositionClickable(row, col);
                    
                    if (isClickable) {
                        cell.textContent = (probability * 100).toFixed(0) + '%';
                        cell.addEventListener('click', () => this.clickCell(row, col));
                        
                        // 확률에 따른 색상 설정
                        if (probability >= 0.7) {
                            cell.classList.add('high-prob');
                        } else if (probability >= 0.5) {
                            cell.classList.add('medium-prob');
                        } else {
                            cell.classList.add('low-prob');
                        }
                    } else {
                        cell.classList.add('disabled');
                        cell.textContent = (probability * 100).toFixed(0) + '%';
                    }
                }
                
                // 행별 색상 구분
                if (row < 2) {
                    cell.classList.add('good-row');
                } else {
                    cell.classList.add('bad-row');
                }
                
                rowDiv.appendChild(cell);
            }
            
            this.gameBoard.appendChild(rowDiv);
        }
        
        // 목표 진행상황 업데이트
        this.updateProgressBars();
        
        // 게임 종료 체크
        if (this.gameState.game_over) {
            this.isGameActive = false;
            this.logMessage(`게임 종료! 최종 점수: ${this.gameState.score}점`);
            this.showFinalResults();
        }
    }
    
    isPositionClickable(row, col) {
        if (!this.gameState) return false;
        
        // 해당 행에서 이전 칸들이 모두 클릭되었는지 확인
        for (let checkCol = 0; checkCol < col; checkCol++) {
            if (!this.gameState.clicked[row][checkCol]) {
                return false;
            }
        }
        return true;
    }
    
    updateProgressBars() {
        if (!this.gameState.success_counts) return;
        
        for (let row = 0; row < 3; row++) {
            const progressBar = document.getElementById(`progress-row-${row}`);
            const progressText = document.getElementById(`progress-text-${row}`);
            
            if (progressBar && progressText) {
                const successCount = this.gameState.success_counts[row];
                const totalClicked = this.gameState.clicked[row].filter(Boolean).length;
                
                // 진행률 계산 (클릭된 칸 수 기준)
                const progress = (totalClicked / 10) * 100;
                progressBar.style.setProperty('--progress', `${progress}%`);
                
                // 진행상황 텍스트
                progressText.textContent = `${successCount}/${totalClicked}`;
                
                // 목표 달성 여부에 따른 색상
                const goal = this.gameState.goals[`row_${row}`];
                if (totalClicked === 10) { // 해당 행이 완료된 경우
                    if (goal.min <= successCount && successCount <= goal.max) {
                        progressBar.className = 'progress-bar success';
                    } else {
                        progressBar.className = 'progress-bar danger';
                    }
                } else {
                    progressBar.className = 'progress-bar';
                }
            }
        }
    }
    
    showFinalResults() {
        // 최종 결과 알림 표시
        const achievements = this.checkAchievements();
        if (achievements && achievements.all_goals) {
            this.showAchievementNotification('🏆 모든 목표 달성! 축하합니다!', 'all-goals');
        } else {
            this.showAchievementNotification('게임 종료! 일부 목표를 달성하지 못했습니다.');
        }
    }
    
    checkAchievements() {
        if (!this.gameState.success_counts || !this.gameState.goals) return null;
        
        const achievements = {};
        let allAchieved = true;
        
        for (let row = 0; row < 3; row++) {
            const goal = this.gameState.goals[`row_${row}`];
            const successCount = this.gameState.success_counts[row];
            const achieved = goal.min <= successCount && successCount <= goal.max;
            achievements[`row_${row}`] = achieved;
            
            if (!achieved) allAchieved = false;
        }
        
        achievements.all_goals = allAchieved;
        return achievements;
    }
    
    showAchievementNotification(message, type = '') {
        const notification = document.createElement('div');
        notification.className = `achievement-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    async clickCell(row, col) {
        if (!this.isGameActive || this.gameState.clicked[row][col]) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/click`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    row: row,
                    col: col
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const result = data.click_result;
                this.gameState = data.state;
                
                const resultText = result.success ? '성공' : '실패';
                const pointChange = this.gameState.score - (this.gameScore.textContent.match(/\d+/) || [0])[0];
                
                this.logMessage(`행${row + 1}, 칸${col + 1} 클릭: ${resultText} (${pointChange >= 0 ? '+' : ''}${pointChange}점)`);
                
                this.renderGameBoard();
                this.updateScore();
                this.hideAISuggestion();
            } else {
                this.logMessage(`오류: ${data.error}`);
            }
        } catch (error) {
            this.logMessage(`네트워크 오류: ${error.message}`);
            console.error('Error clicking cell:', error);
        }
    }
    
    async getAISuggestion() {
        if (!this.isGameActive) {
            this.logMessage('게임이 진행 중이 아닙니다.');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/ai-suggestion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const suggestion = data.suggestion;
                this.showAISuggestion(suggestion);
                this.highlightSuggestedCell(suggestion.row, suggestion.col);
                
                const confidence = (suggestion.confidence * 100).toFixed(1);
                this.logMessage(`AI 추천: 행${suggestion.row + 1}, 칸${suggestion.col + 1} (신뢰도: ${confidence}%)`);
            } else {
                this.logMessage(`AI 추천 실패: ${data.error}`);
            }
        } catch (error) {
            this.logMessage(`네트워크 오류: ${error.message}`);
            console.error('Error getting AI suggestion:', error);
        }
    }
    
    async autoPlay() {
        if (!this.isGameActive) {
            this.logMessage('게임이 진행 중이 아닙니다.');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/auto-play`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const aiMove = data.ai_move;
                const result = data.click_result;
                this.gameState = data.state;
                
                const resultText = result.success ? '성공' : '실패';
                const confidence = (aiMove.confidence * 100).toFixed(1);
                
                this.logMessage(`AI 자동 플레이: 행${aiMove.row + 1}, 칸${aiMove.col + 1} → ${resultText} (신뢰도: ${confidence}%)`);
                
                this.renderGameBoard();
                this.updateScore();
                this.hideAISuggestion();
            } else {
                this.logMessage(`AI 자동 플레이 실패: ${data.error}`);
            }
        } catch (error) {
            this.logMessage(`네트워크 오류: ${error.message}`);
            console.error('Error in auto play:', error);
        }
    }
    
    showAISuggestion(suggestion) {
        if (!this.aiSuggestion || !this.aiSuggestionText) return;
        
        const confidence = (suggestion.confidence * 100).toFixed(1);
        this.aiSuggestionText.textContent = `행${suggestion.row + 1}, 칸${suggestion.col + 1} 추천 (신뢰도: ${confidence}%)`;
        this.aiSuggestion.classList.remove('hidden');
    }
    
    hideAISuggestion() {
        this.aiSuggestion?.classList.add('hidden');
        this.clearHighlights();
    }
    
    highlightSuggestedCell(row, col) {
        this.clearHighlights();
        const cell = this.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('ai-suggested');
        }
    }
    
    clearHighlights() {
        const highlightedCells = this.gameBoard.querySelectorAll('.ai-suggested');
        highlightedCells.forEach(cell => cell.classList.remove('ai-suggested'));
    }
    
    updateScore() {
        if (this.gameScore && this.gameState) {
            this.gameScore.textContent = `점수: ${this.gameState.score}`;
        }
    }
    
    logMessage(message) {
        if (!this.gameLog) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
        
        this.gameLog.appendChild(logEntry);
        this.gameLog.scrollTop = this.gameLog.scrollHeight;
        
        // 로그가 너무 많아지면 오래된 것 삭제
        while (this.gameLog.children.length > 50) {
            this.gameLog.removeChild(this.gameLog.firstChild);
        }
    }
}

// 게임 인스턴스 생성
let mlGame;

// DOM이 로드되면 게임 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 연락처 페이지가 활성화될 때만 게임 초기화
    const contactPage = document.getElementById('contact');
    if (contactPage) {
        mlGame = new MLGame();
    }
});