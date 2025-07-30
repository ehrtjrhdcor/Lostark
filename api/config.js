/**
 * API 설정 - Vercel 서버리스 함수
 * 
 * 클라이언트에서 사용할 API 키를 제공합니다.
 */

// API 키 상수 (constants.js에서 가져온 것과 동일)
const API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyIsImtpZCI6IktYMk40TkRDSTJ5NTA5NWpjTWk5TllqY2lyZyJ9.eyJpc3MiOiJodHRwczovL2x1ZHkuZ2FtZS5vbnN0b3ZlLmNvbSIsImF1ZCI6Imh0dHBzOi8vbHVkeS5nYW1lLm9uc3RvdmUuY29tL3Jlc291cmNlcyIsImNsaWVudF9pZCI6IjEwMDAwMDAwMDAwMDExNTIifQ.PUF70zE_m-9vTT_vRQ0TTuDWsulxRss9ZrW8wSUnGsds65C6NgD-qCmSv45XAuoU0NyJXjmttsbDEf-_-Y8x7im7ycVeooqXJLJXIdZ8ukkJZtm_-0S-WodhcVV7UYj9dvXdTWLyYWmY-y4q2HIIouE6ohPFtcESariEztQ3muVqF2i0FLFfiPN6KEnbJqVr6XO4XMY1HOQszKATOG0Npb0v0JItBdEwYrudbkxQwF5fd3tct6_v56m_eMo8HkRjka0BeKTShDR7q0MKSd1GXBnrJ9JXOhKMC9kqGqD08YEkR2Nrr2jWsF7E3mHhxUSNZYppcN6G87wj6UnEs5ySpw';

/**
 * API 설정 핸들러 함수
 * 
 * @param {Object} req - HTTP 요청 객체
 * @param {Object} res - HTTP 응답 객체
 */
export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // CORS preflight 요청 처리
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GET 요청만 허용
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        return res.json({
            success: true,
            apiKey: API_KEY
        });
    } catch (error) {
        console.error('API 설정 오류:', error);
        return res.status(500).json({
            success: false,
            error: 'API 설정을 가져오는 중 오류가 발생했습니다.',
            details: error.message
        });
    }
}