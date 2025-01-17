import { db } from './firebase.js';
import { logger } from '../errors/logger.js';
import { DocumentAlreadyExists, DocumentNotFound, UnexpectedError } from '../errors/errors.js';

/**
 * Creates a new document in the specified Firestore collection.
 *
 * @param {string} collection - The name of the Firestore collection.
 * @param {string} docId - The ID of the document to create.
 * @param {Object} data - The data to set in the document.
 * @throws {DocumentAlreadyExists} - If the document already exists.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
export async function createDocument(collection, docId, data) {
	try {
		const { doc, docRef } = await getDoc(collection, docId);

		if (doc.exists) throw new DocumentAlreadyExists();

		await docRef.set(data);
	} catch (error) {
		switch (error.constructor) {
			case DocumentAlreadyExists:
			case UnexpectedError:
				throw error;
			default:
				logger.error('Error creating document: ', error);
				throw new UnexpectedError(`Error creating document: ${error.message}`);
		}
	}
}

/**
 * Reads a document from the specified Firestore collection.
 *
 * @param {string} collection - The name of the Firestore collection.
 * @param {string} docId - The ID of the document to read.
 * @returns {Object} - The data of the document.
 * @throws {DocumentNotFound} - If the document is not found.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
export async function readDocument(collection, docId) {
	try {
		const { doc } = await getDoc(collection, docId);

		if (!doc.exists) throw new DocumentNotFound();

		return doc.data();
	} catch (error) {
		switch (error.constructor) {
			case DocumentNotFound:
			case UnexpectedError:
				throw error;
			default:
				logger.error('Error getting document: ', error);
				throw new UnexpectedError(`Error getting document: ${error.message}`);
		}
	}
}

/**
 * Updates a document in the specified Firestore collection.
 *
 * @param {string} collection - The name of the Firestore collection.
 * @param {string} docId - The ID of the document to update.
 * @param {Object} data - The data to update in the document.
 * @throws {DocumentNotFound} - If the document is not found.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
export async function updateDocument(collection, docId, data) {
	try {
		const docRef = getDocRef(collection, docId);
		await docRef.update(data);
		logger.info('Document successfully updated!');
	} catch (error) {
		if (error.code === 'not-found') {
			logger.error(`Document not found: ${collection}/${docId}`);
			throw new DocumentNotFound(`Document not found: ${collection}/${docId}`);
		} else {
			logger.error('Unexpected error during updateDocument:', error);
			throw new UnexpectedError(`Unexpected error during updateDocument: ${error.message}`);
		}
	}
}

/**
 * Batch updates multiple documents in the specified Firestore collection.
 *
 * @param {string} collection - The name of the Firestore collection.
 * @param {Array<{docId: string, data: Object}>} updates - An array of updates to apply.
 * @returns {number} - The number of documents updated.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
export async function batchUpdateDocuments(collection, updates) {
	try {
		const batch = db.batch();

		updates.forEach(({ docId, data }) => {
			const docRef = getDocRef(collection, docId);
			batch.update(docRef, data);
		});

		await batch.commit();
		return updates.length;
	} catch (error) {
		logger.error('Unexpected error during batchUpdateDocuments:', error);
		throw new UnexpectedError(`Unexpected error during batchUpdateDocuments: ${error.message}`);
	}
}

/**
 * Deletes a document from the specified Firestore collection.
 *
 * @param {string} collection - The name of the Firestore collection.
 * @param {string} docId - The ID of the document to delete.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
export async function deleteDocument(collection, docId) {
	try {
		const docRef = getDocRef(collection, docId);
		await docRef.delete();
		logger.info('Document successfully deleted!');
	} catch (error) {
		logger.error('Unexpected error during deleteDocument:', error);
		throw new UnexpectedError(`Unexpected error during deleteDocument: ${error.message}`);
	}
}

/**
 * Checks if a document exists in the specified Firestore collection.
 *
 * @param {string} collection - The name of the Firestore collection.
 * @param {string} docId - The ID of the document to check.
 * @returns {boolean} - True if the document exists, false otherwise.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
export async function existsDoc(collection, docId) {
	try {
		const { doc } = await getDoc(collection, docId);
		return doc.exists;
	} catch (error) {
		logger.error('Unexpected error during existsDoc:', error);
		throw new UnexpectedError(`Unexpected error during existsDoc: ${error.message}`);		
	}

}

/**
 * Checks for expiring watches in the 'users' collection.
 *
 * @returns {Array<{id: string, refresh_token: string}>} - An array of user IDs and refresh tokens.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
export async function checkExpiringWatches() {
	const queryInfo = [];
	const nearExpiration = new Date(Date.now() + 1000 * 60 * 60 * 24 * 8);

	try {
		const snapshot = await db.collection('users').select('refresh_token').where('watch.expiration', '<=', nearExpiration).where('watch.enabled', '==', true).get();

		snapshot.forEach((doc) => {
			queryInfo.push({
				id: doc.id,
				refresh_token: doc.data().refresh_token,
			});
		});

		logger.info(queryInfo);
		return queryInfo;	
	} catch (error) {
		switch (error.constructor) {
			case UnexpectedError:
				throw error;
			default:
				logger.error('Unexpected error during checkExpiringWatches:', error);
				throw new UnexpectedError(`Unexpected error during checkExpiringWatches: ${error.message}`);
		}		
	}
}

// Utils functions

/**
 * Gets a document reference from the specified Firestore collection.
 *
 * @param {string} collection - The name of the Firestore collection.
 * @param {string} docId - The ID of the document.
 * @returns {FirebaseFirestore.DocumentReference} - The document reference.
 */
function getDocRef(collection, docId) {
	return db.collection(collection).doc(docId);
}

/**
 * Gets a document and its reference from the specified Firestore collection.
 *
 * @param {string} collection - The name of the Firestore collection.
 * @param {string} docId - The ID of the document.
 * @returns {Promise<{docRef: FirebaseFirestore.DocumentReference, doc: FirebaseFirestore.DocumentSnapshot}>} - The document reference and snapshot.
 * @throws {UnexpectedError} - If an unexpected error occurs during the process.
 */
async function getDoc(collection, docId) {
	const docRef = getDocRef(collection, docId);

	try {
		const doc = await docRef.get();
		return { docRef, doc };
	} catch (error) {
		logger.error('Error getting document: ', error);
		throw new UnexpectedError(`Error getting document: ${error.message}`);
	}
}
