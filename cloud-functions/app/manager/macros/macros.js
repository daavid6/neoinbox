import { db } from '../firestore/firebase.js';
import { DocumentNotFound, UnexpectedError } from '../errors/errors.js';
import { logger } from '../errors/logger.js';

export async function createMacro(user, name, labels, action) {
	if (!user || !name || !Array.isArray(labels) || !action) {
		throw new Error('Invalid input parameters');
	}

	try {
		return await db.runTransaction(async (transaction) => {
			// Create main macro document
			const userDocRef = db.collection('users').doc(user).collection('macros').doc();
			transaction.set(userDocRef, { name, action });

			// Create labels collection
			const labelsDocRef = userDocRef.collection('labels');

			// Create labels handling all label promises together
			await Promise.all(
				labels.map(async ({ name, id }) => {
					if (!name || !id) throw new Error('Invalid label format');
					const labelDocRef = labelsDocRef.doc();
					transaction.set(labelDocRef, { name, id });
				}),
			);

			return {
				id: userDocRef.id,
				data: { name, action, labels },
			};
		});
	} catch (error) {
		logger.error('Error creating macro: ', error);
		throw new UnexpectedError(`Error creating macro: ${error.message}`);
	}
}

export async function deleteMacro(userId, macroId) {
	if (!userId || !macroId) throw new Error('Invalid input parameters');

	const macroRef = db.collection('users').doc(userId).collection('macros').doc(macroId);

	try {
		db.recursiveDelete(macroRef);
	} catch (error) {
		logger.error('Error deleting macro: ', error);
		throw new UnexpectedError(`Error deleting macro: ${error.message}`);
	}
}

export async function getMacro(user, name) {
	const query = db.collection('users').doc(user).collection('macros').where('name', '==', name);

	try {
		const querySnapshot = await query.get();

		if (querySnapshot.empty) throw new DocumentNotFound();

		const doc = querySnapshot.docs[0];
		const labelsSnapshot = await doc.ref.collection('labels').get();
		const labels = labelsSnapshot.docs.map((labelDoc) => labelDoc.data());

		return {
			id: doc.id,
			data: {
				...doc.data(),
				labels,
			},
		};
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

export async function getAllMacros(user) {
	const collectionRef = db.collection('users').doc(user).collection('macros');

	try {
		const querySnapshot = await collectionRef.get();

		if (querySnapshot.empty) throw new DocumentNotFound();

		const macrosWithLabels = await Promise.all(
			querySnapshot.docs.map(async (doc) => {
				const labelsSnapshot = await doc.ref.collection('labels').get();
				const labels = labelsSnapshot.docs.map((labelDoc) => labelDoc.data());

				return {
					id: doc.id,
					data: {
						...doc.data(),
						labels,
					},
				};
			}),
		);

		return macrosWithLabels;
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

export async function getAllMacrosWithLabels(user, labelIds) {
	if (!Array.isArray(labelIds) || labelIds.length == 0)
		throw new Error('Invalid input parameters');

	const macrosRef = db.collection('users').doc(user).collection('macros');

	try {
		// Get all macros first
		const macrosSnapshot = await macrosRef.get();

		if (macrosSnapshot.empty) throw new DocumentNotFound();

		// Filter macros that have the specified label
		const matchingMacros = await Promise.all(
			macrosSnapshot.docs.map(async (macroDoc) => {
				const labelsSnapshot = await macroDoc.ref
					.collection('labels')
					.where('id', 'in', labelIds)
					.get();

				if (labelsSnapshot.empty) return null;

				return {
					id: macroDoc.id,
					data: macroDoc.data(),
				};
			}),
		);

		const filteredMacros = matchingMacros.filter((macro) => macro !== null);

		return filteredMacros;
	} catch (error) {
		switch (error.constructor) {
			case DocumentNotFound:
			case UnexpectedError:
				throw error;
			default:
				logger.error('Error getting macros with label: ', error);
				throw new UnexpectedError(`Error getting macros with label: ${error.message}`);
		}
	}
}

export function mergeMacrosActions(macrosArray) {
	const actionObject = {};

	macrosArray.forEach((macro) => {
		const action = macro.data.action;

		// Skip if action is empty or has no content
		if (!action || !action.content) return;

		// Initialize type if not exists
		if (!actionObject[action.type]) {
			actionObject[action.type] = {};
		}

		// Initialize service if not exists
		if (!actionObject[action.type][action.service]) {
			actionObject[action.type][action.service] = [];
		}

		// Add unique content items
		action.content.forEach((item) => {
			const isDuplicate = actionObject[action.type][action.service].some(
				(existing) => existing.id === item.id,
			);

			if (!isDuplicate) actionObject[action.type][action.service].push(item);
		});
	});

	return actionObject;
}
