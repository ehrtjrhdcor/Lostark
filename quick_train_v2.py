import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler
import joblib
import time

def quick_train_model():
    """빠른 모델 훈련"""
    print("빠른 모델 훈련 시작...")
    
    # 데이터 로드
    df = pd.read_csv('training_data_v2.csv')
    df = df.fillna(0)
    
    print(f"데이터 크기: {df.shape}")
    
    # 데이터 샘플링 (속도 향상)
    if len(df) > 50000:
        df = df.sample(n=50000, random_state=42)
        print(f"샘플링 후 크기: {df.shape}")
    
    # 특성과 라벨 분리
    X = df.drop('label', axis=1)
    y = df['label']
    
    # 훈련/테스트 분할
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # 특성 스케일링
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 빠른 모델 훈련
    print("RandomForest 모델 훈련 중...")
    start_time = time.time()
    
    model = RandomForestClassifier(
        n_estimators=100,  # 트리 개수 줄임
        max_depth=15,      # 깊이 제한
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train_scaled, y_train)
    train_time = time.time() - start_time
    
    # 예측 및 평가
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n=== 훈련 완료 ===")
    print(f"훈련 시간: {train_time:.1f}초")
    print(f"정확도: {accuracy:.4f}")
    print(f"훈련 데이터: {len(X_train)}")
    print(f"테스트 데이터: {len(X_test)}")
    
    # 모델 저장
    model_data = {
        'model': model,
        'scaler': scaler,
        'feature_columns': X.columns.tolist(),
        'version': 'v2_quick'
    }
    
    joblib.dump(model_data, 'game_model_v2.pkl')
    print("모델이 'game_model_v2.pkl'에 저장되었습니다.")
    
    # 특성 중요도 상위 10개
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n=== 상위 10개 중요 특성 ===")
    for i, (_, row) in enumerate(feature_importance.head(10).iterrows()):
        print(f"{i+1:2d}. {row['feature']:<25} : {row['importance']:.4f}")
    
    return model, scaler, X.columns.tolist()

if __name__ == "__main__":
    model, scaler, feature_columns = quick_train_model()