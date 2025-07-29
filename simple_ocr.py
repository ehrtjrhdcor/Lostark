#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
로스트아크 OCR 분석 스크립트 (간단 버전)

Vercel 서버리스 환경에서 복잡한 OCR 라이브러리 실행의 제약으로 인해
샘플 데이터를 반환하는 간단한 버전입니다.

주요 기능:
- 이미지 파일 읽기 및 기본 정보 추출
- 로스트아크 통계 샘플 데이터 생성
- HTML 테이블 형태로 결과 포맷팅
- JSON 형태로 결과 출력

사용법:
    python simple_ocr.py <이미지_경로>
"""

import sys
import json
import cv2
import numpy as np
from PIL import Image
import re
import os

# Windows 환경에서 UTF-8 인코딩 강제 설정
# 한글 출력 시 CP949 에러 방지
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

def simple_image_analysis(image_path):
    """
    이미지 파일 분석 함수 (샘플 데이터 버전)
    
    Args:
        image_path (str): 분석할 이미지 파일의 경로
        
    Returns:
        dict: 분석 결과 딕셔너리
            - success (bool): 분석 성공 여부
            - image_info (dict): 이미지 기본 정보 (크기, 경로)
            - parsed_stats (dict): 로스트아크 통계 샘플 데이터
            - message (str): 성공 메시지
            
    Note:
        실제 OCR 대신 샘플 데이터를 반환합니다.
        추후 실제 OCR 라이브러리 연동 시 이 함수를 수정하면 됩니다.
    """
    try:
        # OpenCV를 사용하여 이미지 파일 읽기
        image = cv2.imread(image_path)
        
        # 이미지 크기 정보 추출
        height, width = image.shape[:2]
        
        # 로스트아크 통계 샘플 데이터
        # TODO: 실제 OCR 결과로 대체 필요
        sample_data = {
            '전투 시간': '14:12',        # 레이드 진행 시간
            '피해량': '3,214.35억',      # 총 딜량
            '초당 피해량': '3.77억',     # DPS (Damage Per Second)
            '1분 피해량': '593.24억',    # 1분당 평균 딜량
            '치명타 적중률': '86.36%',   # 치명타 확률
            '백어택 적중률': '62.56%',   # 백어택 성공률
            '무력화': '4,240',          # 무력화 기여도
            '카운터 성공': '17'         # 카운터 성공 횟수
        }
        
        # 성공 결과 반환
        return {
            'success': True,
            'image_info': {
                'width': int(width),    # 이미지 너비
                'height': int(height),  # 이미지 높이
                'path': image_path      # 파일 경로
            },
            'parsed_stats': sample_data,
            'message': '이미지가 성공적으로 분석되었습니다.'
        }
        
    except Exception as e:
        # 이미지 읽기 실패 또는 기타 오류 처리
        return {
            'success': False,
            'error': f'이미지 분석 중 오류 발생: {str(e)}',
            'image_path': image_path
        }

def format_as_table_html(data):
    """
    분석 결과를 HTML 테이블 형태로 포맷팅하는 함수
    
    Args:
        data (dict): simple_image_analysis 함수의 반환값
        
    Returns:
        str: CSS 스타일이 포함된 HTML 문자열
        
    Note:
        프론트엔드에서 innerHTML로 직접 삽입할 수 있는 형태로 생성
    """
    # 에러 발생 시 에러 메시지 HTML 반환
    if not data.get('success'):
        return f'<div class="error">오류: {data.get("error", "알 수 없는 오류")}</div>'
    
    # 통계 데이터 추출
    stats = data.get('parsed_stats', {})
    
    # HTML 구조 시작
    html = ['<div class="ocr-results">']
    html.append('<h3 style="color: #2c3e50; margin-bottom: 20px;">로스트아크 통계 분석 결과</h3>')
    
    # 주요 정보 테이블 생성
    html.append('<h4 style="color: #3498db;">주요 정보</h4>')
    html.append('<table class="stats-table">')
    html.append('<thead><tr><th>항목</th><th>값</th></tr></thead>')
    html.append('<tbody>')
    
    # 주요 통계 항목들 (레이드 성과 관련)
    main_stats = ['전투 시간', '피해량', '초당 피해량', '1분 피해량']
    for key in main_stats:
        value = stats.get(key, '미인식')  # 값이 없으면 '미인식' 표시
        html.append(f'<tr><td>{key}</td><td class="stat-value">{value}</td></tr>')
    
    html.append('</tbody></table>')
    
    # 추가 정보 테이블 생성
    html.append('<h4 style="color: #27ae60; margin-top: 20px;">추가 정보</h4>')
    html.append('<table class="stats-table">')
    html.append('<thead><tr><th>항목</th><th>값</th></tr></thead>')
    html.append('<tbody>')
    
    # 추가 통계 항목들 (플레이 스킬 관련)
    additional_stats = ['치명타 적중률', '백어택 적중률', '무력화', '카운터 성공']
    for key in additional_stats:
        if key in stats:  # 값이 있는 항목만 표시
            value = stats[key]
            html.append(f'<tr><td>{key}</td><td class="stat-value">{value}</td></tr>')
    
    html.append('</tbody></table>')
    
    # 이미지 기본 정보 표시
    img_info = data.get('image_info', {})
    html.append('<div class="image-info" style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">')
    html.append(f'<small>이미지 크기: {img_info.get("width", 0)} x {img_info.get("height", 0)}</small>')
    html.append('</div>')
    
    html.append('</div>')
    
    # CSS 스타일
    style = '''
    <style>
    .ocr-results { font-family: Arial, sans-serif; }
    .stats-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-bottom: 15px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .stats-table th { 
        background: #3498db; 
        color: white; 
        padding: 12px; 
        text-align: left;
        border: 1px solid #ddd;
    }
    .stats-table td { 
        padding: 10px; 
        border: 1px solid #ddd;
        background: white;
    }
    .stats-table tr:nth-child(even) td { background: #f8f9fa; }
    .stats-table tr:hover td { background: #e3f2fd; }
    .stat-value { color: #e74c3c; font-weight: bold; }
    .error { color: #e74c3c; padding: 20px; text-align: center; }
    </style>
    '''
    
    return style + '\n'.join(html)

def main():
    """
    메인 실행 함수
    
    명령행 인수를 처리하고 이미지 분석을 수행한 후
    JSON 형태로 결과를 출력합니다.
    
    사용법:
        python simple_ocr.py <이미지_경로>
        
    출력:
        JSON 형태의 분석 결과 (stdout으로 출력)
        
    Exit Codes:
        0: 정상 실행
        1: 잘못된 명령행 인수
    """
    # 명령행 인수 검증
    if len(sys.argv) != 2:
        error_response = {
            "success": False, 
            "error": "사용법: python simple_ocr.py <이미지_경로>"
        }
        print(json.dumps(error_response))
        sys.exit(1)
    
    # 이미지 파일 경로 추출
    image_path = sys.argv[1]
    
    # 1단계: 이미지 분석 실행
    result = simple_image_analysis(image_path)
    
    # 2단계: HTML 테이블 생성하여 결과에 추가
    result['table_html'] = format_as_table_html(result)
    
    # 3단계: JSON 형태로 결과 출력
    # ensure_ascii=False: 한글 문자 그대로 출력
    # indent=2: 가독성을 위한 들여쓰기
    print(json.dumps(result, ensure_ascii=False, indent=2))

# 스크립트가 직접 실행될 때만 main 함수 호출
# 모듈로 import될 때는 실행되지 않음
if __name__ == "__main__":
    main()