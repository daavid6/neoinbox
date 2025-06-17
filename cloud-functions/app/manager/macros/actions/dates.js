import { datesModel } from '../../llm/google.js';
import { checkFreeBusy, getCalendarList } from '../../gcalendar/gcalendar.js';
import { findOrCreateLabel, addLabelToMessage } from '../../gmail/labels/labels.js';

export async function manageDates(dates, message, oAuth2Client) {
	console.log('Dates:\n', dates);

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

	const output = await datesModel.generateContent(decodedHtmlData);

	const rawData = JSON.parse(output.response.text());

	console.log('Respuesta:\n', rawData);

	if (!rawData?.length) return;

	const requestLabel = await findOrCreateLabel('GCalendar Request', {  backgroundColor: '#16a766', textColor: '#ffffff' }, oAuth2Client);
	const conflictLabel = await findOrCreateLabel('GCalendar Conflict', { backgroundColor: '#cc3a21', textColor: '#ffffff' }, oAuth2Client);

	console.log('Request Label:', requestLabel);
	console.log('Conflict Label:', conflictLabel);

	const fullItemList = await getCalendarList(oAuth2Client);
	let hasConflicts = false;

	for (let i = 0; i < rawData.length; i++) {
		const conflicts = await checkFreeBusy(rawData[i].start, rawData[i].end, 'UTC', fullItemList, oAuth2Client);

		if (conflicts.length) {
			console.log(`Conflicts found for meeting ${i} :`, conflicts);
			hasConflicts = true;
		} else {
			console.log('No conflicts found');
		}
	}

	if (hasConflicts) {
		await addLabelToMessage(message.id, conflictLabel, oAuth2Client);
		console.log('Label added to message due to conflicts:', conflictLabel);
	} else {await addLabelToMessage(message.id, requestLabel, oAuth2Client);
		console.log('Label added to message for request:', requestLabel);
	}
}
