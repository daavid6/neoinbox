import { Timestamp } from 'firebase-admin/firestore';

import { checkExpiringWatches } from './manager/firestore/crud.js';
import { refreshAllTokens } from './manager/oauth2/authorize.js';
import { renewWatches } from './manager/gmail/call-watch.js';
import { updateDocument } from './manager/firestore/crud.js';

async function main() {
	try {
		const ids = await checkExpiringWatches();
		const clients = await refreshAllTokens(ids);
		const results = await renewWatches(clients);

		const updatePromises = results.map(({ userId, historyId, expiration }) =>
			updateDocument('users', userId, {
				'watch.historyId': historyId,
				'watch.expiration': Timestamp.fromMillis(expiration),
			})
		);

		await Promise.all(updatePromises);
		console.log('Successfully updated watch data for', results.length, 'users');
	} catch (error) {
		console.error('Error in renew-watches:', error);
	}
}

main();
