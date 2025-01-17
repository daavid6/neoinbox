import { google } from 'googleapis';
import { Timestamp } from 'firebase-admin/firestore';
import { createRequire } from 'module';

import { createDocument, existsDoc, updateDocument, readDocument } from '../firestore/crud.js';
import { firebaseAuth } from '../firestore/firebase.js';
import { RequiredVariableError, UnexpectedError, TokenError, DocumentNotFound, DocumentAlreadyExists } from '../errors/errors.js';
import { logger } from '../errors/logger.js';

const require = createRequire(import.meta.url);
const oAuthClientCredentials = require('../../private/service_accounts/gmail-watch-client-oauth.json');

const { client_secret, client_id, redirect_uris } = oAuthClientCredentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[1]);

/**
 * Retrieves an OAuth2 client for a given user.
 *
 * This function fetches the user's refresh token from Firestore and uses it to create
 * and configure a new OAuth2 client. If the user does not have a refresh token, an error is thrown.
 *
 * @param {string} userId - The ID of the user for whom to retrieve the OAuth2 client.
 * @returns {Promise<google.auth.OAuth2>} - A promise that resolves to a configured OAuth2 client.
 * @throws {RequiredVariableError} - If the userId parameter is missing.
 * @throws {ReferenceError} - If no refresh token is found for the user.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 *
 */
export async function getOAuthClientOf(userId) {
	if (!userId) {
		logger.error('Missing userId parameter');
		throw new RequiredVariableError({ userId });
	}

	try {
		const newOAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[1]);
		const userData = await readDocument('users', userId);

		if (!userData?.refresh_token) {
			logger.error(`No refresh token found for user ${userId}`);
			throw new ReferenceError(`No refresh token found for user ${userId}`);
		}

		newOAuth2Client.setCredentials({ refresh_token: userData.refresh_token });
		return newOAuth2Client;
	} catch (error) {
		logger.error(`Failed to get OAuth client for user ${userId}:`, {
			error: error.message,
			stack: error.stack,
		});

		switch (error.constructor) {
			case ReferenceError:
			case DocumentNotFound:
				throw error;
			default:
				logger.error('Unexpected error during getOAuthClientOf:', error);
				throw new UnexpectedError(`Unexpected error during getOAuthClientOf: ${error.message}`);
		}
	}
}

/**
 * Formats user data for storage.
 *
 * This function formats the user data object with the provided userId and refreshToken.
 * It includes a watch object with default values and the refresh token.
 *
 * @param {string} userId - The user's ID.
 * @param {string} refreshToken - The OAuth2 refresh token.
 * @returns {Object} - The formatted user data object.
 * @throws {RequiredVariableError} - If the userId or refreshToken parameter is missing.
 */
function formatUserData(userId, refreshToken) {
	if (!userId) {
		logger.error('Missing userId parameter');
		throw new RequiredVariableError({ userId });
	}

	if (!refreshToken) {
		logger.error('Missing refreshToken parameter');
		throw new RequiredVariableError({ refreshToken });
	}

	return {
		userId,
		userData: {
			watch: {
				historyId: '',
				expiration: Timestamp.fromMillis(Date.now()),
				enabled: false,
			},
			refresh_token: refreshToken,
		},
	};
}

// Google Login

/**
 * Validates an authorization code and retrieves user data.
 *
 * This function exchanges the provided authorization code for an OAuth2 token,
 * retrieves user data using the token, and saves the user data to Firestore.
 *
 * @param {string} code - The authorization code to validate.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the token and userId.
 * @throws {RequiredVariableError} - If the code parameter is missing.
 * @throws {TokenError} - If the token exchange fails or no token is received.
 * @throws {ReferenceError} - If no refresh token is received or if user data retrieval fails.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
export async function validateCode(code) {
	if (!code) {
		logger.error('Missing code parameter');
		throw new RequiredVariableError({ code });
	}

	try {
		const token = await exchangeCodeForToken(code);

		if (!token?.refresh_token) {
			logger.error(`No refresh token received from OAuth exchange with code ${code}`);
			throw new ReferenceError('No refresh token received from OAuth exchange');
		}

		const { userId, userData } = await getUserData(token.refresh_token);

		if (!userId || !userData) {
			logger.error(`Failed to get valid userData or userId with refreshToken: ${token.refresh_token}`);
			throw new ReferenceError(`Failed to get valid userData: ${userData} or userId: ${userId}`);
		}

		await saveUserData(userId, userData);

		return { token, userId };
	} catch (error) {
		logger.error(`Failed to validate the code: ${code}:`, {
			error: error.message,
			stack: error.stack,
		});

		switch (error.constructor) {
			case RequiredVariableError:
			case TokenError:
			case ReferenceError:
			case UnexpectedError:
				throw error;
			default:
				logger.error('Unexpected error during validateCode:', error);
				throw new UnexpectedError(`Unexpected error during validateCode: ${error.message}`);
		}
	}
}

/**
 * Retrieves user information using an OAuth2 client.
 *
 * This function fetches user information from Google OAuth2 using the provided OAuth2 client.
 * If the OAuth2 client is missing or the user information cannot be retrieved, an error is thrown.
 *
 * @param {google.auth.OAuth2} oAuth2Client - The OAuth2 client to use for fetching user information.
 * @returns {Promise<Object>} - A promise that resolves to the user information.
 * @throws {RequiredVariableError} - If the oAuth2Client parameter is missing.
 * @throws {ReferenceError} - If no user information is received from Google OAuth2.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
async function getUserInfo(oAuth2Client) {
	if (!oAuth2Client) {
		logger.error('Missing OAuth2 client');
		throw new RequiredVariableError({ oAuth2Client });
	}

	try {
		const oauth2 = google.oauth2({
			auth: oAuth2Client,
			version: 'v2',
		});

		const res = await oauth2.userinfo.get();

		if (!res?.data) {
			throw new ReferenceError('No user info received from Google OAuth2');
		}

		return res.data;
	} catch (error) {
		logger.error(`Failed to get user info from oAuth2Client: ${oAuth2Client}:`, {
			error: error.message,
			stack: error.stack,
		});

		switch (error.constructor) {
			case ReferenceError:
				throw error;
			default:
				logger.error('Unexpected error during getUserInfo:', error);
				throw new UnexpectedError(`Unexpected error during getUserInfo: ${error.message}`);
		}
	}
}

/**
 * Saves user data to Firestore.
 *
 * This function checks if a user document exists in Firestore. If it exists, the document is updated.
 * If it does not exist, a new document is created.
 *
 * @param {string} userId - The ID of the user whose data is to be saved.
 * @param {Object} userData - The user data to be saved.
 * @throws {RequiredVariableError} - If the userId or userData parameter is missing.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
async function saveUserData(userId, userData) {
	if (!userId) {
		logger.error('Missing userId parameter');
		throw new RequiredVariableError({ userId });
	}

	if (!userData) {
		logger.error('Missing userData parameter');
		throw new RequiredVariableError({ userData });
	}

	try {
		const exists = existsDoc('users', userId);

		if (exists) await updateDocument('users', userId, userData);
		else await createDocument('users', userId, userData);
	} catch (error) {
		logger.error(`Failed to save user data for user ${userId}:`, {
			error: error.message,
			stack: error.stack,
		});

		switch (error.constructor) {
			case DocumentAlreadyExists:
			case DocumentNotFound:
			case UnexpectedError:
				throw error;
			default:
				logger.error('Unexpected error during saveUserData:', error);
				throw new UnexpectedError(`Failed to save user data: ${error.message}`);
		}
	}
}

/**
 * Retrieves or creates user data based on the provided refresh token.
 *
 * This function fetches user information using the provided OAuth2 client and refresh token.
 * If the user does not exist in Firebase, a new user is created. The user data is then formatted
 * and returned.
 *
 * @param {string} refreshToken - The OAuth2 refresh token.
 * @returns {Promise<Object>} - A promise that resolves to the formatted user data object.
 * @throws {RequiredVariableError} - If the refreshToken parameter is missing.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
async function getUserData(refreshToken) {
	if (!refreshToken) {
		logger.error('Missing refreshToken parameter');
		throw new RequiredVariableError({ refreshToken });
	}

	try {
		const userInfo = await getUserInfo(oAuth2Client);

		try {
			const userRecord = await firebaseAuth.getUserByEmail(userInfo.email);
			return formatUserData(userRecord.uid, refreshToken);
		} catch (error) {
			if (error.code === 'auth/user-not-found') {
				const newUser = await firebaseAuth.createUser({
					email: userInfo.email,
					displayName: userInfo.name,
					photoURL: userInfo.picture,
				});

				return formatUserData(newUser.uid, refreshToken);
			}

			logger.error('Unexpected error handling Firebase auth:', error);
			throw new UnexpectedError(`Unexpected error handling Firebase auth: ${error.message}`);
		}
	} catch (error) {
		logger.error(`Failed to get user data from refres_token: ${refreshToken}:`, {
			error: error.message,
			stack: error.stack,
		});

		switch (error.constructor) {
			case RequiredVariableError:
			case ReferenceError:
			case UnexpectedError:
				throw error;
			default:
				logger.error('Unexpected error during getUserData:', error);
				throw new UnexpectedError(`Unexpected error during getUserData: ${error.message}`);
		}
	}
}

/**
 * Exchanges an authorization code for an OAuth2 token.
 *
 * This function decodes the provided authorization code and exchanges it for an OAuth2 token.
 * If the token exchange fails or no token is received, an error is thrown.
 *
 * @param {string} code - The authorization code to exchange for a token.
 * @returns {Promise<Object>} - A promise that resolves to the OAuth2 token.
 * @throws {RequiredVariableError} - If the code parameter is missing.
 * @throws {TokenError} - If the token exchange fails or no token is received.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 *
 */
async function exchangeCodeForToken(code) {
	if (!code) {
		logger.error('Missing code parameter');
		throw new RequiredVariableError({ code });
	}

	try {
		const decodedCode = decodeURIComponent(code);
		const token = await new Promise((resolve, reject) => {
			oAuth2Client.getToken(decodedCode, (err, token) => {
				if (err) {
					logger.error('Token exchange failed:', err);
					reject(new TokenError(`Failed to exchange code: ${err.message}`));
					return;
				}
				if (!token) {
					logger.error(`No token received from OAuth2Client: ${oAuth2Client}`);
					reject(new ReferenceError(`No token received from OAuth2Client: ${oAuth2Client}`));
					return;
				}
				resolve(token);
			});
		});

		oAuth2Client.setCredentials(token);
		return token;
	} catch (error) {
		logger.error(`Failed to get Token from code: ${code}`, {
			error: error.message,
			stack: error.stack,
		});

		switch (error.constructor) {
			case TokenError:
			case ReferenceError:
				throw error;
			default:
				logger.error('Unexpected error during token exchange:', error);
				throw new UnexpectedError(`Unexpected error during token exchange: ${error.message}`);
		}
	}
}

// Renew tokens

/**
 * Refreshes OAuth2 access tokens for multiple users.
 *
 * This function takes an array of user IDs and refresh tokens, attempts to refresh the tokens,
 * and returns an array of successfully refreshed OAuth2 clients.
 *
 * @param {Array<{id: string, refresh_token: string}>} ids - Array of user IDs and refresh tokens.
 * @returns {Promise<Array<{userId: string, oAuth2Client: google.auth.OAuth2}>>} - A promise that resolves to an array of successfully refreshed OAuth2 clients.
 * @throws {RequiredVariableError} - If the ids parameter is missing or invalid.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
export async function refreshAllTokens(ids) {
	if (!Array.isArray(ids) || ids.length === 0) {
		logger.error('Invalid array of user IDs');
		throw new RequiredVariableError({ ids });
	}

	try {
		const refreshPromises = ids.map(async (userInfo) => {
			if (!userInfo?.id || !userInfo?.refresh_token) {
				logger.error('Invalid user info:', userInfo);
				return null;
			}

			try {
				const oAuth2Client = await refreshToken(userInfo.refresh_token);
				return {
					userId: userInfo.id,
					oAuth2Client,
				};
			} catch (error) {
				logger.error(`Failed to refresh token for user: ${userInfo.id}`, error);
				throw error;
			}
		});

		const results = await Promise.all(refreshPromises);
		const successfulClients = results.filter((result) => result !== null);

		return successfulClients;
	} catch (error) {
		logger.error('Error in refreshAllTokens:', {
			error: error.message,
			stack: error.stack,
		});

		switch (error.constructor) {
			case TokenError:
			case ReferenceError:
			case UnexpectedError:
				throw error;
			default:
				logger.error('Token refresh operation failed:', error);
				throw new UnexpectedError(`Token refresh operation failed: ${error.message}`);
		}
	}
}

/**
 * Refreshes OAuth2 access tokens for multiple users.
 *
 * This function takes an array of user IDs and refresh tokens, attempts to refresh the tokens,
 * and returns an array of successfully refreshed OAuth2 clients.
 *
 * @param {Array<{id: string, refresh_token: string}>} ids - Array of user IDs and refresh tokens.
 * @returns {Promise<Array<{userId: string, oAuth2Client: google.auth.OAuth2}>>} - A promise that resolves to an array of successfully refreshed OAuth2 clients.
 * @throws {RequiredVariableError} - If the ids parameter is missing or invalid.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
async function refreshToken(refreshToken) {
	if (!refreshToken) {
		logger.error('Missing refreshToken parameter');
		throw new RequiredVariableError({ refreshToken });
	}

	try {
		const newOAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[1]);
		newOAuth2Client.setCredentials({ refresh_token: refreshToken });

		const tokens = await new Promise((resolve, reject) => {
			newOAuth2Client.refreshAccessToken((err, tokens) => {
				if (err) {
					logger.error('Token refresh failed:', err);
					reject(new TokenError(`Failed to refresh token: ${err.message}`));
					return;
				}

				if (!tokens) {
					logger.error('No tokens received from refresh');
					reject(new ReferenceError('No tokens received from refresh'));
					return;
				}

				resolve(tokens);
			});
		});

		newOAuth2Client.setCredentials(tokens);
		return newOAuth2Client;
	} catch (error) {
		logger.error('Error in refreshToken:', {
			error: error.message,
			stack: error.stack,
		});

		switch (error.constructor) {
			case TokenError:
			case ReferenceError:
			case UnexpectedError:
				throw error;
			default:
				logger.error('Unexpected error during token refresh:', error);
				throw new UnexpectedError(`Unexpected error during token refresh: ${error.message}`);
		}
	}
}
