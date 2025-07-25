// Vercel 서버리스 함수
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

// 파일 업로드 파싱을 위한 설정
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // 파일 업로드 처리
    const form = new IncomingForm();
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const imageFile = files.image;
    if (!imageFile) {
      return res.status(400).json({ success: false, error: '이미지 파일이 필요합니다.' });
    }

    // 간단한 샘플 응답 (실제 OCR 없이)
    const sampleResult = {
      success: true,
      message: '이미지 분석 완료',
      image_info: {
        filename: imageFile.originalFilename || 'unknown',
        size: imageFile.size || 0
      },
      parsed_stats: {
        '전투 시간': '14:12',
        '피해량': '3,214.35억',
        '초당 피해량': '3.77억',
        '1분 피해량': '593.24억',
        '치명타 적중률': '86.36%',
        '백어택 적중률': '62.56%',
        '무력화': '4,240',
        '카운터 성공': '17'
      },
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
    console.error('OCR API 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: 'OCR 처리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

function generateTableHTML(stats) {
  const mainStats = ['전투 시간', '피해량', '초당 피해량', '1분 피해량'];
  const additionalStats = ['치명타 적중률', '백어택 적중률', '무력화', '카운터 성공'];

  let html = `
    <div class="ocr-results">
      <h3 style="color: #2c3e50; margin-bottom: 20px;">로스트아크 통계 분석 결과</h3>
      
      <h4 style="color: #3498db;">주요 정보</h4>
      <table class="stats-table">
        <thead><tr><th>항목</th><th>값</th></tr></thead>
        <tbody>
  `;

  mainStats.forEach(key => {
    const value = stats[key] || '미인식';
    html += `<tr><td>${key}</td><td class="stat-value">${value}</td></tr>`;
  });

  html += `
        </tbody>
      </table>
      
      <h4 style="color: #27ae60; margin-top: 20px;">추가 정보</h4>
      <table class="stats-table">
        <thead><tr><th>항목</th><th>값</th></tr></thead>
        <tbody>
  `;

  additionalStats.forEach(key => {
    if (stats[key]) {
      html += `<tr><td>${key}</td><td class="stat-value">${stats[key]}</td></tr>`;
    }
  });

  html += `
        </tbody>
      </table>
    </div>
    
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
    </style>
  `;

  return html;
}