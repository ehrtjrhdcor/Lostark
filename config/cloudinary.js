const cloudinary = require('cloudinary').v2;
require('dotenv').config();

/**
 * Cloudinary 설정
 */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

/**
 * 이미지를 Cloudinary에 업로드
 * @param {Buffer|string} file - 업로드할 파일 (Buffer 또는 파일 경로)
 * @param {Object} options - 업로드 옵션
 * @returns {Promise<Object>} 업로드 결과
 */
async function uploadImage(file, options = {}) {
    try {
        const defaultOptions = {
            folder: 'lostark-ocr',  // Cloudinary 폴더명
            resource_type: 'image',
            quality: 'auto',
            format: 'auto',
            transformation: [
                { width: 1920, height: 1080, crop: 'limit' },  // 최대 크기 제한
                { quality: 'auto:good' }  // 자동 품질 최적화
            ]
        };

        const uploadOptions = { ...defaultOptions, ...options };
        
        let uploadResult;
        
        if (Buffer.isBuffer(file)) {
            // Buffer로 직접 업로드
            uploadResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(file);
            });
        } else {
            // 파일 경로로 업로드
            uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
        }

        console.log(`✅ Cloudinary 업로드 성공: ${uploadResult.secure_url}`);
        
        return {
            success: true,
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            width: uploadResult.width,
            height: uploadResult.height,
            bytes: uploadResult.bytes,
            format: uploadResult.format
        };

    } catch (error) {
        console.error('❌ Cloudinary 업로드 실패:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Cloudinary에서 이미지 삭제
 * @param {string} publicId - 삭제할 이미지의 public_id
 * @returns {Promise<Object>} 삭제 결과
 */
async function deleteImage(publicId) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`✅ Cloudinary 이미지 삭제: ${publicId}`);
        return { success: true, result };
    } catch (error) {
        console.error('❌ Cloudinary 이미지 삭제 실패:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Cloudinary 연결 테스트
 */
async function testCloudinaryConnection() {
    try {
        const result = await cloudinary.api.ping();
        console.log('✅ Cloudinary 연결 성공');
        return true;
    } catch (error) {
        console.error('❌ Cloudinary 연결 실패:', error.message);
        return false;
    }
}

module.exports = {
    cloudinary,
    uploadImage,
    deleteImage,
    testCloudinaryConnection
};