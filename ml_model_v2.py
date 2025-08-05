import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
import joblib
from game_simulation import GameEnvironment
import time

class GameMLModelV2:
    def __init__(self):
        self.model = RandomForestClassifier(random_state=42)
        self.scaler = StandardScaler()
        self.feature_columns = None
        self.model_version = "v2"
        
    def load_and_prepare_data(self, csv_file: str):
        """CSV 파일에서 데이터 로드 및 전처리"""
        df = pd.read_csv(csv_file)
        
        # NaN 값 처리
        df = df.fillna(0)
        
        # 특성과 라벨 분리
        X = df.drop('label', axis=1)
        y = df['label']
        
        self.feature_columns = X.columns.tolist()
        
        return X, y
    
    def hyperparameter_tuning(self, X_train, y_train):
        """하이퍼파라미터 튜닝"""
        print("하이퍼파라미터 튜닝 중...")
        
        param_grid = {
            'n_estimators': [100, 200, 300],
            'max_depth': [10, 20, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4],
            'max_features': ['sqrt', 'log2', None]
        }
        
        # 시간 절약을 위해 일부 파라미터만 튜닝
        simplified_param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [15, 20, None],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2]
        }
        
        rf = RandomForestClassifier(random_state=42)
        grid_search = GridSearchCV(
            rf, simplified_param_grid, 
            cv=3, scoring='accuracy', 
            n_jobs=-1, verbose=1
        )
        
        grid_search.fit(X_train, y_train)
        
        print(f"최적 파라미터: {grid_search.best_params_}")
        print(f"최적 교차검증 점수: {grid_search.best_score_:.4f}")
        
        return grid_search.best_estimator_
    
    def train(self, csv_file: str, use_tuning: bool = True):
        """모델 훈련"""
        print("데이터 로딩 중...")
        X, y = self.load_and_prepare_data(csv_file)
        
        print(f"데이터 형태: {X.shape}")
        print(f"클래스 수: {len(y.unique())}")
        
        # 훈련/테스트 분할
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # 특성 스케일링
        print("특성 스케일링 중...")
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # 모델 선택 및 훈련
        if use_tuning:
            self.model = self.hyperparameter_tuning(X_train_scaled, y_train)
        else:
            # 기본 파라미터로 빠른 훈련
            self.model = RandomForestClassifier(
                n_estimators=200,
                max_depth=20,
                min_samples_split=2,
                min_samples_leaf=1,
                random_state=42,
                n_jobs=-1
            )
            print("기본 파라미터로 모델 훈련 중...")
            self.model.fit(X_train_scaled, y_train)
        
        # 예측 및 평가
        y_pred = self.model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"\n=== 모델 성능 평가 ===")
        print(f"정확도: {accuracy:.4f}")
        print(f"훈련 데이터 수: {len(X_train)}")
        print(f"테스트 데이터 수: {len(X_test)}")
        
        # 교차 검증
        cv_scores = cross_val_score(self.model, X_train_scaled, y_train, cv=5)
        print(f"5-Fold 교차검증 평균 점수: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
        
        # 특성 중요도 출력
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\n=== 상위 15개 중요 특성 ===")
        for i, (_, row) in enumerate(feature_importance.head(15).iterrows()):
            print(f"{i+1:2d}. {row['feature']:<25} : {row['importance']:.4f}")
        
        return accuracy
    
    def predict_next_move(self, game_state: dict) -> tuple:
        """게임 상태에서 다음 수 예측"""
        # 게임 상태에서 특성 추출
        from data_generator_v2 import extract_features_v2
        features = extract_features_v2(game_state)
        
        # 모든 특성 컬럼을 0으로 초기화
        feature_vector = pd.DataFrame([{col: 0 for col in self.feature_columns}])
        
        # 실제 특성 값으로 업데이트
        for key, value in features.items():
            if key in self.feature_columns:
                feature_vector[key] = value
        
        # 예측
        feature_vector_scaled = self.scaler.transform(feature_vector)
        prediction = self.model.predict(feature_vector_scaled)[0]
        probabilities = self.model.predict_proba(feature_vector_scaled)[0]
        confidence = probabilities.max()
        
        # 라벨을 행, 열로 변환
        row = prediction // 10
        col = prediction % 10
        
        return (row, col), confidence
    
    def save_model(self, filename: str):
        """모델 저장"""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'version': self.model_version
        }
        joblib.dump(model_data, filename)
        print(f"모델 v2가 {filename}에 저장되었습니다.")
    
    def load_model(self, filename: str):
        """모델 로드"""
        model_data = joblib.load(filename)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_columns = model_data['feature_columns']
        self.model_version = model_data.get('version', 'v2')
        print(f"모델 {self.model_version}가 {filename}에서 로드되었습니다.")

def test_model_performance_v2(model_file: str, num_games: int = 100):
    """새로운 모델 성능 테스트"""
    print(f"모델 성능 테스트 시작 ({num_games}게임)...")
    
    # 모델 로드
    model = GameMLModelV2()
    model.load_model(model_file)
    
    results = {
        'total_games': num_games,
        'successful_games': 0,
        'total_score': 0,
        'goal_achievements': {
            'row_0': 0,
            'row_1': 0,
            'row_2': 0,
            'all_goals': 0
        }
    }
    
    for game_idx in range(num_games):
        game = GameEnvironment()
        
        while not game.game_over:
            state = game.get_state()
            available_positions = state['available_positions']
            
            if available_positions:
                # AI 예측
                predicted_pos, confidence = model.predict_next_move(state)
                
                # 예측된 위치가 사용 가능한지 확인
                if predicted_pos in available_positions:
                    chosen_pos = predicted_pos
                else:
                    # 사용 불가능하면 첫 번째 사용 가능한 위치 선택
                    chosen_pos = available_positions[0]
                
                game.click_position(chosen_pos[0], chosen_pos[1])
        
        # 게임 결과 분석
        results['total_score'] += game.score
        achievements = game.check_goals_achieved()
        
        for key in ['row_0', 'row_1', 'row_2', 'all_goals']:
            if achievements[key]:
                results['goal_achievements'][key] += 1
        
        if achievements['all_goals']:
            results['successful_games'] += 1
        
        # 진행상황 출력 (10게임마다)
        if (game_idx + 1) % 10 == 0:
            current_success_rate = results['successful_games'] / (game_idx + 1) * 100
            print(f"진행: {game_idx + 1}/{num_games}, 목표 달성률: {current_success_rate:.1f}%")
    
    # 최종 결과 출력
    avg_score = results['total_score'] / num_games
    success_rate = results['successful_games'] / num_games * 100
    
    print(f"\n=== 모델 성능 테스트 결과 ===")
    print(f"평균 점수: {avg_score:.2f}")
    print(f"전체 목표 달성률: {success_rate:.1f}% ({results['successful_games']}/{num_games})")
    print(f"개별 목표 달성률:")
    for key in ['row_0', 'row_1', 'row_2']:
        rate = results['goal_achievements'][key] / num_games * 100
        print(f"  {key}: {rate:.1f}%")
    
    return results

def compare_models(old_model_file: str, new_model_file: str, num_games: int = 50):
    """기존 모델과 새 모델 성능 비교"""
    print("=== 모델 성능 비교 ===")
    
    print("\n1. 기존 모델 테스트:")
    try:
        from ml_model import GameMLModel
        old_model = GameMLModel()
        old_model.load_model(old_model_file)
        
        old_results = {'successful_games': 0, 'total_score': 0}
        for _ in range(num_games):
            game = GameEnvironment()
            while not game.game_over:
                state = game.get_state()
                if state['available_positions']:
                    try:
                        predicted_pos, _ = old_model.predict_next_move(state)
                        if predicted_pos in state['available_positions']:
                            chosen_pos = predicted_pos
                        else:
                            chosen_pos = state['available_positions'][0]
                        game.click_position(chosen_pos[0], chosen_pos[1])
                    except:
                        # 기존 모델이 새 특성을 처리할 수 없는 경우
                        chosen_pos = state['available_positions'][0]
                        game.click_position(chosen_pos[0], chosen_pos[1])
            
            old_results['total_score'] += game.score
            achievements = game.check_goals_achieved()
            if achievements['all_goals']:
                old_results['successful_games'] += 1
        
        old_success_rate = old_results['successful_games'] / num_games * 100
        old_avg_score = old_results['total_score'] / num_games
        print(f"기존 모델 - 목표 달성률: {old_success_rate:.1f}%, 평균 점수: {old_avg_score:.2f}")
        
    except Exception as e:
        print(f"기존 모델 테스트 실패: {e}")
        old_success_rate = 0
        old_avg_score = 0
    
    print("\n2. 새 모델 테스트:")
    new_results = test_model_performance_v2(new_model_file, num_games)
    new_success_rate = new_results['successful_games'] / num_games * 100
    new_avg_score = new_results['total_score'] / num_games
    
    print(f"\n=== 비교 결과 ===")
    print(f"목표 달성률: {old_success_rate:.1f}% → {new_success_rate:.1f}% ({new_success_rate-old_success_rate:+.1f}%)")
    print(f"평균 점수: {old_avg_score:.2f} → {new_avg_score:.2f} ({new_avg_score-old_avg_score:+.2f})")

if __name__ == "__main__":
    # 새 데이터 생성
    print("1단계: 새로운 훈련 데이터 생성")
    from data_generator_v2 import generate_training_data_v2
    df = generate_training_data_v2(3000)
    df.to_csv('training_data_v2.csv', index=False)
    
    # 모델 훈련
    print("\n2단계: 모델 v2 훈련")
    model = GameMLModelV2()
    accuracy = model.train('training_data_v2.csv', use_tuning=False)  # 빠른 훈련
    
    # 모델 저장
    model.save_model('game_model_v2.pkl')
    
    # 성능 테스트
    print("\n3단계: 성능 테스트")
    test_model_performance_v2('game_model_v2.pkl', 100)
    
    # 기존 모델과 비교 (기존 모델이 있는 경우)
    print("\n4단계: 모델 비교")
    try:
        compare_models('game_model.pkl', 'game_model_v2.pkl', 50)
    except:
        print("기존 모델을 찾을 수 없어 비교를 건너뜁니다.")