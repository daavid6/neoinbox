import { google } from 'googleapis';

export async function getCalendarList(oAuth2Client) {
	const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
	const itemList = [];

	let pageToken = null;

	do {
		try {
			const res = await calendar.calendarList.list({ pageToken });

			if (res?.data?.items) itemList.push(...res.data.items);

			pageToken = res?.data?.nextPageToken || null;
		} catch (error) {
			console.error(`Error getting calendar list: ${error.message}`);
			return [];
		}
	} while (pageToken);

	return itemList;
}

export async function checkFreeBusy(timeMin, timeMax, timeZone, calendarIds, oAuth2Client) {
	const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

	const formattedCalendarIds = calendarIds.map((item) => ({ id: item.id }));
	const conflicts = [];


	try {
		const res = await calendar.freebusy.query({
			requestBody: {
				timeMin: timeMin,
				timeMax: timeMax,
				timeZone: timeZone,
				items: formattedCalendarIds,
			},
		});

		const calendarsArray = Object.values(res.data.calendars);
		const busyCalendarsArray = calendarsArray.filter((calendar) => calendar?.busy?.length > 0);
		busyCalendarsArray.forEach((item) => conflicts.push(...item.busy));
	} catch (error) {
		console.error(`${error}`);
	}

	return conflicts;
}
