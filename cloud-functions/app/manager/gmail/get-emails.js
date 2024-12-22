import { google } from 'googleapis';

import dotenv from 'dotenv';
dotenv.config();

export async function getLastEmail(oAuth2Client) {
	try {
		const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
		const res = await gmail.users.messages.list({
			userId: 'me',
			maxResults: 5,
		});

		const messages = res.data.messages;
		console.log(messages.map(msg => JSON.stringify(msg)));


		for (const message of messages) {
			const msg = await gmail.users.messages.get({
				userId: 'me',
				id: message.id,
			});
			console.log(`Subject: ${msg.data.payload.headers.find((header) => header.name === 'Subject').value}`);
		}
	} catch (error) {
		console.error('Error setting up Gmail watch:', error);
	}
}

export async function getMessage(oAuth2Client, messageId) {
	try {
		const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

		const res = await gmail.users.messages.list({
			userId: 'me',
			maxResults: 5,
		});

		const messages = res.data.messages;
		console.log(messages.map((msg) => JSON.stringify(msg)));

		for (const message of messages) {
			const msg = await gmail.users.messages.get({
				userId: 'me',
				id: message.id,
			});
			console.log(`Subject: ${msg.data.payload.headers.find((header) => header.name === 'Subject').value}`);
		}
	} catch (error) {
		console.error('Error setting up Gmail watch:', error);
	}
}
