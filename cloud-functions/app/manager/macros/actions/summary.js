import { clearMarkdown, summaryModel } from '../../llm/google.js';
import { uploadHtmlDoc } from './services/google-drive.js';

export async function manageSummary(summary, message, oAuth2Client) {
	console.log('Summary:\n', summary);

	// Determine and decode the HTML content from the message payload
	let encodedHtmlContent = null;
	if (message.payload.parts[0]?.parts) {
		encodedHtmlContent = message.payload.parts[0].parts[1].body.data;
	} else if (message.payload.parts[1]) {
		encodedHtmlContent = message.payload.parts[1].body.data;
	} else {
		throw new Error('Unable to determine the correct payload for HTML content.');
	}

	const decodedHtmlData = Buffer.from(encodedHtmlContent, 'base64').toString('utf8');

	const output = await summaryModel.generateContent(decodedHtmlData);

	const resposeHtmlData = output.response.text();
	const rawData = clearMarkdown(resposeHtmlData);

	// Check if google-drive array is empty
	const googleDriveFolders = summary['google-drive'];

	if (!googleDriveFolders || googleDriveFolders.length === 0) {
		// No parent specified, upload file once to the default location
		await uploadHtmlDoc(`Summary_${message.id}`, rawData, oAuth2Client);
	} else {
		// For each folder, upload a file with the folder as parent
		const promises = googleDriveFolders.map((folder) =>
			uploadHtmlDoc(`Summary_${message.id}`, rawData, oAuth2Client, folder.id),
		);
		await Promise.allSettled(promises);
	}
}
