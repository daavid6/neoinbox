import { db } from './firebase.js';

export async function createDocument(collection, docId, data) {
	try {
		const docRef = db.collection(collection).doc(docId);
		const doc = await docRef.get();

		if (doc.exists) {
			console.log('Document already exists!');
			return null;
		}

		await docRef.set(data);
		return doc.data();
	} catch (error) {
		console.error('Error creating document: ', error);
		throw error;
	}
}

export async function readDocument(collection, docId) {
	try {
		const docRef = db.collection(collection).doc(docId);
		const doc = await docRef.get();
		if (!doc.exists) {
			console.log('No such document!');
			return null;
		} else {
			console.log('Document data:', doc.data());
			return doc.data();
		}
	} catch (error) {
		console.error('Error getting document: ', error);
		throw error;
	}
}

export async function updateDocument(collection, docId, data) {
	console.log('Entro updateDocument');

	try {
		const docRef = db.collection(collection).doc(docId);
		await docRef.update(data);
		console.log('Document successfully updated!');
	} catch (error) {
		console.error('Error updating document: ', error);
		throw error;
	}
}

export async function deleteDocument(collection, docId) {
	try {
		const docRef = db.collection(collection).doc(docId);
		await docRef.delete();
		console.log('Document successfully deleted!');
	} catch (error) {
		console.error('Error deleting document: ', error);
		throw error;
	}
}

export async function existsDoc(collection, docId) {
	const docRef = db.collection(collection).doc(docId);
	const doc = await docRef.get();

	return doc.exists;
}

export async function checkExpiringWatches() {
	const queryInfo = [];
	const nearExpiration = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10); // 2 remaining days

	const snapshot = await db.collection('users').select('tokens.refresh_token').where('watch.expiration', '<=', nearExpiration).where('watch.enabled', '==', true).get();

	snapshot.forEach((doc) => {
		queryInfo.push({
			id: doc.id,
			refresh_token: doc.data().tokens.refresh_token,
		});
	});

	console.log(queryInfo);
	return queryInfo;
}
