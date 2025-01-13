import { batchUpdateDocuments, checkExpiringWatches } from '../firestore/crud.js';
import { refreshAllTokens } from '../oauth2/authorize.js';
import { renewAllWatches } from './call-watch.js';

export async function renewExpiringWatches() {
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