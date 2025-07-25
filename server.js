const express = require('express');
const path = require('path');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 1707;

// 업로드 폴더 생성
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer 설정 (파일 업로드)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB 제한
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다.'));
        }
    }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// OCR API 엔드포인트
app.post('/api/ocr', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    const imagePath = req.file.path;
    const pythonScript = path.join(__dirname, 'simple_ocr.py');

    // Python 스크립트 실행
    const pythonProcess = spawn('python', [pythonScript, imagePath]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
    });

    pythonProcess.on('close', (code) => {
        // 임시 파일 삭제
        fs.unlink(imagePath, (err) => {
            if (err) console.error('파일 삭제 실패:', err);
        });

        console.log(`Python 스크립트 종료 코드: ${code}`);
        console.log('Python stdout:', result);
        console.log('Python stderr:', error);

        if (code !== 0) {
            console.error('Python 스크립트 오류:', error);
            
            // Python에서 JSON 에러를 출력했는지 확인
            try {
                const errorResult = JSON.parse(result);
                return res.status(500).json(errorResult);
            } catch (e) {
                return res.status(500).json({ 
                    success: false,
                    error: 'OCR 처리 중 오류가 발생했습니다.',
                    details: error,
                    pythonOutput: result
                });
            }
        }

        try {
            if (!result.trim()) {
                return res.status(500).json({
                    success: false,
                    error: 'Python 스크립트에서 결과를 반환하지 않았습니다.',
                    pythonOutput: result,
                    pythonError: error
                });
            }

            const ocrResult = JSON.parse(result);
            // OCR 스크립트에서 이미 성공 여부와 HTML 테이블을 포함한 구조를 반환
            res.json(ocrResult);
        } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            console.error('원본 결과:', result);
            res.status(500).json({ 
                success: false,
                error: 'OCR 결과 처리 중 오류가 발생했습니다.',
                parseError: parseError.message,
                rawResult: result 
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});