import pandas as pd
import numpy as np
import random
from typing import List, Dict, Tuple
import csv
from game_simulation import GameEnvironment
from optimal_strategy import OptimalStrategy
import copy

class DataGenerator:
    def __init__(self):
        self.strategy = OptimalStrategy()
        
    def generate_game_features(self, game_env: GameEnvironment) -> Dict:
        """게임 상태에서 특징(features) 추출"""
        state = game_env.get_state()
        
        # 기본 상태 특징
        features = {
            # 각 행별 성공 횟수
            'row_0_success': state['success_counts'][0],
            'row_1_success': state['success_counts'][1], 
            'row_2_success': state['success_counts'][2],
            
            # 각 행별 남은 클릭 수
            'row_0_remaining': sum(1 for col in range(10) if not state['clicked'][0][col]),
            'row_1_remaining': sum(1 for col in range(10) if not state['clicked'][1][col]),
            'row_2_remaining': sum(1 for col in range(10) if not state['clicked'][2][col]),
            
            # 각 행별 평균 확률
            'row_0_avg_prob': self._calculate_row_avg_prob(state, 0),
            'row_1_avg_prob': self._calculate_row_avg_prob(state, 1),
            'row_2_avg_prob': self._calculate_row_avg_prob(state, 2),
            
            # 현재 점수
            'current_score': state['score'],
            
            # 총 진행률
            'total_progress': sum(state['success_counts']) / 30,
            
            # 각 승리 조건별 달성 가능 확률
            'condition_0_prob': self.strategy.calculate_victory_probability(state, 0),
            'condition_1_prob': self.strategy.calculate_victory_probability(state, 1),
            'condition_2_prob': self.strategy.calculate_victory_probability(state, 2),
            'condition_3_prob': self.strategy.calculate_victory_probability(state, 3),
        }
        
        # 각 행별 목표 달성 상태
        achievements = game_env.check_goals_achieved()
        for i in range(3):
            features[f'row_{i}_goal_achieved'] = int(achievements[f'row_{i}']['achieved'])
            features[f'row_{i}_target_distance'] = self._calculate_target_distance(
                achievements[f'row_{i}']['current'], achievements[f'row_{i}']['target']
            )
        
        # 최적 조건 및 기댓값
        optimal_condition = self.strategy.select_optimal_condition(game_env)
        features['optimal_condition'] = optimal_condition
        features['optimal_condition_prob'] = features[f'condition_{optimal_condition}_prob']
        
        return features
    
    def _calculate_row_avg_prob(self, state: Dict, row: int) -> float:
        """특정 행의 미클릭 칸 평균 확률 계산"""
        probabilities = []
        for col in range(10):
            if not state['clicked'][row][col]:
                probabilities.append(state['probabilities'][row][col])
        
        return sum(probabilities) / len(probabilities) if probabilities else 0.0
    
    def _calculate_target_distance(self, current: int, target_str: str) -> int:
        """목표까지의 거리 계산"""
        target_parts = target_str.split('-')
        target_min = int(target_parts[0])
        target_max = int(target_parts[1])
        
        if current < target_min:
            return target_min - current
        elif current > target_max:
            return current - target_max
        else:
            return 0
    
    def play_optimal_game(self) -> List[Dict]:
        """최적 전략으로 한 게임 플레이하고 각 단계 데이터 수집"""
        game_data = []
        game = GameEnvironment()
        
        step = 0
        while not game.game_over and step < 100:  # 무한루프 방지
            # 현재 상태 특징 추출
            features = self.generate_game_features(game)
            
            # 다음 클릭 추천받기
            recommendation = self.strategy.recommend_next_click(game)
            if not recommendation or not recommendation["position"]:
                break
            
            pos = recommendation["position"]
            row, col = pos
            
            # 라벨 생성 (0-29 범위)
            action_label = row * 10 + col
            
            # 클릭 전 상태와 라벨 저장
            record = features.copy()
            record['step'] = step
            record['action_row'] = row
            record['action_col'] = col  
            record['action_label'] = action_label
            record['expected_value'] = recommendation["expected_value"]
            
            # 실제 클릭 수행
            result = game.click_position(row, col)
            if "error" in result:
                break
                
            # 클릭 결과 기록
            record['click_success'] = int(result['success'])
            record['score_after'] = result['score']
            
            game_data.append(record)
            step += 1
        
        # 게임 종료 후 최종 결과 기록
        final_achievements = game.check_goals_achieved()
        game_won = final_achievements['all_goals']
        
        # 모든 레코드에 최종 결과 추가
        for record in game_data:
            record['game_won'] = int(game_won)
            record['final_score'] = game.score
            
            # 승리한 조건들 기록
            for i, condition_achieved in enumerate(final_achievements['victory_conditions']):
                record[f'won_condition_{i}'] = int(condition_achieved)
        
        return game_data
    
    def play_random_game(self) -> List[Dict]:
        """랜덤 전략으로 한 게임 플레이 (비교용)"""
        game_data = []
        game = GameEnvironment()
        
        step = 0
        while not game.game_over and step < 100:
            # 현재 상태 특징 추출
            features = self.generate_game_features(game)
            
            # 랜덤 클릭 선택
            available_positions = game.get_available_positions()
            if not available_positions:
                break
                
            pos = random.choice(available_positions)
            row, col = pos
            action_label = row * 10 + col
            
            # 클릭 전 상태와 라벨 저장
            record = features.copy()
            record['step'] = step
            record['action_row'] = row
            record['action_col'] = col
            record['action_label'] = action_label
            record['expected_value'] = 0.0  # 랜덤이므로 기댓값 없음
            record['strategy_type'] = 'random'
            
            # 실제 클릭 수행
            result = game.click_position(row, col)
            if "error" in result:
                break
                
            # 클릭 결과 기록
            record['click_success'] = int(result['success'])
            record['score_after'] = result['score']
            
            game_data.append(record)
            step += 1
        
        # 게임 종료 후 최종 결과 기록
        final_achievements = game.check_goals_achieved()
        game_won = final_achievements['all_goals']
        
        for record in game_data:
            record['game_won'] = int(game_won)
            record['final_score'] = game.score
            record['strategy_type'] = 'random'
            
            for i, condition_achieved in enumerate(final_achievements['victory_conditions']):
                record[f'won_condition_{i}'] = int(condition_achieved)
        
        return game_data
    
    def generate_mixed_strategy_game(self) -> List[Dict]:
        """최적전략 + 약간의 랜덤성을 섞은 게임"""
        game_data = []
        game = GameEnvironment()
        
        step = 0
        while not game.game_over and step < 100:
            features = self.generate_game_features(game)
            
            # 80% 확률로 최적 전략, 20% 확률로 랜덤
            if random.random() < 0.8:
                recommendation = self.strategy.recommend_next_click(game)
                if not recommendation or not recommendation["position"]:
                    break
                pos = recommendation["position"]
                expected_value = recommendation["expected_value"]
                strategy_type = 'optimal'
            else:
                available_positions = game.get_available_positions()
                if not available_positions:
                    break
                pos = random.choice(available_positions)
                expected_value = 0.0
                strategy_type = 'random'
            
            row, col = pos
            action_label = row * 10 + col
            
            record = features.copy()
            record['step'] = step
            record['action_row'] = row
            record['action_col'] = col
            record['action_label'] = action_label
            record['expected_value'] = expected_value
            record['strategy_type'] = strategy_type
            
            result = game.click_position(row, col)
            if "error" in result:
                break
                
            record['click_success'] = int(result['success'])
            record['score_after'] = result['score']
            
            game_data.append(record)
            step += 1
        
        # 최종 결과 추가
        final_achievements = game.check_goals_achieved()
        game_won = final_achievements['all_goals']
        
        for record in game_data:
            record['game_won'] = int(game_won)
            record['final_score'] = game.score
            
            for i, condition_achieved in enumerate(final_achievements['victory_conditions']):
                record[f'won_condition_{i}'] = int(condition_achieved)
        
        return game_data
    
    def generate_dataset(self, 
                        num_optimal_games: int = 1000,
                        num_random_games: int = 500, 
                        num_mixed_games: int = 500,
                        output_file: str = "training_data_v6.csv") -> None:
        """전체 데이터셋 생성"""
        
        print("=== 게임 AI 학습 데이터 생성 시작 ===")
        all_data = []
        
        # 최적 전략 게임들
        print(f"최적 전략 게임 {num_optimal_games}개 생성 중...")
        for i in range(num_optimal_games):
            if i % 100 == 0:
                print(f"  진행률: {i}/{num_optimal_games}")
            
            game_data = self.play_optimal_game()
            for record in game_data:
                record['game_id'] = f'optimal_{i}'
                record['strategy_type'] = 'optimal'
            all_data.extend(game_data)
        
        # 랜덤 전략 게임들
        print(f"랜덤 전략 게임 {num_random_games}개 생성 중...")
        for i in range(num_random_games):
            if i % 100 == 0:
                print(f"  진행률: {i}/{num_random_games}")
            
            game_data = self.play_random_game()
            for record in game_data:
                record['game_id'] = f'random_{i}'
            all_data.extend(game_data)
        
        # 혼합 전략 게임들
        print(f"혼합 전략 게임 {num_mixed_games}개 생성 중...")
        for i in range(num_mixed_games):
            if i % 100 == 0:
                print(f"  진행률: {i}/{num_mixed_games}")
            
            game_data = self.generate_mixed_strategy_game()
            for record in game_data:
                record['game_id'] = f'mixed_{i}'
            all_data.extend(game_data)
        
        # 데이터프레임 생성 및 저장
        print(f"총 {len(all_data)}개 레코드 생성됨")
        df = pd.DataFrame(all_data)
        
        # NaN 값 처리
        df = df.fillna(0)
        
        # CSV 저장
        df.to_csv(output_file, index=False, encoding='utf-8')
        print(f"데이터셋이 {output_file}에 저장되었습니다.")
        
        # 기본 통계 출력
        print("\n=== 데이터셋 통계 ===")
        print(f"총 레코드 수: {len(df)}")
        print(f"게임 수: {df['game_id'].nunique()}")
        print(f"전략별 게임 수:")
        print(df['strategy_type'].value_counts())
        print(f"승률: {df['game_won'].mean():.3f}")
        print(f"평균 점수: {df['final_score'].mean():.2f}")
        
        return df

# 테스트 및 실행
if __name__ == "__main__":
    generator = DataGenerator()
    
    # 소규모 테스트
    print("소규모 테스트 실행...")
    test_data = generator.generate_dataset(
        num_optimal_games=10,
        num_random_games=5,
        num_mixed_games=5,
        output_file="test_dataset.csv"
    )
    
    print("\n테스트 완료. 실제 데이터셋을 생성하려면 아래 코드의 주석을 해제하세요:")
    print("# generator.generate_dataset(num_optimal_games=2000, num_random_games=1000, num_mixed_games=1000)")