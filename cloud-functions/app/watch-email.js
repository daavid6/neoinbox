import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
process.noDeprecation = true;

import { getNewToken, refreshToken } from './manager/oauth2/authorize.js';
import { watchGmail } from './manager/gmail/call-watch.js';

async function main() {
	try {
		const oAuth2Client = await refreshToken();
		await watchGmail(oAuth2Client);
	} catch (error) {
		console.error('Error:', error);
	}
}

main();
