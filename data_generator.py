import numpy as np
import pandas as pd
from game_simulation import GameEnvironment
import random
from typing import List, Dict

def generate_training_data(num_games: int = 1000) -> pd.DataFrame:
    """게임 데이터 생성"""
    data = []
    
    for game_idx in range(num_games):
        game = GameEnvironment()
        
        while not game.game_over:
            # 현재 상태 캡처
            state = game.get_state()
            
            # 특성 추출
            features = extract_features(state)
            
            # 최적 액션 라벨 (휴리스틱 기반)
            optimal_action = game.get_optimal_strategy_label()
            
            if optimal_action != -1:
                features['label'] = optimal_action
                data.append(features)
            
            # 다양한 전략으로 액션 선택
            available_positions = state['available_positions']
            if available_positions:
                if random.random() < 0.7:  # 70% 확률로 최적 전략
                    best_pos = divmod(optimal_action, 10)
                    if best_pos in available_positions:
                        chosen_pos = best_pos
                    else:
                        chosen_pos = random.choice(available_positions)
                else:  # 30% 확률로 랜덤
                    chosen_pos = random.choice(available_positions)
                
                game.click_position(chosen_pos[0], chosen_pos[1])
    
    return pd.DataFrame(data)

def extract_features(state: Dict) -> Dict:
    """게임 상태에서 ML 특성 추출"""
    features = {}
    
    # 기본 상태 정보
    features['current_score'] = state['score']
    features['remaining_clicks'] = len(state['available_positions'])
    
    # 각 행별 상태
    for row in range(3):
        clicked_in_row = sum(1 for col in range(10) if state['clicked'][row][col])
        avg_prob_in_row = np.mean([state['probabilities'][row][col] 
                                  for col in range(10) if not state['clicked'][row][col]])
        if np.isnan(avg_prob_in_row):
            avg_prob_in_row = 0.0
        
        features[f'row_{row}_clicked'] = clicked_in_row
        features[f'row_{row}_avg_prob'] = avg_prob_in_row
    
    # 전체 확률 분포 통계
    all_probs = []
    for row in range(3):
        for col in range(10):
            if not state['clicked'][row][col]:
                all_probs.append(state['probabilities'][row][col])
    
    if all_probs:
        features['min_prob'] = min(all_probs)
        features['max_prob'] = max(all_probs)
        features['avg_prob'] = np.mean(all_probs)
        features['std_prob'] = np.std(all_probs)
    else:
        features['min_prob'] = 0.0
        features['max_prob'] = 0.0
        features['avg_prob'] = 0.0
        features['std_prob'] = 0.0
    
    # 각 위치별 확률 (사용 가능한 위치만)
    for pos in state['available_positions']:
        row, col = pos
        features[f'pos_{row}_{col}_prob'] = state['probabilities'][row][col]
    
    return features

# 데이터 생성 및 저장
if __name__ == "__main__":
    print("훈련 데이터 생성 중...")
    df = generate_training_data(2000)
    
    print(f"생성된 데이터 수: {len(df)}")
    print(f"특성 수: {len(df.columns) - 1}")  # label 제외
    print("\n특성 목록:")
    for col in df.columns:
        if col != 'label':
            print(f"  {col}")
    
    # 라벨 분포 확인
    print(f"\n라벨 분포:")
    print(df['label'].value_counts().head(10))
    
    # CSV로 저장
    df.to_csv('training_data.csv', index=False)
    print("\n데이터가 'training_data.csv'로 저장되었습니다.")