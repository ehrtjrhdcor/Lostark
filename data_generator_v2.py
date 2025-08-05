import numpy as np
import pandas as pd
from game_simulation import GameEnvironment
import random
from typing import List, Dict

def generate_training_data_v2(num_games: int = 2000) -> pd.DataFrame:
    """새로운 게임 룰에 맞춘 훈련 데이터 생성"""
    data = []
    successful_games = 0
    
    for game_idx in range(num_games):
        game = GameEnvironment()
        game_history = []
        
        while not game.game_over:
            # 현재 상태 캡처
            state = game.get_state()
            
            # 특성 추출
            features = extract_features_v2(state)
            
            # 목표 기반 최적 액션 라벨
            optimal_action = get_optimal_strategy_v2(state)
            
            if optimal_action != -1:
                features['label'] = optimal_action
                data.append(features)
                game_history.append((features.copy(), optimal_action))
            
            # 다양한 전략으로 액션 선택
            available_positions = state['available_positions']
            if available_positions:
                chosen_pos = select_action_with_strategy(state, optimal_action, available_positions)
                result = game.click_position(chosen_pos[0], chosen_pos[1])
                
                if 'error' not in result:
                    # 게임 히스토리에 결과 저장
                    if game_history:
                        game_history[-1] = (game_history[-1][0], game_history[-1][1], result['success'])
        
        # 게임 종료 후 목표 달성 여부 확인
        achievements = game.check_goals_achieved()
        if achievements['all_goals']:
            successful_games += 1
            
        # 성공한 게임의 경우 더 높은 가중치 부여
        if achievements['all_goals']:
            # 성공 게임 데이터를 추가로 복제 (가중치 효과)
            game_data_subset = [item for item in data[-len(game_history):]]
            data.extend(game_data_subset)
    
    print(f"성공한 게임: {successful_games}/{num_games} ({successful_games/num_games*100:.1f}%)")
    return pd.DataFrame(data)

def select_action_with_strategy(state: Dict, optimal_action: int, available_positions: List) -> tuple:
    """전략적 액션 선택"""
    # 70% 확률로 최적 전략 사용
    if random.random() < 0.7 and optimal_action != -1:
        optimal_pos = divmod(optimal_action, 10)
        if optimal_pos in available_positions:
            return optimal_pos
    
    # 30% 확률로 다양한 전략 사용
    strategy_type = random.choice(['random', 'high_prob', 'low_prob', 'balanced'])
    
    if strategy_type == 'random':
        return random.choice(available_positions)
    elif strategy_type == 'high_prob':
        # 높은 확률 위치 선호
        best_pos = max(available_positions, 
                      key=lambda pos: state['probabilities'][pos[0]][pos[1]])
        return best_pos
    elif strategy_type == 'low_prob':
        # 낮은 확률 위치 선호
        best_pos = min(available_positions, 
                      key=lambda pos: state['probabilities'][pos[0]][pos[1]])
        return best_pos
    else:  # balanced
        # 중간 확률 위치 선호
        probs = [(pos, state['probabilities'][pos[0]][pos[1]]) for pos in available_positions]
        probs.sort(key=lambda x: abs(x[1] - 0.5))  # 0.5에 가까운 순서
        return probs[0][0]

def extract_features_v2(state: Dict) -> Dict:
    """새로운 게임 룰에 맞춘 특성 추출"""
    features = {}
    
    # 기본 게임 상태
    features['current_score'] = state['score']
    features['remaining_clicks'] = len(state['available_positions'])
    features['total_clicked'] = sum(sum(row) for row in state['clicked'])
    
    # 각 행별 상세 정보
    for row in range(3):
        clicked_in_row = sum(1 for col in range(10) if state['clicked'][row][col])
        success_in_row = state['success_counts'][row]
        fail_in_row = clicked_in_row - success_in_row
        
        features[f'row_{row}_clicked'] = clicked_in_row
        features[f'row_{row}_success'] = success_in_row
        features[f'row_{row}_fail'] = fail_in_row
        features[f'row_{row}_remaining'] = 10 - clicked_in_row
        
        # 목표 달성 가능성
        goal = state['goals'][f'row_{row}']
        remaining_clicks_row = 10 - clicked_in_row
        max_possible_success = success_in_row + remaining_clicks_row
        min_possible_success = success_in_row
        
        features[f'row_{row}_can_achieve_min'] = 1 if max_possible_success >= goal['min'] else 0
        features[f'row_{row}_can_achieve_max'] = 1 if min_possible_success <= goal['max'] else 0
        features[f'row_{row}_goal_pressure'] = abs(success_in_row - (goal['min'] + goal['max']) / 2)
        
        # 현재 행의 다음 클릭 가능한 위치의 확률
        next_clickable_col = clicked_in_row  # 다음 클릭 가능한 칸
        if next_clickable_col < 10:
            features[f'row_{row}_next_prob'] = state['probabilities'][row][next_clickable_col]
        else:
            features[f'row_{row}_next_prob'] = 0.0
    
    # 전체 확률 분포 통계
    all_available_probs = []
    for pos in state['available_positions']:
        all_available_probs.append(state['probabilities'][pos[0]][pos[1]])
    
    if all_available_probs:
        features['min_available_prob'] = min(all_available_probs)
        features['max_available_prob'] = max(all_available_probs)
        features['avg_available_prob'] = np.mean(all_available_probs)
        features['std_available_prob'] = np.std(all_available_probs)
        features['prob_range'] = max(all_available_probs) - min(all_available_probs)
    else:
        features['min_available_prob'] = 0.0
        features['max_available_prob'] = 0.0
        features['avg_available_prob'] = 0.0
        features['std_available_prob'] = 0.0
        features['prob_range'] = 0.0
    
    # 게임 진행 단계
    features['game_progress'] = features['total_clicked'] / 30.0
    features['early_game'] = 1 if features['total_clicked'] < 10 else 0
    features['mid_game'] = 1 if 10 <= features['total_clicked'] <= 20 else 0
    features['late_game'] = 1 if features['total_clicked'] > 20 else 0
    
    return features

def get_optimal_strategy_v2(state: Dict) -> int:
    """목표 기반 최적 전략 결정"""
    available_positions = state['available_positions']
    if not available_positions:
        return -1
    
    best_pos = None
    best_score = float('-inf')
    
    for row, col in available_positions:
        prob = state['probabilities'][row][col]
        current_success = state['success_counts'][row]
        clicked_in_row = sum(1 for c in range(10) if state['clicked'][row][c])
        remaining_in_row = 10 - clicked_in_row - 1  # 현재 클릭 후 남은 칸
        
        goal = state['goals'][f'row_{row}']
        target_min = goal['min']
        target_max = goal['max']
        
        # 행별 전략 계산
        if row < 2:  # 1, 2행: 성공 목표
            # 목표 달성 가능성 고려
            if current_success < target_min:
                # 아직 최소 목표 미달성 - 성공 확률 높은 곳 선호
                expected_score = prob * 2.0 + (1 - prob) * (-1.0)
            elif current_success >= target_max:
                # 이미 최대 목표 달성 - 실패해도 괜찮음
                expected_score = prob * (-0.5) + (1 - prob) * 0.5
            else:
                # 목표 범위 내 - 적당히 성공 선호
                expected_score = prob * 1.0 + (1 - prob) * (-0.5)
                
        else:  # 3행: 실패 목표 (0-5개 성공)
            if current_success >= target_max:
                # 이미 너무 많이 성공 - 무조건 실패 필요
                expected_score = prob * (-3.0) + (1 - prob) * 2.0
            elif current_success <= target_min:
                # 아직 실패가 충분 - 성공해도 괜찮음
                expected_score = prob * 0.5 + (1 - prob) * 1.5
            else:
                # 목표 범위 내 - 실패 약간 선호
                expected_score = prob * (-1.0) + (1 - prob) * 1.5
        
        # 게임 진행도에 따른 가중치
        game_progress = sum(sum(row_clicked) for row_clicked in state['clicked']) / 30.0
        if game_progress > 0.7:  # 후반부에서는 더 신중하게
            expected_score *= 1.5
            
        # 확률 극값에 대한 보너스 (전략적 확률 관리)
        if prob <= 0.3 or prob >= 0.7:
            expected_score *= 1.2
        
        if expected_score > best_score:
            best_score = expected_score
            best_pos = (row, col)
    
    if best_pos:
        return best_pos[0] * 10 + best_pos[1]
    return -1

# 데이터 생성 및 저장
if __name__ == "__main__":
    print("새로운 게임 룰에 맞춘 훈련 데이터 생성 중...")
    df = generate_training_data_v2(3000)  # 더 많은 데이터 생성
    
    print(f"생성된 데이터 수: {len(df)}")
    print(f"특성 수: {len(df.columns) - 1}")  # label 제외
    
    print("\n새로운 특성 목록:")
    feature_cols = [col for col in df.columns if col != 'label']
    for i, col in enumerate(feature_cols):
        print(f"  {i+1:2d}. {col}")
    
    # 라벨 분포 확인
    print(f"\n라벨 분포:")
    print(df['label'].value_counts().head(10))
    
    # CSV로 저장
    df.to_csv('training_data_v2.csv', index=False)
    print("\n새로운 훈련 데이터가 'training_data_v2.csv'로 저장되었습니다.")
    
    # 기본 통계 출력
    print(f"\n데이터 통계:")
    print(f"평균 게임 진행도: {df['game_progress'].mean():.3f}")
    print(f"평균 남은 클릭: {df['remaining_clicks'].mean():.1f}")
    print(f"목표 달성 가능성이 있는 데이터 비율:")
    for row in range(3):
        can_achieve = df[f'row_{row}_can_achieve_min'].sum() / len(df) * 100
        print(f"  {row+1}행: {can_achieve:.1f}%")