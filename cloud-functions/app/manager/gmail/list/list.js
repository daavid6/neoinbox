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

		const partialMessages = res.data.messages;

		const messagesPromises = partialMessages.map(async (partialMessage) => {
			const res = await gmail.users.messages.get({
				userId: 'me',
				id: partialMessage.id,
				format: 'full',
			});
			return res.data;
		});

		const messages = await Promise.all(messagesPromises);

		return messages;
	} catch (error) {
		console.error('Error fetching messages:', error);
		throw error;
	}
}
