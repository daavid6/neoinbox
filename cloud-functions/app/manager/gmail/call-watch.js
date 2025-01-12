import { google } from 'googleapis';
import { Timestamp } from 'firebase-admin/firestore';

import dotenv from 'dotenv';
dotenv.config();

import { environment } from '../../private/enviroment.js';

async function watchGmail(oAuth2Client) {
	try {
		const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
		const res = await gmail.users.watch({
			userId: 'me',
			requestBody: {
				topicName: environment.googleProjectConfig.topicPath,
			},
		});
		console.log('Watch response:', res.data);
		return res.data; // { historyId, expiration }
	} catch (error) {
		console.error('Error setting up Gmail watch:', error);
	}
}

async function unWatchGmail(oAuth2Client) {
	try {
		const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
		const res = await gmail.users.stop({
			userId: 'me',
			requestBody: {},
		});
		console.log('Response:', res.data);
	} catch (error) {
		console.error('Error stopping Gmail watch:', error);
	}
}

export async function renewAllWatches(clients) {
	try {
		const watchPromises = clients.map(async ({ userId, oAuth2Client }) => {
			try {
				const { historyId, expiration } = await watchGmail(oAuth2Client);
				return {
					docId: userId,
					data: {
						'watch.historyId': historyId,
						'watch.expiration': Timestamp.fromMillis(expiration),
						'watch.enabled': true,
					},
					success: true,
				};
			} catch (error) {
				console.error(`Failed to renew watch for user: ${userId}`, error);
				return { docId: userId, success: false, error };
			}
		});

		const results = await Promise.all(watchPromises);
		const successfulResults = results.filter((r) => r.success);

		// Return only the successful updates in the format needed for batchUpdateDocuments
		return successfulResults.map(({ docId, data }) => ({ docId, data }));
	} catch (error) {
		console.error('Error in renewWatches:', error);
		throw error;
	}
}
