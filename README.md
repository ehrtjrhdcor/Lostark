# 로스트아크 OCR 분석 시스템

Express.js + Vercel 배포용 로스트아크 OCR 이미지 분석 및 기록 관리 시스템입니다.

## 🚀 주요 기능

- **OCR 이미지 분석**: 로스트아크 스크린샷 자동 분석
- **데이터베이스 저장**: MySQL(PlanetScale)을 통한 기록 관리
- **클라우드 이미지 저장**: Cloudinary를 통한 이미지 업로드
- **기록 조회**: 검색, 필터링, 페이지네이션 지원
- **Vercel 배포**: 서버리스 함수로 최적화

## 🛠️ 기술 스택

- **Backend**: Node.js, Express.js
- **Database**: MySQL (PlanetScale)
- **Image Storage**: Cloudinary
- **Deployment**: Vercel
- **Frontend**: Vanilla JavaScript, HTML, CSS

## 📋 환경 설정

### 1. PlanetScale 데이터베이스 설정

1. [PlanetScale](https://planetscale.com/) 계정 생성
2. 새 데이터베이스 생성
3. Connection String 복사
4. 데이터베이스 스키마 생성:

```sql
-- OCR 기록 메인 테이블
CREATE TABLE ocr_records (
    no INT AUTO_INCREMENT PRIMARY KEY,
    id VARCHAR(20) UNIQUE NOT NULL,
    character_name VARCHAR(100) NOT NULL,
    character_class VARCHAR(50),
    raid_name VARCHAR(100) NOT NULL,
    gate_number INT,
    difficulty VARCHAR(20),
    combat_time VARCHAR(50),
    image_url TEXT,
    image_public_id VARCHAR(255),
    raw_ocr_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_character_name (character_name),
    INDEX idx_raid_name (raid_name),
    INDEX idx_created_at (created_at)
);

-- OCR 스탯 상세 테이블
CREATE TABLE ocr_stats (
    no INT AUTO_INCREMENT PRIMARY KEY,
    id VARCHAR(20) UNIQUE NOT NULL,
    record_id VARCHAR(20) NOT NULL,
    stat_name VARCHAR(100) NOT NULL,
    stat_value TEXT,
    stat_category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_record_id (record_id),
    INDEX idx_stat_name (stat_name),
    INDEX idx_stat_category (stat_category),
    
);
```

### 2. Cloudinary 설정

1. [Cloudinary](https://cloudinary.com/) 계정 생성
2. Dashboard에서 Cloud Name, API Key, API Secret 복사
3. 환경변수에 추가

### 3. 환경변수 설정

`.env` 파일을 생성하고 다음 내용을 추가:

```env
# Database Configuration
DATABASE_URL='mysql://username:password@host/database?ssl={"rejectUnauthorized":true}'

# Cloudinary Configuration  
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Environment
NODE_ENV=production
PORT=1707
```

## 🚀 로컬 개발 환경

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 로컬 서버 실행
npm run dev
```

로컬 서버: http://localhost:1707

## 🌐 Vercel 배포

### 1. Vercel 계정 연결

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 연결
vercel
```

### 2. 환경변수 설정

Vercel Dashboard 또는 CLI로 환경변수 추가:

```bash
# CLI로 환경변수 추가
vercel env add DATABASE_URL
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
```

### 3. 배포

```bash
# 프로덕션 배포
vercel --prod
```

## 📁 프로젝트 구조

```
├── api/                    # Vercel Serverless Functions
│   ├── ocr.js             # OCR 분석 API
│   ├── records.js         # 기록 조회 API
│   └── save-record.js     # 기록 저장 API
├── config/                # 설정 파일들
│   ├── cloudinary.js      # Cloudinary 설정
│   ├── database.js        # 데이터베이스 설정
│   └── constants.js       # 상수 정의
├── public/                # 정적 파일들
│   ├── css/              # 스타일시트
│   ├── js/               # JavaScript 파일들
│   └── index.html        # 메인 HTML
├── server.js             # 로컬 Express 서버
├── vercel.json           # Vercel 설정
└── .env.example          # 환경변수 예시
```

## 🔧 주요 API 엔드포인트

### 기록 관리

- `GET /api/records` - 기록 목록 조회 (페이지네이션, 검색)
- `GET /api/records/[id]` - 특정 기록 상세 조회
- `POST /api/save-record` - OCR 기록 및 이미지 저장

### 파라미터 예시

```javascript
// 기록 목록 조회
GET /api/records?page=1&limit=20&character=캐릭터명&raid=레이드명

// 기록 저장
POST /api/save-record
Content-Type: multipart/form-data
{
  characterName: "캐릭터명",
  raidName: "레이드명", 
  difficulty: "하드",
  ocrData: "{"스탯1": "값1"}",
  image: File
}
```

## 🔍 주요 기능

### OCR 분석
- 로스트아크 스크린샷 업로드
- 자동 텍스트 인식 및 데이터 파싱
- 캐릭터 정보, 레이드 정보 추출

### 데이터 관리
- MySQL 데이터베이스 저장
- 검색 및 필터링
- 페이지네이션 지원

### 이미지 저장
- Cloudinary 자동 업로드
- 이미지 최적화 및 변환
- CDN 배포

## 🐛 문제 해결

### 일반적인 오류

1. **데이터베이스 연결 실패**
   - DATABASE_URL 환경변수 확인
   - PlanetScale 연결 상태 확인

2. **이미지 업로드 실패**
   - Cloudinary 환경변수 확인
   - 파일 크기 및 형식 확인 (최대 10MB)

3. **Vercel 배포 오류**
   - 환경변수 설정 확인
   - 함수 타임아웃 설정 확인

### 로그 확인

```bash
# Vercel 함수 로그 확인
vercel logs

# 로컬 개발 시 콘솔 확인
npm run dev
```

## 📄 라이선스

MIT License

---

🎮 **로스트아크와 함께하는 OCR 분석의 즐거움을 느껴보세요!** ⚔️