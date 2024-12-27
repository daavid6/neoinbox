import { batchUpdateDocuments, checkExpiringWatches } from './manager/firestore/crud.js';
import { refreshAllTokens } from './manager/oauth2/authorize.js';
import { renewWatches as renewAllWatches } from './manager/gmail/call-watch.js';

async function renewExpiringWatches() {
	try {
		const ids = await checkExpiringWatches();
		const clients = await refreshAllTokens(ids);
		const updates = await renewAllWatches(clients);
		const updated = await batchUpdateDocuments('users', updates);

		console.log('Successfully updated watch data for', updated, 'users');
	} catch (error) {
		console.error('Error in renew-watches:', error);
	}
}

renewExpiringWatches();
