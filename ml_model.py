import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
import joblib
from game_simulation import GameEnvironment

class GameMLModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.feature_columns = None
        
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
    
    def train(self, csv_file: str):
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
        
        # 모델 훈련
        print("모델 훈련 중...")
        self.model.fit(X_train_scaled, y_train)
        
        # 예측 및 평가
        y_pred = self.model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"\n모델 정확도: {accuracy:.4f}")
        print(f"훈련 데이터 수: {len(X_train)}")
        print(f"테스트 데이터 수: {len(X_test)}")
        
        # 특성 중요도 출력
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\n상위 10개 중요 특성:")
        print(feature_importance.head(10))
        
        return accuracy
    
    def predict_next_move(self, game_state: dict) -> tuple:
        """게임 상태에서 다음 수 예측"""
        # 게임 상태에서 특성 추출
        from data_generator import extract_features
        features = extract_features(game_state)
        
        # 모든 특성 컬럼을 0으로 초기화
        feature_vector = pd.DataFrame([{col: 0 for col in self.feature_columns}])
        
        # 실제 특성 값으로 업데이트
        for key, value in features.items():
            if key in self.feature_columns:
                feature_vector[key] = value
        
        # 예측
        feature_vector_scaled = self.scaler.transform(feature_vector)
        prediction = self.model.predict(feature_vector_scaled)[0]
        confidence = self.model.predict_proba(feature_vector_scaled)[0].max()
        
        # 라벨을 행, 열로 변환
        row = prediction // 10
        col = prediction % 10
        
        return (row, col), confidence
    
    def save_model(self, filename: str):
        """모델 저장"""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns
        }
        joblib.dump(model_data, filename)
        print(f"모델이 {filename}에 저장되었습니다.")
    
    def load_model(self, filename: str):
        """모델 로드"""
        model_data = joblib.load(filename)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_columns = model_data['feature_columns']
        print(f"모델이 {filename}에서 로드되었습니다.")

def test_model_performance():
    """모델 성능 테스트"""
    print("모델 성능 테스트 시작...")
    
    # 모델 로드
    model = GameMLModel()
    model.load_model('game_model.pkl')
    
    # 여러 게임에서 테스트
    total_score = 0
    num_games = 100
    
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
                    # 사용 불가능하면 랜덤 선택
                    chosen_pos = np.random.choice(len(available_positions))
                    chosen_pos = available_positions[chosen_pos]
                
                game.click_position(chosen_pos[0], chosen_pos[1])
        
        total_score += game.score
    
    avg_score = total_score / num_games
    print(f"평균 점수: {avg_score:.2f} ({num_games}게임)")

if __name__ == "__main__":
    # 모델 훈련
    model = GameMLModel()
    accuracy = model.train('training_data.csv')
    
    # 모델 저장
    model.save_model('game_model.pkl')
    
    # 성능 테스트
    test_model_performance()