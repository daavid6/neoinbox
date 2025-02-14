export enum ENDPOINTS {
	// Macro
	createMacro = 'https://europe-west2-neoinbox.cloudfunctions.net/macro-create',
	getAllMacros = 'https://europe-west2-neoinbox.cloudfunctions.net/macro-get-all',

	// Auth
	getAuthURL = 'https://europe-west2-neoinbox.cloudfunctions.net/auth-url',
	getTokens = 'https://europe-west2-neoinbox.cloudfunctions.net/auth-token',

	// Watch
	enableWatch = 'https://europe-west2-neoinbox.cloudfunctions.net/watch-enable',
	disableWatch = 'https://europe-west2-neoinbox.cloudfunctions.net/watch-disable',
	getWatchStatus = 'https://europe-west2-neoinbox.cloudfunctions.net/watch-status',
}