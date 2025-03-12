import { google } from 'googleapis';
import { Timestamp } from 'firebase-admin/firestore';
import { createRequire } from 'module';

import { createDocument, updateDocument, readDocument, existsDoc } from '../firestore/crud.js';
import { firebaseAuth } from '../firestore/firebase.js';
import {
	RequiredVariableError,
	UnexpectedError,
	TokenError,
	DocumentNotFound,
} from '../errors/errors.js';
import { logger } from '../errors/logger.js';

const require = createRequire(import.meta.url);
const basicUserOAuthCredentials = require('../../private/service_accounts/basic-user-oAuthClient.json');

// OAuth2

export function getOAuthClient() {
	return new google.auth.OAuth2(
		basicUserOAuthCredentials.web.client_id,
		basicUserOAuthCredentials.web.client_secret,
		basicUserOAuthCredentials.web.redirect_uris[0],
	);
}

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
		const oAuthClient = getOAuthClient();
		const userData = await readDocument('users', userId);

		if (!userData?.refresh_token) {
			logger.error(`No refresh token found for user ${userId}`);
			throw new ReferenceError(`No refresh token found for user ${userId}`);
		}

		oAuthClient.setCredentials({ refresh_token: userData.refresh_token });
		return oAuthClient;
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
				throw new UnexpectedError(
					`Unexpected error during getOAuthClientOf: ${error.message}`,
				);
		}
	}
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
		// Exchange auth code for tokens object
		const tokens = await exchangeCodeForToken(code);

		if (!tokens?.refresh_token) {
			logger.error(`No refresh token received from OAuth exchange with code ${code}`);
			throw new ReferenceError('No refresh token received from OAuth exchange');
		}

		// Get user info from Google OAuth2
		const oAuth2Client = getOAuthClient();
		oAuth2Client.setCredentials(tokens);
		const googleUserInfo = await getGoogleUserInfo(oAuth2Client);

		// Get the user record from Firebase Auth by email or create a new one
		const firebaseUserRecord = await getOrCreateFirebaseUserByEmail(googleUserInfo);

		// Save new refresh token to Firestore and create user if not exists
		await updateOrCreateFirestoreUser(firebaseUserRecord.uid, tokens.refresh_token);

		return { tokens, userId: firebaseUserRecord.uid };
	} catch (error) {
		logger.error(`Failed to validate the code: ${code}:`, error);
		throw error;
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

	const oAuth2Client = getOAuthClient();

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
					reject(
						new ReferenceError(`No token received from OAuth2Client: ${oAuth2Client}`),
					);
					return;
				}
				resolve(token);
			});
		});

		return token;
	} catch (error) {
		logger.error(`Failed to get Tokens from code: ${code}`, {
			error: error.message,
			stack: error.stack,
		});

		switch (error.constructor) {
			case TokenError:
			case ReferenceError:
				throw error;
			default:
				logger.error('Unexpected error during token exchange:', error);
				throw new UnexpectedError(
					`Unexpected error during token exchange: ${error.message}`,
				);
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
async function getGoogleUserInfo(oAuth2Client) {
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
 * Gets a user record by email, creating the user if they don't exist
 *
 * @param {Object} userInfo - User information containing email, name, and optional picture
 * @param {string} userInfo.email - The user's email address
 * @param {string} userInfo.name - The user's display name
 * @param {string} [userInfo.picture] - URL to the user's profile picture
 * @returns {Promise<Object>} Firebase user record
 * @throws {UnexpectedError} If Firebase operations fail for reasons other than user not found
 */
async function getOrCreateFirebaseUserByEmail(userInfo) {
	if (!userInfo?.email) {
		logger.error('Missing email in userInfo');
		throw new RequiredVariableError({ userInfo });
	}

	try {
		// First try to get the existing user
		return await firebaseAuth.getUserByEmail(userInfo.email);
	} catch (error) {
		// If the user doesn't exist, create them
		if (error.code === 'auth/user-not-found') {
			return await firebaseAuth.createUser({
				email: userInfo.email,
				displayName: userInfo.name,
				photoURL: userInfo.picture,
			});
		}

		// For any other error, log and throw
		logger.error('Unexpected error while getting/creating user:', error);
		throw new UnexpectedError(`Failed to get or create user: ${error.message}`);
	}
}

/**
 * Updates an existing user's refresh token or creates a new user in Firestore if they don't exist
 *
 * @param {string} userId - The Firebase user ID
 * @param {string} refreshToken - The OAuth2 refresh token to store
 * @returns {Promise<void>}
 * @throws {UnexpectedError} If Firestore operations fail
 */
async function updateOrCreateFirestoreUser(userId, refreshToken) {
	if (!userId) {
		logger.error('Missing userId parameter');
		throw new RequiredVariableError({ userId });
	}

	if (!refreshToken) {
		logger.error('Missing refreshToken parameter');
		throw new RequiredVariableError({ refreshToken });
	}

	try {
		// Check if user exists in Firestore
		const exists = await existsDoc('users', userId);

		if (exists) {
			// User already exists
			await updateDocument('users', userId, { refresh_token: refreshToken });
		} else {
			// New user
			const { userData } = formatUserData(userId, refreshToken);
			await createDocument('users', userId, userData);
		}
	} catch (error) {
		logger.error('Unexpected error during updateOrCreateUserInFirestore:', error);
		throw new UnexpectedError(`Failed to update or create user: ${error.message}`);
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
function formatUserData(
	userId,
	refreshToken,
	historyId = '',
	expiration = Timestamp.fromMillis(Date.now()),
	enabled = false,
) {
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
				historyId,
				expiration,
				enabled,
			},
			refresh_token: refreshToken,
		},
	};
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
export async function refreshToken(refreshToken) {
	if (!refreshToken) {
		logger.error('Missing refreshToken parameter');
		throw new RequiredVariableError({ refreshToken });
	}

	try {
		const oAuth2Client = getOAuthClient();
		oAuth2Client.setCredentials({ refresh_token: refreshToken });

		const tokens = await new Promise((resolve, reject) => {
			oAuth2Client.refreshAccessToken((err, tokens) => {
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

		oAuth2Client.setCredentials(tokens);
		return oAuth2Client;
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
				throw new UnexpectedError(
					`Unexpected error during token refresh: ${error.message}`,
				);
		}
	}
}
