from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from game_simulation import GameEnvironment
from ml_model import GameMLModel

app = Flask(__name__)
CORS(app)

# 전역 변수로 게임 상태와 모델 관리
games = {}  # 세션별 게임 상태 저장
model = None

def load_ml_model():
    """ML 모델 로드 (v2 우선, 실패시 v1)"""
    global model
    try:
        # 먼저 v2 모델 시도
        from ml_model_v2 import GameMLModelV2
        model = GameMLModelV2()
        model.load_model('game_model_v2.pkl')
        print("ML 모델 v2 로드 완료")
        return True
    except Exception as e:
        print(f"ML 모델 v2 로드 실패: {e}")
        try:
            # v2 실패시 기존 v1 모델 시도
            model = GameMLModel()
            model.load_model('game_model.pkl')
            print("ML 모델 v1 로드 완료 (fallback)")
            return True
        except Exception as e2:
            print(f"모든 ML 모델 로드 실패: {e2}")
            return False

@app.route('/api/game/new', methods=['POST'])
def new_game():
    """새 게임 시작"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        
        # 새 게임 생성
        games[session_id] = GameEnvironment()
        
        # 게임 상태 반환
        state = games[session_id].get_state()
        
        return jsonify({
            'success': True,
            'state': {
                'clicked': state['clicked'],
                'probabilities': state['probabilities'],
                'results': state['results'],
                'success_counts': state['success_counts'],
                'goals': state['goals'],
                'score': state['score'],
                'available_positions': state['available_positions'],
                'game_over': state['game_over']
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/game/click', methods=['POST'])
def click_position():
    """특정 위치 클릭"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        row = data.get('row')
        col = data.get('col')
        
        if session_id not in games:
            return jsonify({'success': False, 'error': 'Game not found'}), 404
        
        # 클릭 실행
        result = games[session_id].click_position(row, col)
        
        if 'error' in result:
            return jsonify({'success': False, 'error': result['error']}), 400
        
        # 현재 상태 반환
        state = games[session_id].get_state()
        
        # 목표 달성 여부 체크
        achievements = games[session_id].check_goals_achieved()
        
        return jsonify({
            'success': True,
            'click_result': result,
            'achievements': achievements,
            'state': {
                'clicked': state['clicked'],
                'probabilities': state['probabilities'],
                'results': state['results'],
                'success_counts': state['success_counts'],
                'goals': state['goals'],
                'score': state['score'],
                'available_positions': state['available_positions'],
                'game_over': state['game_over']
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/game/ai-suggestion', methods=['POST'])
def get_ai_suggestion():
    """AI 추천 위치 반환"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        
        if session_id not in games:
            return jsonify({'success': False, 'error': 'Game not found'}), 404
        
        if model is None:
            return jsonify({'success': False, 'error': 'ML model not loaded'}), 500
        
        # 현재 게임 상태 가져오기
        state = games[session_id].get_state()
        
        if state['game_over']:
            return jsonify({'success': False, 'error': 'Game is over'})
        
        # AI 예측
        predicted_pos, confidence = model.predict_next_move(state)
        
        # 예측된 위치가 사용 가능한지 확인
        if predicted_pos not in state['available_positions']:
            # 사용 불가능하면 첫 번째 사용 가능한 위치 반환
            if state['available_positions']:
                predicted_pos = state['available_positions'][0]
                confidence = 0.5  # 낮은 신뢰도로 설정
            else:
                return jsonify({'success': False, 'error': 'No available positions'})
        
        return jsonify({
            'success': True,
            'suggestion': {
                'row': predicted_pos[0],
                'col': predicted_pos[1],
                'confidence': float(confidence)
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/game/state', methods=['POST'])
def get_game_state():
    """현재 게임 상태 반환"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        
        if session_id not in games:
            return jsonify({'success': False, 'error': 'Game not found'}), 404
        
        state = games[session_id].get_state()
        achievements = games[session_id].check_goals_achieved()
        
        return jsonify({
            'success': True,
            'achievements': achievements,
            'state': {
                'clicked': state['clicked'],
                'probabilities': state['probabilities'],
                'results': state['results'],
                'success_counts': state['success_counts'],
                'goals': state['goals'],
                'score': state['score'],
                'available_positions': state['available_positions'],
                'game_over': state['game_over']
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/game/auto-play', methods=['POST'])
def auto_play():
    """AI가 자동으로 한 수 플레이"""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        
        if session_id not in games:
            return jsonify({'success': False, 'error': 'Game not found'}), 404
        
        if model is None:
            return jsonify({'success': False, 'error': 'ML model not loaded'}), 500
        
        game = games[session_id]
        state = game.get_state()
        
        if state['game_over']:
            return jsonify({'success': False, 'error': 'Game is over'})
        
        # AI 예측 및 실행
        predicted_pos, confidence = model.predict_next_move(state)
        
        # 예측된 위치가 사용 가능한지 확인
        if predicted_pos not in state['available_positions']:
            if state['available_positions']:
                predicted_pos = state['available_positions'][0]
            else:
                return jsonify({'success': False, 'error': 'No available positions'})
        
        # 클릭 실행
        result = game.click_position(predicted_pos[0], predicted_pos[1])
        
        # 새로운 상태 반환
        new_state = game.get_state()
        achievements = game.check_goals_achieved()
        
        return jsonify({
            'success': True,
            'ai_move': {
                'row': predicted_pos[0],
                'col': predicted_pos[1],
                'confidence': float(confidence)
            },
            'click_result': result,
            'achievements': achievements,
            'state': {
                'clicked': new_state['clicked'],
                'probabilities': new_state['probabilities'],
                'results': new_state['results'],
                'success_counts': new_state['success_counts'],
                'goals': new_state['goals'],
                'score': new_state['score'],
                'available_positions': new_state['available_positions'],
                'game_over': new_state['game_over']
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    # ML 모델 로드
    if load_ml_model():
        print("게임 API 서버 시작 중...")
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        print("ML 모델을 로드할 수 없어 서버를 시작할 수 없습니다.")