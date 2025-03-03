import { google } from 'googleapis';

/**
 * Generic function to upload a file to Google Drive.
 *
 * @param {Object} params - Parameters for file upload.
 * @param {string} params.fileName - The name of the file.
 * @param {string|Buffer|Stream} params.rawData - The file contents.
 * @param {string} params.driveMimeType - The target MIME type for the file in Drive.
 * @param {string} params.mediaMimeType - The MIME type of the raw file content.
 * @param {string|null} [params.parent=null] - (Optional) Parent folder ID.
 * @param {Object} oAuth2Client - Authorized OAuth2 client.
 * @returns {Promise<Object>} The created file's data.
 */
export async function uploadFile(
	{ fileName, rawData, driveMimeType, mediaMimeType, parent = null },
	oAuth2Client,
) {
	const drive = google.drive({ version: 'v3', auth: oAuth2Client });

	const fileMetadata = { name: fileName, mimeType: driveMimeType };
	if (parent) fileMetadata.parents = [parent];

	const media = { mimeType: mediaMimeType, body: rawData };

	try {
		const res = await drive.files.create({
			requestBody: fileMetadata,
			media: media,
			fields: 'id',
		});
		console.log('File created with ID:', res.data.id);
		return res.data;
	} catch (err) {
		console.error('Error uploading file:', err);
		throw err;
	}
}

/**
 * Upload any.
 */
export async function uploadAny(fileName, rawData, mimeType, oAuth2Client, parent) {
	return uploadFile(
		{
			fileName,
			rawData,
			driveMimeType: mimeType,
			mediaMimeType: mimeType,
			parent,
		},
		oAuth2Client,
	);
}

/**
 * Upload HTML content as a Google Doc.
 */
export async function uploadHtmlDoc(fileName, rawData, oAuth2Client, parent) {
	return uploadFile(
		{
			fileName,
			rawData,
			driveMimeType: 'application/vnd.google-apps.document',
			mediaMimeType: 'text/html',
			parent,
		},
		oAuth2Client,
	);
}
