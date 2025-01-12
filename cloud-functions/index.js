import * as functions from '@google-cloud/functions-framework';
import { ReasonPhrases, StatusCodes, getReasonPhrase } from 'http-status-codes';
import { Timestamp } from 'firebase-admin/firestore';

import { readDocument, updateDocument } from './app/manager/firestore/crud.js';
import { renewExpiringWatches } from './app/renew-expiring-watches.js';

export const watchRenew = async (_req, res) => {
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
	const { historyId, userId } = req.body;

	try {
		// Read the current document to get the old historyId
		const userData = await readDocument('users', userId);
		const oldHistoryId = userData?.watch?.historyId || '';

		// Update the document with the new historyId
		await updateDocument('users', userId, {
			'watch.historyId': historyId,
			'watch.enabled': false,
		});

		res.status(200).json({ oldHistoryId });
	} catch (error) {
		console.error('Error updating watch data:', error);
		res.status(500).json({ error: error.message });
	}
};

functions.http('watchRenew', watchRenew);
functions.http('watchEnable', watchEnable);
functions.http('watchDisable', watchDisable);