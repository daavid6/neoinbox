import admin from 'firebase-admin';

import serviceAccount from '../../private/service_accounts/firebase-adminsdk.json' with { type: 'json' };

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const firebaseAuth = admin.auth();

export { db, firebaseAuth };
