#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json
from paddleocr import PaddleOCR
import cv2
import numpy as np
from PIL import Image
import re

def preprocess_image(image_path):
    """이미지 전처리 - 게임 UI 텍스트 인식률 향상 (피해량 특화)"""
    # 이미지 읽기
    image = cv2.imread(image_path)
    
    # 그레이스케일 변환
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 1. 대비 강화 (더 강하게)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    
    # 2. 감마 보정 (밝은 텍스트 강조)
    gamma = 1.5
    invGamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** invGamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
    gamma_corrected = cv2.LUT(enhanced, table)
    
    # 3. 샤프닝 (텍스트 경계 명확화)
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(gamma_corrected, -1, kernel)
    
    # 4. 모폴로지 연산 (텍스트 연결성 향상)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 1))
    morphed = cv2.morphologyEx(sharpened, cv2.MORPH_CLOSE, kernel)
    
    # 5. 노이즈 제거 (약하게)
    denoised = cv2.bilateralFilter(morphed, 5, 50, 50)
    
    # 6. 이진화 (임계값 적응적)
    binary = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    
    return binary

def parse_lostark_data(ocr_results):
    """로스트아크 길드 정보 파싱 - 개선된 버전"""
    all_text = []
    high_confidence_text = []
    
    for (bbox, text, confidence) in ocr_results:
        if confidence > 0.3:  # 신뢰도 30% 이상
            all_text.append(text)
            if confidence > 0.7:  # 높은 신뢰도 텍스트 별도 저장
                high_confidence_text.append(text)
    
    # 전체 텍스트 결합
    full_text = ' '.join(all_text)
    
    # 로스트아크 길드 통계 패턴 (이미지 기반)
    stat_patterns = {
        # 주요 정보
        '전투 시간': [
            r'전투.*?시간[^\d]*(\d+:\d+)',
            r'(\d+:\d+).*전투',
            r'(\d+분\s*\d+초)',
            r'(\d{1,2}:\d{2})'
        ],
        '피해량': [
            r'피해량[^\d]*(\d+[,.]?\d*\.?\d*억)',
            r'(\d+[,.]?\d*\.?\d*억).*?\n.*피해량',
            r'(\d{1,3},\d{3},\d{3},\d{3})',  # 큰 숫자
            r'(\d+\.?\d*억)'
        ],
        '초당 피해량': [
            r'초당.*?피해량[^\d]*(\d+[,.]?\d*\.?\d*억)',
            r'초당.*?(\d+[,.]?\d*\.?\d*억)',
            r'(\d+\.?\d*억).*초당',
            r'초당.*?(\d{1,3},\d{3},\d{3})'
        ],
        '1분 피해량': [
            r'1분.*?피해량[^\d]*(\d+[,.]?\d*\.?\d*억)',
            r'1분.*?(\d+[,.]?\d*\.?\d*억)',
            r'(\d+\.?\d*억).*1분'
        ],
        # 추가 정보
        '치명타 적중률': [
            r'치명타.*?적중률[^\d]*(\d+\.?\d*%)',
            r'치명타.*?(\d+\.?\d*%)',
            r'(\d+\.?\d*%).*치명타'
        ],
        '백어택 적중률': [
            r'백어택.*?적중률[^\d]*(\d+\.?\d*%)',
            r'백어택.*?(\d+\.?\d*%)',
            r'(\d+\.?\d*%).*백어택'
        ],
        '헤드어택 적중률': [
            r'헤드어택.*?적중률[^\d]*(\d+\.?\d*%)',
            r'헤드어택.*?(\d+\.?\d*%)',
            r'(\d+\.?\d*%).*헤드어택'
        ],
        '받은 피해량': [
            r'받은.*?피해량[^\d]*(\d+[,.]?\d*\.?\d*만)',
            r'받은.*?(\d+[,.]?\d*\.?\d*만)',
            r'(\d+\.?\d*만).*받은'
        ],
        '무력화': [
            r'무력화[^\d]*(\d+[,.]?\d*)',
            r'(\d+[,.]?\d*).*무력화',
            r'(\d+,\d{3})'
        ],
        '카운터 성공': [
            r'카운터.*?성공[^\d]*(\d+)',
            r'카운터.*?(\d+)',
            r'(\d+).*카운터'
        ],
        '저스트 가드 성공 횟수': [
            r'저스트.*?가드.*?성공.*?횟수[^\d]*(\d+)',
            r'저스트.*?가드[^\d]*(\d+)',
            r'(\d+).*저스트'
        ],
        '배틀 아이템 사용 횟수': [
            r'배틀.*?아이템.*?사용.*?횟수[^\d]*(\d+)',
            r'아이템.*?사용[^\d]*(\d+)',
            r'(\d+).*아이템'
        ],
        '지당타 자상 감소 가동률': [
            r'지당타.*?자상.*?감소.*?가동률[^\d]*(\d+\.?\d*%)',
            r'지당타.*?(\d+\.?\d*%)',
            r'(\d+\.?\d*%).*지당타'
        ],
        '구슬의 축복 유효율': [
            r'구슬.*?축복.*?유효율[^\d]*(\d+\.?\d*%)',
            r'구슬.*?축복.*?(\d+\.?\d*%)',
            r'(\d+\.?\d*%).*구슬'
        ]
    }
    
    parsed_data = {
        'raw_text': all_text,
        'full_text': full_text,
        'high_confidence_text': high_confidence_text,
        'parsed_stats': {}
    }
    
    # 향상된 패턴 매칭으로 데이터 추출
    for key, patterns in stat_patterns.items():
        for pattern in patterns:
            match = re.search(pattern, full_text, re.IGNORECASE)
            if match:
                parsed_data['parsed_stats'][key] = match.group(1)
                break  # 첫 번째 매치를 찾으면 다음 패턴으로
    
    # 숫자만 있는 큰 값들도 추출 (길드 통계에서 자주 보이는 패턴)
    large_numbers = re.findall(r'(\d{1,3}(?:,\d{3})*(?:\.\d+)?억?)', full_text)
    if large_numbers:
        parsed_data['large_numbers'] = large_numbers[:10]  # 상위 10개만
    
    return parsed_data

def format_as_table(parsed_data):
    """분석 결과를 표 형태로 포맷팅"""
    stats = parsed_data.get('parsed_stats', {})
    
    # 주요 정보와 추가 정보 분리
    main_info = {
        '전투 시간': stats.get('전투 시간', '미인식'),
        '피해량': stats.get('피해량', '미인식'),
        '초당 피해량': stats.get('초당 피해량', '미인식'),
        '1분 피해량': stats.get('1분 피해량', '미인식')
    }
    
    additional_info = {
        '치명타 적중률': stats.get('치명타 적중률', '미인식'),
        '백어택 적중률': stats.get('백어택 적중률', '미인식'), 
        '헤드어택 적중률': stats.get('헤드어택 적중률', '미인식'),
        '받은 피해량': stats.get('받은 피해량', '미인식'),
        '무력화': stats.get('무력화', '미인식'),
        '카운터 성공': stats.get('카운터 성공', '미인식'),
        '저스트 가드 성공 횟수': stats.get('저스트 가드 성공 횟수', '미인식'),
        '배틀 아이템 사용 횟수': stats.get('배틀 아이템 사용 횟수', '미인식'),
    }
    
    # 표 생성
    table_output = []
    table_output.append("=" * 60)
    table_output.append("🏹 로스트아크 길드 통계 분석 결과")
    table_output.append("=" * 60)
    
    # 주요 정보 표
    table_output.append("\n📊 주요 정보")
    table_output.append("-" * 40)
    for key, value in main_info.items():
        table_output.append(f"{key:<15} : {value}")
    
    # 추가 정보 표
    table_output.append("\n📈 추가 정보")
    table_output.append("-" * 40)
    for key, value in additional_info.items():
        if value != '미인식':  # 인식된 것만 표시
            table_output.append(f"{key:<20} : {value}")
    
    # 원본 텍스트 (디버깅용)
    if parsed_data.get('high_confidence_text'):
        table_output.append("\n🔍 고신뢰도 인식 텍스트")
        table_output.append("-" * 40)
        for text in parsed_data['high_confidence_text'][:10]:  # 상위 10개만
            table_output.append(f"• {text}")
    
    table_output.append("=" * 60)
    
    return "\n".join(table_output)

def format_as_table_html(parsed_data):
    """분석 결과를 HTML 표 형태로 포맷팅"""
    stats = parsed_data.get('parsed_stats', {})
    
    # 주요 정보와 추가 정보 분리
    main_info = {
        '전투 시간': stats.get('전투 시간', '미인식'),
        '피해량': stats.get('피해량', '미인식'),
        '초당 피해량': stats.get('초당 피해량', '미인식'),
        '1분 피해량': stats.get('1분 피해량', '미인식')
    }
    
    additional_info = {
        '치명타 적중률': stats.get('치명타 적중률', '미인식'),
        '백어택 적중률': stats.get('백어택 적중률', '미인식'), 
        '헤드어택 적중률': stats.get('헤드어택 적중률', '미인식'),
        '받은 피해량': stats.get('받은 피해량', '미인식'),
        '무력화': stats.get('무력화', '미인식'),
        '카운터 성공': stats.get('카운터 성공', '미인식'),
        '저스트 가드 성공 횟수': stats.get('저스트 가드 성공 횟수', '미인식'),
        '배틀 아이템 사용 횟수': stats.get('배틀 아이템 사용 횟수', '미인식'),
        '지당타 자상 감소 가동률': stats.get('지당타 자상 감소 가동률', '미인식'),
        '구슬의 축복 유효율': stats.get('구슬의 축복 유효율', '미인식')
    }
    
    # HTML 테이블 생성
    html_output = []
    html_output.append('<div class="lostark-stats-table">')
    html_output.append('<h3 style="color: #2c3e50; margin-bottom: 20px;">🏹 로스트아크 길드 통계 분석 결과</h3>')
    
    # 주요 정보 테이블
    html_output.append('<div class="main-stats">')
    html_output.append('<h4 style="color: #3498db; margin-bottom: 15px;">📊 주요 정보</h4>')
    html_output.append('<table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">')
    html_output.append('<thead><tr style="background-color: #3498db; color: white;"><th style="padding: 12px; text-align: left; border: 1px solid #ddd;">항목</th><th style="padding: 12px; text-align: left; border: 1px solid #ddd;">값</th></tr></thead>')
    html_output.append('<tbody>')
    
    for key, value in main_info.items():
        status_class = 'recognized' if value != '미인식' else 'not-recognized'
        html_output.append(f'<tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">{key}</td><td style="padding: 10px; border: 1px solid #ddd;" class="{status_class}">{value}</td></tr>')
    
    html_output.append('</tbody></table>')
    html_output.append('</div>')
    
    # 추가 정보 테이블 (인식된 것만)
    recognized_additional = {k: v for k, v in additional_info.items() if v != '미인식'}
    if recognized_additional:
        html_output.append('<div class="additional-stats">')
        html_output.append('<h4 style="color: #27ae60; margin-bottom: 15px;">📈 추가 정보</h4>')
        html_output.append('<table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">')
        html_output.append('<thead><tr style="background-color: #27ae60; color: white;"><th style="padding: 12px; text-align: left; border: 1px solid #ddd;">항목</th><th style="padding: 12px; text-align: left; border: 1px solid #ddd;">값</th></tr></thead>')
        html_output.append('<tbody>')
        
        for key, value in recognized_additional.items():
            html_output.append(f'<tr><td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">{key}</td><td style="padding: 10px; border: 1px solid #ddd;" class="recognized">{value}</td></tr>')
        
        html_output.append('</tbody></table>')
        html_output.append('</div>')
    
    # 고신뢰도 텍스트 (디버깅용)
    if parsed_data.get('high_confidence_text'):
        html_output.append('<div class="debug-info" style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #17a2b8;">')
        html_output.append('<h5 style="color: #17a2b8; margin-bottom: 10px;">🔍 고신뢰도 인식 텍스트</h5>')
        html_output.append('<ul style="margin: 0; padding-left: 20px;">')
        for text in parsed_data['high_confidence_text'][:10]:
            html_output.append(f'<li style="margin: 5px 0; color: #495057;">{text}</li>')
        html_output.append('</ul>')
        html_output.append('</div>')
    
    html_output.append('</div>')
    
    # CSS 스타일 추가
    style = """
    <style>
    .lostark-stats-table .recognized { color: #27ae60; font-weight: bold; }
    .lostark-stats-table .not-recognized { color: #e74c3c; font-style: italic; }
    .lostark-stats-table table { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .lostark-stats-table th { font-weight: bold; }
    .lostark-stats-table tr:nth-child(even) { background-color: #f8f9fa; }
    .lostark-stats-table tr:hover { background-color: #e3f2fd; }
    </style>
    """
    
    return style + "\n".join(html_output)

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "사용법: python ocr_script.py <이미지_경로>"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    try:
        # PaddleOCR 리더 초기화 (한글, 영어)
        reader = PaddleOCR(use_textline_orientation=True, lang='korean')
        
        # 이미지 전처리
        processed_image = preprocess_image(image_path)
        
        # OCR 수행 (최신 PaddleOCR v3.x)
        results = reader.predict(processed_image)
        
        # PaddleOCR v3.x 결과를 EasyOCR 형식으로 변환
        converted_results = []
        
        try:
            if results and len(results) > 0:
                result = results[0]  # 첫 번째 결과
                
                # 디버깅: 결과 구조 출력
                print(f"DEBUG: PaddleOCR 결과 키들: {result.keys()}", file=sys.stderr)
                
                # 텍스트와 신뢰도 추출
                if 'rec_texts' in result and 'rec_scores' in result:
                    texts = result['rec_texts']
                    scores = result['rec_scores']
                    polys = result.get('rec_polys', [])
                    
                    print(f"DEBUG: 텍스트 수: {len(texts)}, 점수 수: {len(scores)}, 폴리곤 수: {len(polys)}", file=sys.stderr)
                    
                    # 안전한 zip 처리
                    for i in range(min(len(texts), len(scores))):
                        text = texts[i] if i < len(texts) else ""
                        score = scores[i] if i < len(scores) else 0.0
                        
                        # 폴리곤이 있으면 사용, 없으면 기본값
                        if i < len(polys) and polys[i] is not None:
                            poly = polys[i]
                            bbox = poly.tolist() if hasattr(poly, 'tolist') else poly
                        else:
                            # 기본 bbox (좌상단 0,0에서 시작하는 가상 박스)
                            bbox = [[0, 0], [100, 0], [100, 30], [0, 30]]
                        
                        converted_results.append((bbox, text, score))
                        print(f"DEBUG: 추가된 텍스트: '{text}', 신뢰도: {score}", file=sys.stderr)
                        
        except Exception as e:
            print(f"DEBUG: PaddleOCR 결과 파싱 중 오류: {e}", file=sys.stderr)
            print(f"DEBUG: 결과 타입: {type(results)}", file=sys.stderr)
            if results:
                print(f"DEBUG: 첫 번째 결과 타입: {type(results[0])}", file=sys.stderr)
        
        results = converted_results
        
        # 로스트아크 데이터 파싱
        parsed_data = parse_lostark_data(results)
        
        # 웹용 JSON 출력 (표 데이터 포함)
        result_data = {
            "success": True,
            "table_html": format_as_table_html(parsed_data),
            "parsed_stats": parsed_data.get('parsed_stats', {}),
            "raw_data": parsed_data
        }
        print(json.dumps(result_data, ensure_ascii=False, indent=2))
        
    except Exception as e:
        import traceback
        error_data = {
            "success": False,
            "error": f"OCR 처리 중 오류 발생: {str(e)}",
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc(),
            "image_path": image_path
        }
        print(json.dumps(error_data, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()