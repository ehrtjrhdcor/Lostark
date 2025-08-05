from game_simulation import GameEnvironment
from ml_model_v2 import GameMLModelV2
import time

def test_new_model_simple():
    """새 모델 간단 테스트"""
    print("=== 새 모델 성능 테스트 ===")
    
    # 모델 로드
    model = GameMLModelV2()
    model.load_model('game_model_v2.pkl')
    
    results = {
        'games': 0,
        'successful_games': 0,
        'total_score': 0,
        'goal_achievements': {'row_0': 0, 'row_1': 0, 'row_2': 0}
    }
    
    # 20게임 테스트
    num_games = 20
    for game_idx in range(num_games):
        game = GameEnvironment()
        
        print(f"\n게임 {game_idx + 1}:")
        moves = 0
        
        while not game.game_over and moves < 30:  # 무한루프 방지
            state = game.get_state()
            available_positions = state['available_positions']
            
            if available_positions:
                # AI 예측
                try:
                    predicted_pos, confidence = model.predict_next_move(state)
                    
                    # 예측된 위치가 사용 가능한지 확인
                    if predicted_pos in available_positions:
                        chosen_pos = predicted_pos
                        print(f"  수 {moves+1}: 행{chosen_pos[0]+1},칸{chosen_pos[1]+1} (신뢰도: {confidence:.2f})", end="")
                    else:
                        # 사용 불가능하면 첫 번째 사용 가능한 위치 선택
                        chosen_pos = available_positions[0]
                        print(f"  수 {moves+1}: 행{chosen_pos[0]+1},칸{chosen_pos[1]+1} (대체)", end="")
                    
                    result = game.click_position(chosen_pos[0], chosen_pos[1])
                    if 'error' not in result:
                        success_text = "성공" if result['success'] else "실패"
                        print(f" → {success_text}")
                        moves += 1
                    else:
                        print(f" → 오류: {result['error']}")
                        break
                        
                except Exception as e:
                    print(f"  AI 예측 오류: {e}")
                    chosen_pos = available_positions[0]
                    game.click_position(chosen_pos[0], chosen_pos[1])
                    moves += 1
            else:
                break
        
        # 게임 결과 분석
        achievements = game.check_goals_achieved()
        results['games'] += 1
        results['total_score'] += game.score
        
        print(f"  최종 성공 횟수: 1행={game.success_counts[0]}, 2행={game.success_counts[1]}, 3행={game.success_counts[2]}")
        print(f"  목표 달성: 1행={achievements['row_0']}, 2행={achievements['row_1']}, 3행={achievements['row_2']}")
        print(f"  전체 목표: {'달성' if achievements['all_goals'] else '실패'}, 점수: {game.score}")
        
        for key in ['row_0', 'row_1', 'row_2']:
            if achievements[key]:
                results['goal_achievements'][key] += 1
        
        if achievements['all_goals']:
            results['successful_games'] += 1
    
    # 최종 결과
    print(f"\n=== 최종 결과 ===")
    print(f"전체 게임: {results['games']}")
    print(f"전체 목표 달성: {results['successful_games']}/{results['games']} ({results['successful_games']/results['games']*100:.1f}%)")
    print(f"평균 점수: {results['total_score']/results['games']:.2f}")
    print(f"개별 목표 달성률:")
    for key in ['row_0', 'row_1', 'row_2']:
        rate = results['goal_achievements'][key] / results['games'] * 100
        print(f"  {key}: {rate:.1f}%")

if __name__ == "__main__":
    test_new_model_simple()