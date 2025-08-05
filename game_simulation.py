import numpy as np
import random
from typing import List, Tuple, Dict

class GameEnvironment:
    def __init__(self):
        self.rows = 3
        self.cols = 10
        self.reset()
    
    def reset(self):
        # 각 칸의 클릭 여부 (False: 미클릭, True: 클릭됨)
        self.clicked = [[False for _ in range(self.cols)] for _ in range(self.rows)]
        # 각 칸의 현재 성공 확률 (기본 75%에서 시작)
        self.probabilities = [[0.75 for _ in range(self.cols)] for _ in range(self.rows)]
        # 각 칸의 성공/실패 결과 저장 (None: 미클릭, True: 성공, False: 실패)
        self.results = [[None for _ in range(self.cols)] for _ in range(self.rows)]
        # 각 행별 성공 횟수
        self.success_counts = [0, 0, 0]
        # 게임 목표 (행별 성공 목표)
        self.goals = {
            'row_0': {'min': 7, 'max': 9},  # 1행: 7-9개 성공
            'row_1': {'min': 6, 'max': 10}, # 2행: 6-10개 성공  
            'row_2': {'min': 0, 'max': 5}   # 3행: 0-5개 성공
        }
        self.score = 0
        self.game_over = False
    
    def get_available_positions(self) -> List[Tuple[int, int]]:
        """클릭 가능한 위치들 반환 (각 행의 맨 왼쪽 미클릭 칸만)"""
        available = []
        for row in range(self.rows):
            for col in range(self.cols):
                if not self.clicked[row][col]:
                    available.append((row, col))
                    break  # 각 행에서 첫 번째 미클릭 칸만 추가
        return available
    
    def click_position(self, row: int, col: int) -> Dict:
        """특정 위치 클릭"""
        if self.clicked[row][col]:
            return {"error": "Already clicked"}
        
        # 순차 진행 체크 - 해당 행의 맨 왼쪽 미클릭 칸인지 확인
        for check_col in range(col):
            if not self.clicked[row][check_col]:
                return {"error": "Must click from left to right"}
        
        # 현재 확률로 성공/실패 결정
        current_prob = self.probabilities[row][col]
        success = random.random() < current_prob
        
        # 클릭 처리
        self.clicked[row][col] = True
        self.results[row][col] = success
        
        # 성공 횟수 업데이트
        if success:
            self.success_counts[row] += 1
        
        # 점수 계산 (목표 기반)
        if row < 2:  # 1, 2행: 성공할수록 좋음
            if success:
                self.score += 1
            else:
                self.score -= 1
        else:  # 3행: 실패할수록 좋음
            if success:
                self.score -= 1
            else:
                self.score += 1
        
        # 확률 업데이트 (성공시 -10%, 실패시 +10%) - 모든 행의 미클릭 칸에 적용
        for update_row in range(self.rows):
            for update_col in range(self.cols):
                if not self.clicked[update_row][update_col]:
                    if success:
                        self.probabilities[update_row][update_col] = max(0.25, self.probabilities[update_row][update_col] - 0.1)
                    else:
                        self.probabilities[update_row][update_col] = min(0.75, self.probabilities[update_row][update_col] + 0.1)
        
        # 게임 종료 체크 (모든 칸이 클릭됨)
        if len(self.get_available_positions()) == 0:
            self.game_over = True
        
        return {
            "success": success,
            "score": self.score,
            "new_probability": self.probabilities[row][col],
            "success_counts": self.success_counts.copy(),
            "game_over": self.game_over
        }
    
    def get_state(self) -> Dict:
        """현재 게임 상태 반환"""
        return {
            "clicked": self.clicked,
            "probabilities": self.probabilities,
            "results": self.results,
            "success_counts": self.success_counts.copy(),
            "goals": self.goals,
            "score": self.score,
            "available_positions": self.get_available_positions(),
            "game_over": self.game_over
        }
    
    def check_goals_achieved(self) -> Dict:
        """목표 달성 여부 체크"""
        achievements = {}
        for i in range(3):
            row_key = f'row_{i}'
            goal = self.goals[row_key]
            success_count = self.success_counts[i]
            
            achievements[row_key] = {
                'achieved': goal['min'] <= success_count <= goal['max'],
                'current': success_count,
                'target': f"{goal['min']}-{goal['max']}"
            }
        
        all_achieved = all(achievements[f'row_{i}']['achieved'] for i in range(3))
        achievements['all_goals'] = all_achieved
        
        return achievements
    
    def get_optimal_strategy_label(self) -> int:
        """간단한 휴리스틱으로 최적 전략 라벨 생성"""
        available = self.get_available_positions()
        if not available:
            return -1
        
        best_pos = None
        best_score = float('-inf')
        
        for row, col in available:
            prob = self.probabilities[row][col]
            
            if row < 2:  # 1, 2행: 성공할수록 좋음
                expected_score = prob * 1 + (1 - prob) * (-1)
            else:  # 3행: 실패할수록 좋음
                expected_score = prob * (-1) + (1 - prob) * 1
            
            if expected_score > best_score:
                best_score = expected_score
                best_pos = (row, col)
        
        # 위치를 0-29 범위의 라벨로 변환
        if best_pos:
            return best_pos[0] * 10 + best_pos[1]
        return -1

# 테스트
if __name__ == "__main__":
    game = GameEnvironment()
    print("게임 초기 상태:")
    state = game.get_state()
    print(f"점수: {state['score']}")
    print(f"사용 가능한 위치: {len(state['available_positions'])}개")
    
    # 몇 번 클릭해보기
    for i in range(5):
        available = game.get_available_positions()
        if available:
            pos = random.choice(available)
            result = game.click_position(pos[0], pos[1])
            print(f"\n클릭 {i+1}: 위치 {pos}, 성공: {result['success']}, 점수: {result['score']}")