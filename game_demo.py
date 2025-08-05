from game_simulation import GameEnvironment
from ml_model import GameMLModel
import time

def play_demo_game():
    """AI가 게임을 플레이하는 데모"""
    print("=== AI 게임 플레이 데모 ===\n")
    
    # 모델 로드
    model = GameMLModel()
    model.load_model('game_model.pkl')
    
    # 게임 시작
    game = GameEnvironment()
    move_count = 0
    
    print("게임 시작!")
    print("3행 10칸 게임 - 1,2행은 성공할수록 좋고, 3행은 실패할수록 좋습니다.\n")
    
    while not game.game_over:
        move_count += 1
        state = game.get_state()
        
        print(f"=== {move_count}번째 수 ===")
        print(f"현재 점수: {state['score']}")
        print(f"남은 칸: {len(state['available_positions'])}")
        
        # 현재 상태 출력 (간단화)
        print("\n현재 보드 상태:")
        for row in range(3):
            row_str = f"행{row+1}: "
            for col in range(10):
                if state['clicked'][row][col]:
                    row_str += "X "
                else:
                    prob = state['probabilities'][row][col]
                    row_str += f"{prob:.1f} "
            print(row_str)
        
        # AI 예측
        if state['available_positions']:
            predicted_pos, confidence = model.predict_next_move(state)
            
            # 예측된 위치가 사용 가능한지 확인
            if predicted_pos in state['available_positions']:
                chosen_pos = predicted_pos
                print(f"\nAI 선택: 행{chosen_pos[0]+1}, 칸{chosen_pos[1]+1} (신뢰도: {confidence:.3f})")
            else:
                # 사용 불가능하면 첫 번째 사용 가능한 위치 선택
                chosen_pos = state['available_positions'][0]
                print(f"\nAI 대체 선택: 행{chosen_pos[0]+1}, 칸{chosen_pos[1]+1}")
            
            # 클릭 실행
            result = game.click_position(chosen_pos[0], chosen_pos[1])
            
            success_text = "성공" if result['success'] else "실패"
            print(f"결과: {success_text}")
            print(f"새로운 확률: {result['new_probability']:.1f}")
            print(f"점수 변화: {result['score']}")
            
            time.sleep(1)  # 시각적 효과를 위한 지연
            print("-" * 50)
    
    print(f"\n=== 게임 종료 ===")
    print(f"최종 점수: {game.score}")
    print(f"총 이동 횟수: {move_count}")

if __name__ == "__main__":
    play_demo_game()