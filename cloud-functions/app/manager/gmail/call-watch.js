import { google } from 'googleapis';

import dotenv from 'dotenv';
dotenv.config();

import { environment } from '../../private/enviroment.js';

export async function watchGmail(oAuth2Client) {
	try {
		const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
		const res = await gmail.users.watch({
			userId: 'me',
			requestBody: {
				topicName: environment.googleProjectConfig.topicPath,
			},
		});
		console.log('Watch response:', res.data);
		return res.data.historyId;
	} catch (error) {
		console.error('Error setting up Gmail watch:', error);
	}
}

export async function unWatchGmail(oAuth2Client) {
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
