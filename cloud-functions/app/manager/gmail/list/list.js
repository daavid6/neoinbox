import { google } from 'googleapis';

export async function getHistoryListSince(oAuth2Client, startHistoryId) {
	const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

	try {
		const res = await gmail.users.history.list({
			userId: 'me',
			startHistoryId,
			maxResults: 100,
			historyTypes: ['messageAdded'],
		});

		if (!res || !res.data) {
			throw new Error('No response data received from Gmail history list.');
		}

		const histories = res?.data?.history || [];
		if (histories.length === 0) return [];

		// Extract all valid partial messages using flatMap
		const partialMessages = histories.flatMap(
			(history) => history.messagesAdded?.map((msg) => msg.message) || [],
		);

		if (partialMessages.length === 0) {
			console.log('No valid messages found in history, returning empty array.');
			return [];
		}

		console.log('Partial Messages:', partialMessages);

		const messagesPromises = partialMessages.map(async (partialMessage) => {
			const res = await gmail.users.messages.get({
				userId: 'me',
				id: partialMessage.id,
				format: 'full',
			});
			return res.data;
		});

		const messages = await Promise.all(messagesPromises);
		return messages.filter((msg) => msg !== null);
	} catch (error) {
		console.error('Error fetching messages:', error);
		throw error;
	}
}
