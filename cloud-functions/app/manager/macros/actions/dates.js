import { datesModel } from '../../llm/google.js';
import { checkFreeBusy, getCalendarList } from '../../gcalendar/gcalendar.js';

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

	const fullItemList = await getCalendarList(oAuth2Client);

	for (let i = 0; i < rawData.length; i++) {
		const conflicts = await checkFreeBusy(
			rawData[i].start,
			rawData[i].end,
			'UTC',
			fullItemList,
			oAuth2Client,
		);

		conflicts.length
			? console.log(`Conflicts found for meeating ${i} :`, conflicts)
			: console.log('No more conflicts found');
	}
}
