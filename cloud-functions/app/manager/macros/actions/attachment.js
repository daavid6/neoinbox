import { google } from 'googleapis';
import { Readable } from 'stream';

import { uploadAny } from './services/google-drive.js';

export async function manageAttachment(attachment, message, oAuth2Client) {
	console.log('Attachment:\n', attachment);

	const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

	// Check attachments in messagePayload.parts (if they exist)
	if (!message.payload.parts && !message.payload.parts.length) return;

	for (const part of message.payload.parts) {
		// Skip if part is not an attachment
		if (!part.filename) continue;

		let partBody = part.body;

		if (part.body.attachmentId) {
			const res = await gmail.users.messages.attachments.get({
				userId: 'me',
				messageId: message.id,
				id: part.body.attachmentId,
			});

			partBody = res.data;
		}

		const encodingType = part.headers[3].value;
		const mimeType = part.mimeType;

		const decodedData = Buffer.from(partBody.data, encodingType);
		const rawData = Readable.from(decodedData);

		// Check if google-drive array is empty
		const googleDriveFolders = attachment['google-drive'];

		if (!googleDriveFolders || googleDriveFolders.length === 0) {
			// No parent specified, upload file once to the default location
			await uploadAny(part.filename, rawData, mimeType, oAuth2Client);
		} else {
			// For each folder, upload a file with the folder as parent
			const promises = googleDriveFolders.map((folder) =>
				uploadAny(part.filename, rawData, mimeType, oAuth2Client, folder.id),
			);
			await Promise.allSettled(promises);
		}
	}
}
