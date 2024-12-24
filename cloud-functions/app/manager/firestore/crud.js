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
	const docIds = [];
	const nearExpiration = new Date(Date.now() + 1000000000);

	const snapshot = await db.collection('users').where('watch.expiration', '<=', nearExpiration).where('watch.enabled', '==', true).get();

	snapshot.forEach((doc) => {
		docIds.push(doc.id);
	});

	console.log(docIds);
	return docIds;
}
