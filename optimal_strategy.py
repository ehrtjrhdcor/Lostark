import numpy as np
import random
from typing import List, Tuple, Dict, Optional
import copy
from functools import lru_cache
from game_simulation import GameEnvironment

class OptimalStrategy:
    def __init__(self):
        self.victory_conditions = [
            # 조건 1: 행1(10개) + 행2(6개이상) + 행3(4개이하)
            {'row_0': {'min': 10, 'max': 10}, 'row_1': {'min': 6, 'max': 10}, 'row_2': {'min': 0, 'max': 4}},
            # 조건 2: 행1(9개이상) + 행2(7개이상) + 행3(4개이하)  
            {'row_0': {'min': 9, 'max': 10}, 'row_1': {'min': 7, 'max': 10}, 'row_2': {'min': 0, 'max': 4}},
            # 조건 3: 행1(7개이상) + 행2(9개이상) + 행3(4개이하)
            {'row_0': {'min': 7, 'max': 10}, 'row_1': {'min': 9, 'max': 10}, 'row_2': {'min': 0, 'max': 4}},
            # 조건 4: 행1(6개이상) + 행2(10개) + 행3(4개이하)
            {'row_0': {'min': 6, 'max': 10}, 'row_1': {'min': 10, 'max': 10}, 'row_2': {'min': 0, 'max': 4}}
        ]
        self.memo = {}
    
    def calculate_victory_probability(self, state: Dict, condition_idx: int) -> float:
        """특정 승리 조건의 달성 가능 확률 계산"""
        condition = self.victory_conditions[condition_idx]
        success_counts = state['success_counts']
        probabilities = state['probabilities']
        clicked = state['clicked']
        
        # 각 행별로 달성 가능성 계산
        row_probabilities = []
        
        for row in range(3):
            row_key = f'row_{row}'
            target_min = condition[row_key]['min']
            target_max = condition[row_key]['max']
            current_success = success_counts[row]
            
            # 이미 목표 범위를 벗어난 경우
            if current_success > target_max:
                row_probabilities.append(0.0)
                continue
            elif current_success >= target_min:
                # 이미 목표 달성한 경우 - 추가 성공으로 범위를 벗어나지 않을 확률
                remaining_clicks = sum(1 for col in range(10) if not clicked[row][col])
                if remaining_clicks == 0:
                    row_probabilities.append(1.0)
                    continue
                
                # 남은 클릭에서 (target_max - current_success)개 이하로만 성공할 확률
                max_additional = target_max - current_success
                prob = self._calculate_binomial_at_most(remaining_clicks, probabilities[row], max_additional)
                row_probabilities.append(prob)
            else:
                # 아직 목표에 못 도달한 경우
                remaining_clicks = sum(1 for col in range(10) if not clicked[row][col])
                if remaining_clicks == 0:
                    row_probabilities.append(0.0)
                    continue
                
                need_min = target_min - current_success
                need_max = target_max - current_success
                
                if need_min > remaining_clicks:
                    row_probabilities.append(0.0)
                    continue
                
                # need_min 이상 need_max 이하 성공할 확률
                prob = self._calculate_binomial_range(remaining_clicks, probabilities[row], need_min, need_max)
                row_probabilities.append(prob)
        
        # 모든 행 조건을 만족할 확률 (독립적이라고 가정)
        total_prob = 1.0
        for prob in row_probabilities:
            total_prob *= prob
            
        return total_prob
    
    def _calculate_binomial_range(self, n: int, p_list: List[float], min_success: int, max_success: int) -> float:
        """이항분포에서 min_success <= X <= max_success 확률 계산"""
        if not p_list:
            return 0.0
        
        # 간단한 근사: 평균 확률 사용
        avg_p = sum(p_list) / len(p_list)
        
        total_prob = 0.0
        for k in range(min_success, min(max_success + 1, n + 1)):
            prob = self._binomial_coefficient(n, k) * (avg_p ** k) * ((1 - avg_p) ** (n - k))
            total_prob += prob
            
        return total_prob
    
    def _calculate_binomial_at_most(self, n: int, p_list: List[float], max_success: int) -> float:
        """이항분포에서 X <= max_success 확률 계산"""
        return self._calculate_binomial_range(n, p_list, 0, max_success)
    
    def _binomial_coefficient(self, n: int, k: int) -> float:
        """이항계수 계산"""
        if k > n or k < 0:
            return 0.0
        if k == 0 or k == n:
            return 1.0
        
        k = min(k, n - k)  # 최적화
        result = 1.0
        for i in range(k):
            result = result * (n - i) / (i + 1)
        return result
    
    def evaluate_click_expected_value(self, game_env: GameEnvironment, row: int, col: int) -> Dict:
        """특정 클릭의 기댓값 평가"""
        if game_env.clicked[row][col]:
            return {"error": "Already clicked"}
        
        current_prob = game_env.probabilities[row][col]
        
        # 성공/실패 시나리오별 승리 확률 계산
        success_values = []
        failure_values = []
        
        for condition_idx in range(4):
            # 성공 시나리오
            temp_env_success = copy.deepcopy(game_env)
            temp_env_success.clicked[row][col] = True
            temp_env_success.results[row][col] = True
            temp_env_success.success_counts[row] += 1
            self._update_probabilities(temp_env_success, True)
            
            success_prob = self.calculate_victory_probability(temp_env_success.get_state(), condition_idx)
            success_values.append(success_prob)
            
            # 실패 시나리오
            temp_env_failure = copy.deepcopy(game_env)
            temp_env_failure.clicked[row][col] = True
            temp_env_failure.results[row][col] = False
            self._update_probabilities(temp_env_failure, False)
            
            failure_prob = self.calculate_victory_probability(temp_env_failure.get_state(), condition_idx)
            failure_values.append(failure_prob)
        
        # 각 조건별 기댓값 계산
        expected_values = []
        for i in range(4):
            expected = current_prob * success_values[i] + (1 - current_prob) * failure_values[i]
            expected_values.append(expected)
        
        return {
            "expected_values": expected_values,
            "success_probabilities": success_values,
            "failure_probabilities": failure_values,
            "best_condition": int(np.argmax(expected_values)),
            "max_expected_value": max(expected_values)
        }
    
    def _update_probabilities(self, game_env: GameEnvironment, success: bool):
        """확률 업데이트 (게임 룰에 따라)"""
        for update_row in range(3):
            for update_col in range(10):
                if not game_env.clicked[update_row][update_col]:
                    if success:
                        game_env.probabilities[update_row][update_col] = max(0.25, 
                            game_env.probabilities[update_row][update_col] - 0.1)
                    else:
                        game_env.probabilities[update_row][update_col] = min(0.75, 
                            game_env.probabilities[update_row][update_col] + 0.1)
    
    def select_optimal_condition(self, game_env: GameEnvironment) -> int:
        """현재 상태에서 가장 달성 가능성 높은 조건 선택"""
        state = game_env.get_state()
        probabilities = []
        
        for i in range(4):
            prob = self.calculate_victory_probability(state, i)
            probabilities.append(prob)
        
        return int(np.argmax(probabilities))
    
    def recommend_next_click(self, game_env: GameEnvironment) -> Optional[Tuple[int, int]]:
        """다음 클릭 위치 추천 - 새로운 전략"""
        available_positions = game_env.get_available_positions()
        if not available_positions:
            return None
        
        state = game_env.get_state()
        success_counts = state['success_counts']
        
        # 현재 평균 확률 계산
        total_prob = 0
        total_positions = 0
        for row in range(3):
            for col in range(10):
                if not state['clicked'][row][col]:
                    total_prob += state['probabilities'][row][col]
                    total_positions += 1
        
        avg_probability = total_prob / total_positions if total_positions > 0 else 0.5
        
        # 전략 단계 결정
        if avg_probability >= 0.65:
            # 초반: 행1,2만 집중 공략 (높은 확률 활용)
            strategy_phase = "early"
        elif avg_probability >= 0.45:
            # 중반: 행1,2 우선, 필요시 행3
            strategy_phase = "middle"  
        else:
            # 후반: 행3으로 실패 유도 후 행1,2 마무리
            strategy_phase = "late"
        
        best_position = None
        best_score = float('-inf')
        
        for row, col in available_positions:
            current_prob = state['probabilities'][row][col]
            score = 0
            
            if strategy_phase == "early":
                # 초반: 행1,2만 선택, 높은 확률 우선
                if row < 2:
                    score = current_prob * 100 + (10 - success_counts[row]) * 10
                else:
                    score = -1000  # 행3 절대 선택 안함
                    
            elif strategy_phase == "middle":
                # 중반: 행1,2 우선하되, 목표 달성 여부 고려
                if row < 2:
                    # 목표 달성 여부에 따라 가중치 조정
                    target_needed = 7 - success_counts[row]  # 최소 7개 목표
                    remaining_clicks = sum(1 for c in range(10) if not state['clicked'][row][c])
                    
                    if target_needed > 0:
                        # 아직 목표 미달성 - 높은 우선순위
                        score = current_prob * 50 + target_needed * 20
                    else:
                        # 목표 달성 - 낮은 우선순위
                        score = current_prob * 10
                else:
                    # 행3: 확률 낮을 때만 선택 (실패 유도)
                    if current_prob < 0.4 and success_counts[2] < 4:
                        score = (1 - current_prob) * 30  # 실패 확률이 높을수록 좋음
                    else:
                        score = -500
                        
            else:  # late phase
                # 후반: 행3으로 실패 유도하거나 남은 행1,2 마무리
                if row < 2:
                    target_needed = 6 - success_counts[row]  # 최소 6개 목표
                    if target_needed > 0:
                        # 아직 목표 미달성 - 어쩔 수 없이 시도
                        score = current_prob * 20 + target_needed * 15
                    else:
                        score = -100
                else:
                    # 행3: 실패 유도 최우선
                    if success_counts[2] < 4:
                        score = (1 - current_prob) * 50 + (4 - success_counts[2]) * 20
                    else:
                        score = -1000  # 이미 4개면 더 성공하면 안됨
            
            if score > best_score:
                best_score = score
                best_position = (row, col)
        
        if best_position:
            # 간단한 기댓값 계산
            row, col = best_position
            prob = state['probabilities'][row][col]
            expected_value = prob if row < 2 else (1 - prob)
            
            return {
                "position": best_position,
                "expected_value": expected_value,
                "strategy_phase": strategy_phase,
                "avg_probability": avg_probability,
                "details": {
                    "best_score": best_score,
                    "current_prob": prob
                }
            }
        
        return None
    
    def monte_carlo_simulation(self, game_env: GameEnvironment, row: int, col: int, 
                             num_simulations: int = 1000) -> Dict:
        """몬테카를로 시뮬레이션으로 클릭 결과 평가"""
        if game_env.clicked[row][col]:
            return {"error": "Already clicked"}
        
        victory_counts = [0, 0, 0, 0]  # 각 조건별 승리 횟수
        total_victories = 0
        
        for _ in range(num_simulations):
            # 게임 환경 복사
            sim_env = copy.deepcopy(game_env)
            
            # 해당 위치 클릭
            result = sim_env.click_position(row, col)
            if "error" in result:
                continue
            
            # 랜덤하게 게임 완료까지 진행
            while not sim_env.game_over:
                available = sim_env.get_available_positions()
                if not available:
                    break
                
                # 랜덤 선택 (실제로는 더 나은 전략 사용 가능)
                random_pos = random.choice(available)
                sim_env.click_position(random_pos[0], random_pos[1])
            
            # 승리 조건 체크
            achievements = sim_env.check_goals_achieved()
            if achievements['all_goals']:
                total_victories += 1
                
                # 어떤 조건으로 승리했는지 확인
                for i, achieved in enumerate(achievements['victory_conditions']):
                    if achieved:
                        victory_counts[i] += 1
        
        return {
            "total_win_rate": total_victories / num_simulations,
            "condition_win_rates": [count / num_simulations for count in victory_counts],
            "simulations": num_simulations
        }

# 테스트 코드
if __name__ == "__main__":
    strategy = OptimalStrategy()
    game = GameEnvironment()
    
    print("=== 최적 전략 테스트 ===")
    
    # 초기 상태에서 최적 조건 선택
    optimal_condition = strategy.select_optimal_condition(game)
    print(f"최적 조건: {optimal_condition + 1}")
    
    # 다음 클릭 추천
    recommendation = strategy.recommend_next_click(game)
    if recommendation and recommendation["position"]:
        pos = recommendation["position"]
        print(f"추천 클릭: 행{pos[0]+1}, 열{pos[1]+1}")
        print(f"기댓값: {recommendation['expected_value']:.4f}")
        
        # 몬테카를로 시뮬레이션
        mc_result = strategy.monte_carlo_simulation(game, pos[0], pos[1], 100)
        print(f"시뮬레이션 승률: {mc_result['total_win_rate']:.4f}")