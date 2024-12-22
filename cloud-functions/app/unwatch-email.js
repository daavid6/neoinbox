import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
process.noDeprecation = true;

import { getNewToken } from './manager/oauth2/authorize.js';
import { unWatchGmail } from './manager/gmail/call-watch.js';

async function main() {
	try {
		const oAuth2Client = await getNewToken();
		await unWatchGmail(oAuth2Client);
	} catch (error) {
		console.error('Error:', error);
	}
}

main();
