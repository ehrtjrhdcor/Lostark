#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json
from paddleocr import PaddleOCR
import cv2
import numpy as np

def test_paddleocr():
    """PaddleOCR 기본 테스트"""
    try:
        print("PaddleOCR 초기화 중...")
        reader = PaddleOCR(use_textline_orientation=True, lang='korean')
        print("PaddleOCR 초기화 완료")
        
        # 간단한 테스트 이미지 생성 (텍스트 포함)
        img = np.ones((100, 300, 3), dtype=np.uint8) * 255
        cv2.putText(img, 'Test 123', (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        
        print("OCR 수행 중...")
        results = reader.predict(img)
        
        print("OCR 결과:")
        if results and len(results) > 0:
            result = results[0]
            print(f"인식된 텍스트: {result.get('rec_texts', [])}")
            print(f"신뢰도: {result.get('rec_scores', [])}")
        else:
            print("텍스트 인식 실패")
        
        return True
        
    except Exception as e:
        print(f"오류: {e}")
        return False

if __name__ == "__main__":
    test_paddleocr()