import { checkExpiringWatches } from './manager/firestore/crud.js';

const ids = await checkExpiringWatches();

ids.forEach(id => {
	id
	;
});