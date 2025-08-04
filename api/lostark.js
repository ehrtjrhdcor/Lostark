/**
 * 로스트아크 API - Vercel 서버리스 함수
 * 
 * 로스트아크 공식 API를 통해 캐릭터 정보를 조회하는 API입니다.
 */

const LOSTARK_API_BASE_URL = 'https://developer-lostark.game.onstove.com';

// API 키 풀 관리
const API_KEYS = process.env.LOSTARK_API_KEYS ? process.env.LOSTARK_API_KEYS.split(',') : [];

// 랜덤 API 키 선택 함수
function getRandomApiKey() {
	if (API_KEYS.length === 0) {
		throw new Error('API 키가 설정되지 않았습니다. 환경변수 LOSTARK_API_KEYS를 확인하세요.');
	}
	const randomIndex = Math.floor(Math.random() * API_KEYS.length);
	console.log(`🔑 API 키 ${randomIndex + 1}/${API_KEYS.length} 사용 중...`);
	return API_KEYS[randomIndex];
}

/**
 * 로스트아크 API 핸들러 함수
 * 
 * @param {Object} req - HTTP 요청 객체
 * @param {Object} res - HTTP 응답 객체
 */
export default async function handler(req, res) {
	// CORS 헤더 설정
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

	const { action, characterName } = req.body;

	// 환경변수에서 API 키 확인
	try {
		if (API_KEYS.length === 0) {
			return res.status(500).json({
				success: false,
				error: 'API 키가 서버에 설정되지 않았습니다.'
			});
		}
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: 'API 키 설정 오류: ' + error.message
		});
	}

	try {
		switch (action) {
			case 'test':
				return await handleApiTest(req, res);
			case 'connect':
				return await handleApiConnect(req, res);
			case 'character_siblings':
				return await handleCharacterSiblings(req, res, characterName);
			case 'character_profile':
				return await handleCharacterProfile(req, res, characterName);
			default:
				return res.status(400).json({
					success: false,
					error: '유효하지 않은 액션입니다.'
				});
		}
	} catch (error) {
		console.error('로스트아크 API 오류:', error);
		return res.status(500).json({
			success: false,
			error: 'API 호출 중 서버 오류가 발생했습니다.',
			details: error.message
		});
	}
}

/**
 * API 테스트 (features 페이지용)
 */
async function handleApiTest(req, res) {
	try {
		// 테스트용 캐릭터 "다시시작하는창술사"로 형제 캐릭터 목록 조회
		const testCharacterName = '다시시작하는창술사';
		
		// 1단계: 형제 캐릭터 목록 조회
		const siblingsUrl = `${LOSTARK_API_BASE_URL}/characters/${encodeURIComponent(testCharacterName)}/siblings`;
		
		console.log(`📋 API 테스트: ${testCharacterName} 형제 캐릭터 조회 중...`);
		console.log(`URL: ${siblingsUrl}`);

		const apiKey = getRandomApiKey();
		const siblingsResponse = await fetch(siblingsUrl, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Accept': 'application/json'
			}
		});

		const siblingsData = await siblingsResponse.json();

		if (!siblingsResponse.ok) {
			console.error(`❌ API 테스트 실패:`, siblingsResponse.status, siblingsData);
			
			let errorMessage = 'API 연결에 실패했습니다.';
			if (siblingsResponse.status === 429) {
				errorMessage = 'API 호출 제한에 도달했습니다. 잠시 후 다시 시도해주세요.';
			} else if (siblingsResponse.status === 401) {
				errorMessage = 'API 키가 유효하지 않습니다.';
			}

			return res.status(siblingsResponse.status).json({
				success: false,
				error: errorMessage,
				details: siblingsData
			});
		}

		console.log(`✅ API 테스트 성공: ${testCharacterName} 형제 캐릭터 목록:`, siblingsData);

		// 2단계: 각 캐릭터의 프로필 정보 조회 (최대 5명)
		let profileResults = [];
		if (Array.isArray(siblingsData) && siblingsData.length > 0) {
			const charactersToProcess = siblingsData.slice(0, 5); // 테스트용으로 최대 5명만
			console.log(`=== ${charactersToProcess.length}명의 캐릭터 프로필 조회 시작 ===`);

			for (const character of charactersToProcess) {
				try {
					const profileUrl = `${LOSTARK_API_BASE_URL}/armories/characters/${encodeURIComponent(character.CharacterName)}/profiles`;
					console.log(`📋 ${character.CharacterName} 프로필 조회 중...`);

					const profileApiKey = getRandomApiKey();
					const profileResponse = await fetch(profileUrl, {
						method: 'GET',
						headers: {
							'Authorization': `Bearer ${profileApiKey}`,
							'Accept': 'application/json'
						}
					});

					const profileData = await profileResponse.json();

					if (profileResponse.ok) {
						console.log(`✅ ${character.CharacterName} 프로필:`, profileData);
						profileResults.push({
							character: character.CharacterName,
							success: true,
							data: profileData
						});
					} else {
						console.error(`❌ ${character.CharacterName} 프로필 조회 실패:`, profileResponse.status, profileData);
						profileResults.push({
							character: character.CharacterName,
							success: false,
							error: profileData
						});
					}
				} catch (profileError) {
					console.error(`❌ ${character.CharacterName} 프로필 API 호출 오류:`, profileError.message);
					profileResults.push({
						character: character.CharacterName,
						success: false,
						error: profileError.message
					});
				}
			}

			console.log(`=== API 테스트 완료 ===`);
		}

		return res.json({
			success: true,
			result: siblingsData,
			profiles: profileResults,
			message: `API 연결 성공! ${testCharacterName}의 형제 캐릭터 ${siblingsData.length}명을 찾았습니다.`
		});
	} catch (error) {
		console.error('로스트아크 API 호출 실패:', error);
		return res.status(500).json({
			success: false,
			error: 'API 호출 중 서버 오류가 발생했습니다.',
			details: error.message
		});
	}
}

/**
 * API 연결 테스트 (about 페이지용)
 */
async function handleApiConnect(req, res) {
	// TODO: API 호출 구현
	return res.json({
		success: true,
		message: '테스트용 응답'
	});
}

/**
 * 형제 캐릭터 목록 조회
 */
async function handleCharacterSiblings(req, res, characterName) {
	if (!characterName) {
		return res.status(400).json({
			success: false,
			error: '캐릭터명이 필요합니다.'
		});
	}

	try {
		const siblingsUrl = `${LOSTARK_API_BASE_URL}/characters/${encodeURIComponent(characterName)}/siblings`;
		
		console.log(`📋 ${characterName} 형제 캐릭터 조회 중...`);
		console.log(`URL: ${siblingsUrl}`);

		const apiKey = getRandomApiKey();
		const siblingsResponse = await fetch(siblingsUrl, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Accept': 'application/json'
			}
		});

		const siblingsData = await siblingsResponse.json();

		if (!siblingsResponse.ok) {
			console.error(`❌ ${characterName} 형제 캐릭터 조회 실패:`, siblingsResponse.status, siblingsData);
			
			let errorMessage = '캐릭터를 찾을 수 없습니다.';
			if (siblingsResponse.status === 404) {
				errorMessage = '존재하지 않는 캐릭터입니다.';
			} else if (siblingsResponse.status === 429) {
				errorMessage = 'API 호출 제한에 도달했습니다. 잠시 후 다시 시도해주세요.';
			} else if (siblingsResponse.status === 401) {
				errorMessage = 'API 키가 유효하지 않습니다.';
			}

			return res.status(siblingsResponse.status).json({
				success: false,
				error: errorMessage,
				details: siblingsData
			});
		}

		console.log(`✅ ${characterName} 형제 캐릭터 목록:`, siblingsData);

		return res.json({
			success: true,
			result: siblingsData,
			message: '형제 캐릭터 조회 성공'
		});

	} catch (error) {
		console.error('형제 캐릭터 조회 API 호출 실패:', error);
		return res.status(500).json({
			success: false,
			error: '형제 캐릭터 조회 중 서버 오류가 발생했습니다.',
			details: error.message
		});
	}
}

/**
 * 단일 캐릭터 프로필 조회
 */
async function handleCharacterProfile(req, res, characterName) {
	if (!characterName) {
		return res.status(400).json({
			success: false,
			error: '캐릭터명이 필요합니다.'
		});
	}

	try {
		const profileUrl = `${LOSTARK_API_BASE_URL}/armories/characters/${encodeURIComponent(characterName)}/profiles`;
		console.log(`📋 ${characterName} 프로필 조회 중...`);

		const apiKey = getRandomApiKey();
		const profileResponse = await fetch(profileUrl, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Accept': 'application/json'
			}
		});

		const profileData = await profileResponse.json();

		if (profileResponse.ok) {
			console.log(`✅ ${characterName} 프로필:`, profileData);
			return res.json({
				character: characterName,
				success: true,
				data: profileData
			});
		} else {
			console.error(`❌ ${characterName} 프로필 조회 실패:`, profileResponse.status, profileData);
			return res.status(profileResponse.status).json({
				character: characterName,
				success: false,
				error: profileData
			});
		}
	} catch (profileError) {
		console.error(`❌ ${characterName} 프로필 API 호출 오류:`, profileError.message);
		return res.status(500).json({
			character: characterName,
			success: false,
			error: '프로필 조회 중 서버 오류가 발생했습니다.',
			details: profileError.message
		});
	}
}