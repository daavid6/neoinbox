import { google } from 'googleapis';

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

export async function renewWatches(clients) {
	try {
		const watchPromises = clients.map(async ({ userId, oAuth2Client }) => {
			try {
				const { historyId, expiration } = await watchGmail(oAuth2Client);
				return { userId, historyId, expiration, success: true };
			} catch (error) {
				console.error(`Failed to renew watch for user: ${userId}`, error);
				return { userId, success: false, error };
			}
		});

		const results = await Promise.all(watchPromises);
		console.log(`Renewed ${results.filter((r) => r.success).length} watches`);

		return results.filter((r) => r.success);
	} catch (error) {
		console.error('Error in renewWatches:', error);
		throw error;
	}
}

