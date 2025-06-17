import { google } from 'googleapis';

// Helper function to find or create a Gmail label
export async function findOrCreateLabel(name, color, oAuth2Client) {
	const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

	// First try to find the label
	const labelsResponse = await gmail.users.labels.list({ userId: 'me' });
	const existingLabel = labelsResponse.data.labels.find((label) => label.name === name);

	if (existingLabel) {
		return existingLabel.id;
	}

	console.log(`existingLabel "${existingLabel}" `);

	// Create the label if it doesn't exist
	const newLabel = await gmail.users.labels.create({
		userId: 'me',
		requestBody: {
			name: name,
			labelListVisibility: 'labelShow',
			messageListVisibility: 'show',
			color: color,
		},
	});

	console.log(`newLabel.data.id "${newLabel.data.id}" `);


	return newLabel.data.id;
}

// Helper function to add a label to a message
export async function addLabelToMessage(messageId, labelId, oAuth2Client) {
	const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

	await gmail.users.messages.modify({
		userId: 'me',
		id: messageId,
		requestBody: {
			addLabelIds: [labelId],
		},
	});

	console.log(`Label ${labelId} added to message ${messageId}`);
}