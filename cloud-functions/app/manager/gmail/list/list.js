import { google } from 'googleapis';

export async function getHistoryListSince(oAuth2Client, startHistoryId) {
	const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

	try {
		const res = await gmail.users.messages.list({
			userId: 'me',
			startHistoryId,
			maxResults: 1,
			historyTypes: ['messageAdded'],
		});

		if (!res.data.messages) {
			console.log('No messages found');
			return [];
		}

		for (const message of res.data.messages) {
			const msg = await gmail.users.messages.get({
				userId: 'me',
				id: message.id,
				format: 'metadata',
				metadataHeaders: ['Subject', 'From'],
			});

			const subject = msg.data.payload.headers?.find((h) => h.name === 'Subject')?.value;
			const from = msg.data.payload.headers?.find((h) => h.name === 'From')?.value;
			const to = msg.data.payload.headers?.find((h) => h.name === 'To')?.value;

			console.log('Message ID:', message.id);
			console.log('From:', from || 'No From');
			console.log('To:', to);
			console.log('Subject:', subject || 'No Subject');

			console.log('-----------------\n');
		}

		return res.data.messages;
	} catch (error) {
		console.error('Error fetching messages:', error);
		throw error;
	}
}
