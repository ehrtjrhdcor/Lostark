#!/usr/bin/env python3
"""
게임 AI 학습을 위한 대용량 데이터셋 생성 스크립트

이 스크립트는 다음을 수행합니다:
1. 최적 전략 알고리즘을 사용한 게임 플레이 데이터 생성
2. 랜덤/혼합 전략 비교 데이터 생성  
3. ML 모델 학습에 최적화된 CSV 형태로 저장
4. 데이터 품질 검증 및 통계 리포트 생성

실행 방법:
python generate_training_data.py
"""

import pandas as pd
import numpy as np
from data_generator_v6 import DataGenerator
import argparse
import os
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(description='게임 AI 학습 데이터 생성')
    parser.add_argument('--optimal', type=int, default=2000, help='최적 전략 게임 수')
    parser.add_argument('--random', type=int, default=1000, help='랜덤 전략 게임 수')
    parser.add_argument('--mixed', type=int, default=1000, help='혼합 전략 게임 수')
    parser.add_argument('--output', type=str, default='training_data_v6.csv', help='출력 파일명')
    parser.add_argument('--test', action='store_true', help='소규모 테스트 모드')
    
    args = parser.parse_args()
    
    # 테스트 모드인 경우 게임 수 축소
    if args.test:
        args.optimal = 20
        args.random = 10  
        args.mixed = 10
        args.output = 'test_training_data.csv'
        print("=== 테스트 모드로 실행 ===")
    
    print(f"""
=== 게임 AI 학습 데이터 생성 시작 ===
생성할 게임 수:
- 최적 전략: {args.optimal}개
- 랜덤 전략: {args.random}개  
- 혼합 전략: {args.mixed}개
총 게임 수: {args.optimal + args.random + args.mixed}개

출력 파일: {args.output}
시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    """)
    
    try:
        # 데이터 생성기 초기화
        generator = DataGenerator()
        
        # 데이터셋 생성
        df = generator.generate_dataset(
            num_optimal_games=args.optimal,
            num_random_games=args.random,
            num_mixed_games=args.mixed,
            output_file=args.output
        )
        
        # 추가 분석 및 리포트
        generate_analysis_report(df, args.output)
        
        print(f"\n=== 완료 ===")
        print(f"완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"생성된 파일: {args.output}")
        print(f"리포트 파일: {args.output.replace('.csv', '_report.txt')}")
        
    except Exception as e:
        print(f"오류 발생: {e}")
        return 1
    
    return 0

def generate_analysis_report(df: pd.DataFrame, output_file: str) -> None:
    """데이터 분석 리포트 생성"""
    report_file = output_file.replace('.csv', '_report.txt')
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=== 게임 AI 학습 데이터 분석 리포트 ===\n")
        f.write(f"생성 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        # 기본 통계
        f.write("1. 기본 통계\n")
        f.write(f"  총 레코드 수: {len(df):,}개\n")
        f.write(f"  총 게임 수: {df['game_id'].nunique():,}개\n")
        f.write(f"  평균 게임 길이: {len(df) / df['game_id'].nunique():.1f} 스텝\n\n")
        
        # 전략별 통계
        f.write("2. 전략별 통계\n")
        strategy_stats = df.groupby('strategy_type').agg({
            'game_won': ['count', 'mean'],
            'final_score': 'mean',
            'step': 'max'
        }).round(3)
        f.write(str(strategy_stats))
        f.write("\n\n")
        
        # 승리 조건별 통계
        f.write("3. 승리 조건별 달성률\n")
        for i in range(4):
            condition_rate = df[df['game_won'] == 1][f'won_condition_{i}'].mean()
            f.write(f"  조건 {i+1}: {condition_rate:.3f}\n")
        f.write("\n")
        
        # 행별 성과 분석
        f.write("4. 행별 성과 분석\n")
        for i in range(3):
            avg_success = df[f'row_{i}_success'].mean()
            f.write(f"  행 {i+1} 평균 성공수: {avg_success:.2f}\n")
        f.write("\n")
        
        # 특징 중요도 (상관관계 기반)
        f.write("5. 승리와 상관관계가 높은 특징들\n")
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        correlations = df[numeric_cols].corr()['game_won'].abs().sort_values(ascending=False)
        
        for col, corr in correlations.head(10).items():
            if col != 'game_won':
                f.write(f"  {col}: {corr:.3f}\n")
        f.write("\n")
        
        # 데이터 품질 체크
        f.write("6. 데이터 품질\n")
        f.write(f"  결측치 수: {df.isnull().sum().sum()}\n")
        f.write(f"  중복 레코드 수: {df.duplicated().sum()}\n")
        
        # action_label 분포
        f.write("\n7. 행동 라벨 분포 (상위 10개)\n")
        action_dist = df['action_label'].value_counts().head(10)
        for action, count in action_dist.items():
            row = action // 10
            col = action % 10
            f.write(f"  행{row+1}-열{col+1} (라벨{action}): {count}회\n")

if __name__ == "__main__":
    exit(main())