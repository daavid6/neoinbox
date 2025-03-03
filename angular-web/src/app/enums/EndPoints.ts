const BASE_URL = 'https://europe-west2-neoinbox.cloudfunctions.net/api';

export enum ENDPOINTS {
	// Macro
	createMacro = `${BASE_URL}/macro-create`,
	getAllMacros = `${BASE_URL}/macro-get-all`,

	// Auth
	getAuthURL = `${BASE_URL}/auth-url`,
	getTokens = `${BASE_URL}/auth-token`,

	// Watch
	enableWatch = `${BASE_URL}/watch-enable`,
	disableWatch = `${BASE_URL}/watch-disable`,
	getWatchStatus = `${BASE_URL}/watch-status`,
}
