import * as functions from '@google-cloud/functions-framework';
import { ReasonPhrases, StatusCodes, getReasonPhrase } from 'http-status-codes';
import { Timestamp } from 'firebase-admin/firestore';
import { google } from 'googleapis';

import { readDocument, updateDocument } from './app/manager/firestore/crud.js';
import { renewExpiringWatches } from './app/renew-expiring-watches.js';
import { validateCode } from './app/manager/oauth2/authorize.js';

import oAuthClientCredentials from './app/private/service_accounts/gmail-watch-client-oauth.json' with { type: "json" };

export const watchRenew = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.status(204).send('');
		return;
	}

	try {
		await renewExpiringWatches();
		res.status(StatusCodes.OK).send({
			data: {},
			message: ReasonPhrases.OK,
		});
	} catch (error) {
		console.error('Error renewing watch data:', error);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
		});
	}
};

export const watchEnable = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.status(204).send('');
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

		res.status(200).json({ oldHistoryId });
	} catch (error) {
		console.error('Error updating watch data:', error);
		res.status(500).json({ error: error.message });
	}
};

export const watchDisable = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
		res.status(204).send('');
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
		console.error('Error updating watch data:', error);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
			error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
		});
	}
};

export const authGoogle = async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.status(204).send('');
		return;
	}

	const { client_secret, client_id, redirect_uris } = oAuthClientCredentials.web;
	const oAuth2Client = new google.auth.OAuth2(
		client_id,
		client_secret,
		redirect_uris[1] //'http://localhost:4200/callback' // Angular app callback URL
	);

	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		prompt: 'consent', // force the consent window
		scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.email'],
	});

	res.json({ url: authUrl });
};

export const authToken = async (req, res) => {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.status(204).send('');
		return;
	}

	const { code } = req.body;

	try {
		const {token, userId} = await validateCode(code);
		res.json({ token, userId });
	} catch (error) {
		res.status(StatusCodes.BAD_REQUEST).send({
			error: getReasonPhrase(StatusCodes.BAD_REQUEST),
		});
	}
};

functions.http('watchRenew', watchRenew);
functions.http('watchEnable', watchEnable);
functions.http('watchDisable', watchDisable);
functions.http('authGoogle', authGoogle);
functions.http('authToken', authToken);