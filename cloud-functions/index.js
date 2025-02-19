import * as functions from '@google-cloud/functions-framework';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { Timestamp } from 'firebase-admin/firestore';

import { readDocument, updateDocument } from './app/manager/firestore/crud.js';
import { renewExpiringWatches } from './app/manager/gmail/renew-expiring-watches.js';
import { validateCode, getOAuthClient } from './app/manager/oauth2/authorize.js';
import { firebaseAuth } from './app/manager/firestore/firebase.js';
import { getHistoryListSince } from './app/manager/gmail/list/list.js';
import { getAction } from './app/manager/macros/actions.js';
import {
	createMacro,
	getMacro,
	getAllMacros,
	getAllMacrosWithLabels,
} from './app/manager/macros/macros.js';
import { TokenError } from './app/manager/errors/errors.js';
import { logger } from './app/manager/errors/logger.js';
import { manageMessage } from './app/manager/gmail/message/message.js';

export const watchRenew = async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.status(StatusCodes.NO_CONTENT).send({
			data: {},
			message: ReasonPhrases.NO_CONTENT,
		});
		return;
	}

	if (req.method !== 'POST') {
		res.status(StatusCodes.METHOD_NOT_ALLOWED).send({
			error: ReasonPhrases.METHOD_NOT_ALLOWED,
			errorMessage: 'Invalid HTTP method. Only POST is allowed.',
		});
		return;
	}

	try {
		await renewExpiringWatches();
		res.status(StatusCodes.OK).send({
			data: {},
			message: ReasonPhrases.OK,
		});
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			error: ReasonPhrases.INTERNAL_SERVER_ERROR,
			errorMessage: `Error renewing watch data:\n ${error}`,
		});
	}
};

export const watchEnable = async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.status(StatusCodes.NO_CONTENT).send({
			data: {},
			message: ReasonPhrases.NO_CONTENT,
		});
		return;
	}

	if (req.method !== 'POST') {
		res.status(StatusCodes.METHOD_NOT_ALLOWED).send({
			error: ReasonPhrases.METHOD_NOT_ALLOWED,
			errorMessage: 'Invalid HTTP method. Only POST is allowed.',
		});
		return;
	}

	// Check if the body is valid
	if (!req.body || !req.body.historyId || !req.body.expiration || !req.body.userId) {
		res.status(StatusCodes.BAD_REQUEST).send({
			error: ReasonPhrases.BAD_REQUEST,
			errorMessage: 'Missing historyId, expiration or userId in body.',
		});
		return;
	}

	const { historyId, expiration, userId } = req.body;

	try {
		// Read the current document to get the old historyId
		const userData = await readDocument('users', userId);
		const oldHistoryId = userData?.watch?.historyId || '';

		// Update the document with the new historyId
		await updateDocument('users', userId, {
			'watch.historyId': historyId,
			'watch.expiration': Timestamp.fromMillis(expiration),
			'watch.enabled': true,
		});
		res.status(StatusCodes.OK).send({
			data: { oldHistoryId },
			message: ReasonPhrases.OK,
		});
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			error: ReasonPhrases.INTERNAL_SERVER_ERROR,
			errorMessage: `Error updating watch data: ${error}`,
		});
	}
};

export const watchDisable = async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.status(StatusCodes.NO_CONTENT).send({
			data: {},
			message: ReasonPhrases.NO_CONTENT,
		});
		return;
	}

	if (req.method !== 'POST') {
		res.status(StatusCodes.METHOD_NOT_ALLOWED).send({
			error: ReasonPhrases.METHOD_NOT_ALLOWED,
			errorMessage: 'Invalid HTTP method. Only POST is allowed.',
		});
		return;
	}

	// Check if the body is valid
	if (!req.body || !req.body.userId) {
		res.status(StatusCodes.BAD_REQUEST).send({
			error: ReasonPhrases.BAD_REQUEST,
			errorMessage: 'Missing userId in body.',
		});
		return;
	}

	const { userId } = req.body;

	try {
		await updateDocument('users', userId, {
			'watch.enabled': false,
		});

		res.status(StatusCodes.OK).send({
			data: {},
			message: ReasonPhrases.OK,
		});
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			error: ReasonPhrases.INTERNAL_SERVER_ERROR,
			errorMessage: `Error updating watch data: ${error}`,
		});
	}
};

export const authUrl = async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	// Http request handling
	if (req.method === 'OPTIONS') {
		res.status(StatusCodes.NO_CONTENT).send({
			data: {},
			message: ReasonPhrases.NO_CONTENT,
		});
		return;
	}

	if (req.method !== 'POST') {
		res.status(StatusCodes.METHOD_NOT_ALLOWED).send({
			error: ReasonPhrases.METHOD_NOT_ALLOWED,
			errorMessage: 'Invalid HTTP method. Only POST is allowed.',
		});
		return;
	}

	// Check if the payload is valid
	if (!req.body || !req.body.scopes) {
		res.status(StatusCodes.BAD_REQUEST).send({
			error: ReasonPhrases.BAD_REQUEST,
			errorMessage: 'Missing scopes in payload.',
		});
		return;
	}

	const scopes = req.body.scopes;

	// Get the oAuth2Client;

	const oAuth2Client = getOAuthClient();

	// Generate the auth URL with the given scopes
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		prompt: 'consent',
		include_granted_scopes: true,
		scope: scopes,
		state: req.body.state ? JSON.stringify(req.body.state) : undefined,
	});

	res.status(StatusCodes.OK).send({
		data: { url: authUrl },
		message: ReasonPhrases.OK,
	});
};

export const authToken = async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	// Http request handling
	if (req.method === 'OPTIONS') {
		res.status(StatusCodes.NO_CONTENT).send({
			data: {},
			message: ReasonPhrases.NO_CONTENT,
		});
		return;
	}

	if (req.method !== 'POST') {
		res.status(StatusCodes.METHOD_NOT_ALLOWED).send({
			error: ReasonPhrases.METHOD_NOT_ALLOWED,
			errorMessage: 'Invalid HTTP method. Only POST is allowed.',
		});
		return;
	}

	// Check if the payload is valid
	if (!req.body || !req.body.code) {
		res.status(StatusCodes.BAD_REQUEST).send({
			error: ReasonPhrases.BAD_REQUEST,
			errorMessage: 'Missing code in body',
		});
		return;
	}

	const { code } = req.body;

	try {
		const { tokens, userId } = await validateCode(code);
		res.status(StatusCodes.OK).send({
			data: { tokens, userId },
			message: ReasonPhrases.OK,
		});
	} catch (error) {
		res.status(StatusCodes.BAD_REQUEST).send({
			error: ReasonPhrases.BAD_REQUEST,
			errorMessage: error.message,
		});
	}
};

export const watchStatus = async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.status(StatusCodes.NO_CONTENT).send({
			data: {},
			message: ReasonPhrases.NO_CONTENT,
		});
		return;
	}

	if (req.method !== 'GET') {
		res.status(StatusCodes.METHOD_NOT_ALLOWED).send({
			error: ReasonPhrases.METHOD_NOT_ALLOWED,
			errorMessage: 'Invalid HTTP method. Only GET is allowed.',
		});
		return;
	}

	const { userId } = req.query;

	if (!userId) {
		return res.status(StatusCodes.BAD_REQUEST).send({
			error: 'Missing required field: userId',
			code: StatusCodes.BAD_REQUEST,
		});
	}

	try {
		const userData = await readDocument('users', userId);

		if (!userData?.watch) {
			return res.status(StatusCodes.NOT_FOUND).send({
				error: 'Watch data not found',
				code: StatusCodes.NOT_FOUND,
			});
		}

		res.status(StatusCodes.OK).send({
			data: userData.watch.enabled,
			message: ReasonPhrases.OK,
		});
	} catch (error) {
		console.error('Error getting watch status:', error);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			error: ReasonPhrases.INTERNAL_SERVER_ERROR,
			errorMessage: `Error getting watch status:\n ${error}`,
		});
	}
};

export const macroCreate = async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	// Http request handling
	if (req.method === 'OPTIONS') {
		return res.status(StatusCodes.NO_CONTENT).send({
			data: {},
			message: ReasonPhrases.NO_CONTENT,
		});
	}

	if (req.method !== 'POST') {
		return res.status(StatusCodes.METHOD_NOT_ALLOWED).send({
			error: ReasonPhrases.METHOD_NOT_ALLOWED,
			errorMessage: 'Invalid HTTP method. Only POST is allowed.',
		});
	}

	console.log(req.body);
	const { userId, name, labels, actionType, service, remainder } = req.body;

	if (!userId || !name || !labels || !actionType || !service || !remainder) {
		return res.status(StatusCodes.BAD_REQUEST).send({
			error: ReasonPhrases.BAD_REQUEST,
			errorMessage: 'Missing required fields',
		});
	}

	try {
		const action = getAction(actionType, service, remainder);

		await createMacro(userId, name, labels, action);

		res.status(StatusCodes.OK).send({
			data: {},
			message: ReasonPhrases.OK,
		});
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			error: ReasonPhrases.INTERNAL_SERVER_ERROR,
			errorMessage: `Error creating macro:\n ${error}`,
		});
	}
};

export const macroGet = async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		return res.status(StatusCodes.NO_CONTENT).send({
			data: {},
			message: ReasonPhrases.NO_CONTENT,
		});
	}

	if (req.method !== 'GET') {
		return res.status(StatusCodes.METHOD_NOT_ALLOWED).send({
			error: ReasonPhrases.METHOD_NOT_ALLOWED,
			errorMessage: 'Invalid HTTP method. Only GET is allowed.',
		});
	}

	const { userId, name } = req.query;

	if (!userId || !name) {
		return res.status(StatusCodes.BAD_REQUEST).send({
			error: ReasonPhrases.BAD_REQUEST,
			errorMessage: 'Missing userId or name in body',
		});
	}

	try {
		const macro = await getMacro(userId, name);

		if (!macro) {
			return res.status(StatusCodes.NOT_FOUND).send({
				error: ReasonPhrases.NOT_FOUND,
				errorMessage: 'Macro data not found',
			});
		}

		res.status(StatusCodes.OK).send({
			data: { macro },
			message: ReasonPhrases.OK,
		});
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			error: ReasonPhrases.INTERNAL_SERVER_ERROR,
			errorMessage: `Error getting macro:\n ${error}`,
		});
	}
};

export const macroGetAll = async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		return res.status(StatusCodes.NO_CONTENT).send({
			data: {},
			message: ReasonPhrases.NO_CONTENT,
		});
	}

	if (req.method !== 'GET') {
		return res.status(StatusCodes.METHOD_NOT_ALLOWED).send({
			error: ReasonPhrases.METHOD_NOT_ALLOWED,
			errorMessage: 'Invalid HTTP method. Only GET is allowed.',
		});
	}

	const { userId } = req.query;

	if (!userId) {
		return res.status(StatusCodes.BAD_REQUEST).send({
			error: ReasonPhrases.BAD_REQUEST,
			errorMessage: 'Missing required field: userId',
		});
	}

	try {
		const macros = await getAllMacros(userId);

		if (!macros) {
			return res.status(StatusCodes.NOT_FOUND).send({
				error: ReasonPhrases.NOT_FOUND,
				errorMessage: 'Macros data not found',
			});
		}

		res.status(StatusCodes.OK).send({
			data: { macros },
			message: ReasonPhrases.OK,
		});
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			error: ReasonPhrases.INTERNAL_SERVER_ERROR,
			errorMessage: `Error getting all macros:\n ${error}`,
		});
	}
};

export const macroGetAllFiltered = async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		return res.status(StatusCodes.NO_CONTENT).send({
			data: {},
			message: ReasonPhrases.NO_CONTENT,
		});
	}

	if (req.method !== 'GET') {
		return res.status(StatusCodes.METHOD_NOT_ALLOWED).send({
			error: ReasonPhrases.METHOD_NOT_ALLOWED,
			errorMessage: 'Invalid HTTP method. Only GET is allowed.',
		});
	}

	const { userId, labelIds } = req.query;

	if (!userId) {
		return res.status(StatusCodes.BAD_REQUEST).send({
			error: ReasonPhrases.BAD_REQUEST,
			errorMessage: 'Missing required field: userId',
		});
	}

	if (!labelIds) {
		return res.status(StatusCodes.BAD_REQUEST).send({
			error: ReasonPhrases.BAD_REQUEST,
			errorMessage: 'Missing required field: labelIds',
		});
	}

	try {
		const labelIdsArray = labelIds.split(',');
		const macros = await getAllMacrosWithLabels(userId, labelIdsArray);

		if (!macros) {
			return res.status(StatusCodes.NOT_FOUND).send({
				error: ReasonPhrases.NOT_FOUND,
				errorMessage: 'Filtered macros data not found',
			});
		}

		res.status(StatusCodes.OK).send({
			data: { macros },
			message: ReasonPhrases.OK,
		});
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			error: ReasonPhrases.INTERNAL_SERVER_ERROR,
			errorMessage: `Error getting all filtered macros:\n ${error}`,
		});
	}
};

export const newMessage = async (pubSubEvent, _context) => {
	try {
		const message = JSON.parse(Buffer.from(pubSubEvent.data.message.data, 'base64').toString());
		const { emailAddress, historyId } = message;

		if (!emailAddress || !historyId) {
			throw new Error('Missing required fields: emailAddress and historyId');
		}

		const userRecord = await firebaseAuth.getUserByEmail(emailAddress);
		const docData = await readDocument('users', userRecord.uid);

		const oAuth2Client = getOAuthClient();
		oAuth2Client.setCredentials({ refresh_token: docData.refresh_token });

		const newTokens = await new Promise((resolve, reject) => {
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

		oAuth2Client.setCredentials(newTokens);

		const [_updatedDoc, messages] = await Promise.all([
			updateDocument('users', userRecord.uid, {
				'watch.historyId': historyId,
			}),
			getHistoryListSince(oAuth2Client, docData.watch.historyId),
		]);

		for (const message of messages) {
			manageMessage(message, userRecord.uid, oAuth2Client);
		}

		console.log(`Successfully processed messages for ${emailAddress}`);
		return { data: {}, message: ReasonPhrases.OK };
	} catch (error) {
		console.error('Error processing Pub/Sub message:', error);
		return {
			error: `Error processing Pub/Sub message:', ${error}`,
			errorMessage: ReasonPhrases.INTERNAL_SERVER_ERROR,
		};
	}
};

functions.http('watchRenew', watchRenew);
functions.http('watchEnable', watchEnable);
functions.http('watchDisable', watchDisable);
functions.http('watchStatus', watchStatus);

functions.http('authUrl', authUrl);
functions.http('authToken', authToken);

functions.http('macroCreate', macroCreate);
functions.http('macroGet', macroGet);
functions.http('macroGetAll', macroGetAll);
functions.http('macroGetAllFiltered', macroGetAllFiltered);

functions.cloudEvent('newMessage', newMessage);
