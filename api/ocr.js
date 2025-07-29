/**
 * 로스트아크 OCR 분석 API - Vercel 서버리스 함수
 * 
 * 이미지 파일을 업로드받아 로스트아크 통계를 분석하고
 * HTML 테이블 형태로 결과를 반환하는 API입니다.
 * 
 * 현재는 실제 OCR 대신 샘플 데이터를 반환합니다.
 * (Vercel 환경에서 Python OCR 실행의 제약으로 인함)
 */

import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

/**
 * Vercel 서버리스 함수 설정
 * bodyParser를 비활성화하여 multipart/form-data 파일 업로드를 직접 처리
 */
export const config = {
  api: {
    bodyParser: false, // formidable로 직접 파싱하기 위해 비활성화
  },
};

/**
 * OCR API 핸들러 함수
 * 
 * @param {Object} req - HTTP 요청 객체
 * @param {Object} res - HTTP 응답 객체
 * @returns {Promise<void>} JSON 응답 (성공/실패)
 * 
 * 응답 형식:
 * {
 *   success: boolean,
 *   message: string,
 *   image_info: { filename: string, size: number },
 *   parsed_stats: { [key: string]: string },
 *   table_html: string
 * }
 */
export default async function handler(req, res) {
  // CORS 헤더 설정 - 모든 도메인에서 접근 허용
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // formidable을 사용한 multipart/form-data 파싱
    const form = new IncomingForm();
    
    // Promise로 감싸서 async/await 사용 가능하게 변환
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // 업로드된 이미지 파일 추출
    const imageFile = files.image;
    if (!imageFile) {
      return res.status(400).json({ success: false, error: '이미지 파일이 필요합니다.' });
    }

    // 실제 OCR 처리 대신 샘플 데이터 반환
    // TODO: 추후 실제 OCR 라이브러리 연동 필요
    // 현재는 Vercel 서버리스 환경에서 Python OCR 실행이 제한적이므로 샘플 데이터 사용
    const sampleResult = {
      success: true,
      message: '이미지 분석 완료',
      
      // 업로드된 이미지 파일 정보
      image_info: {
        filename: imageFile.originalFilename || 'unknown',
        size: imageFile.size || 0
      },
      
      // 로스트아크 통계 샘플 데이터 (추후 실제 OCR 결과로 대체)
      parsed_stats: {
        '전투 시간': '14:12',        // 레이드 진행 시간
        '피해량': '3,214.35억',      // 총 딜량
        '초당 피해량': '3.77억',     // DPS
        '1분 피해량': '593.24억',    // 1분당 평균 딜량
        '치명타 적중률': '86.36%',   // 치명타 확률
        '백어택 적중률': '62.56%',   // 백어택 성공률
        '무력화': '4,240',          // 무력화 기여도
        '카운터 성공': '17'         // 카운터 성공 횟수
      },
      
      // HTML 테이블 생성하여 프론트엔드에서 바로 렌더링 가능
      table_html: generateTableHTML({
        '전투 시간': '14:12',
        '피해량': '3,214.35억',
        '초당 피해량': '3.77억',
        '1분 피해량': '593.24억',
        '치명타 적중률': '86.36%',
        '백어택 적중률': '62.56%',
        '무력화': '4,240',
        '카운터 성공': '17'
      })
    };

    res.status(200).json(sampleResult);

  } catch (error) {
    // 파일 업로드 또는 처리 중 발생한 에러 처리
    console.error('OCR API 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: 'OCR 처리 중 오류가 발생했습니다.',
      details: error.message // 디버깅용 상세 에러 정보
    });
  }
}

/**
 * 로스트아크 통계 데이터를 HTML 테이블로 변환하는 함수
 * 
 * @param {Object} stats - 로스트아크 통계 객체
 * @param {string} stats['전투 시간'] - 레이드 진행 시간
 * @param {string} stats['피해량'] - 총 딜량
 * @param {string} stats['초당 피해량'] - DPS
 * @param {string} stats['1분 피해량'] - 1분당 평균 딜량
 * @returns {string} 스타일이 포함된 HTML 문자열
 */
function generateTableHTML(stats) {
  // 주요 통계 항목 (상단 테이블에 표시)
  const mainStats = ['전투 시간', '피해량', '초당 피해량', '1분 피해량'];
  
  // 추가 통계 항목 (하단 테이블에 표시)
  const additionalStats = ['치명타 적중률', '백어택 적중률', '무력화', '카운터 성공'];

  // HTML 테이블 시작 부분 생성
  let html = `
    <div class="ocr-results">
      <h3 style="color: #2c3e50; margin-bottom: 20px;">로스트아크 통계 분석 결과</h3>
      
      <h4 style="color: #3498db;">주요 정보</h4>
      <table class="stats-table">
        <thead><tr><th>항목</th><th>값</th></tr></thead>
        <tbody>
  `;

  // 주요 통계를 테이블 행으로 변환
  mainStats.forEach(key => {
    const value = stats[key] || '미인식'; // 값이 없으면 '미인식' 표시
    html += `<tr><td>${key}</td><td class="stat-value">${value}</td></tr>`;
  });

  // 주요 정보 테이블 종료 및 추가 정보 테이블 시작
  html += `
        </tbody>
      </table>
      
      <h4 style="color: #27ae60; margin-top: 20px;">추가 정보</h4>
      <table class="stats-table">
        <thead><tr><th>항목</th><th>값</th></tr></thead>
        <tbody>
  `;

  // 추가 통계를 테이블 행으로 변환 (값이 있는 것만 표시)
  additionalStats.forEach(key => {
    if (stats[key]) {
      html += `<tr><td>${key}</td><td class="stat-value">${stats[key]}</td></tr>`;
    }
  });

  // HTML 종료 부분 및 CSS 스타일 추가
  html += `
        </tbody>
      </table>
    </div>
    
    <style>
      /* OCR 결과 전체 컨테이너 스타일 */
      .ocr-results { font-family: Arial, sans-serif; }
      
      /* 통계 테이블 기본 스타일 */
      .stats-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-bottom: 15px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      /* 테이블 헤더 스타일 */
      .stats-table th { 
        background: #3498db; 
        color: white; 
        padding: 12px; 
        text-align: left;
        border: 1px solid #ddd;
      }
      
      /* 테이블 셀 기본 스타일 */
      .stats-table td { 
        padding: 10px; 
        border: 1px solid #ddd;
        background: white;
      }
      
      /* 짝수 행 배경색 (얼룩말 효과) */
      .stats-table tr:nth-child(even) td { background: #f8f9fa; }
      
      /* 행 호버 효과 */
      .stats-table tr:hover td { background: #e3f2fd; }
      
      /* 통계 값 강조 스타일 */
      .stat-value { color: #e74c3c; font-weight: bold; }
    </style>
  `;

  return html;
}