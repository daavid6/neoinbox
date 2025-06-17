import { db } from '../firestore/firebase.js';
import { createMacro, getMacro, getAllMacros, getAllMacrosWithLabels, deleteMacro } from './macros.js';
import { getAction } from './actions.js';
import { DocumentNotFound } from '../errors/errors.js';
import { ActionType } from './actions.js';

const TEST_USER = 'test_user';

/**
 * Generate `n` macros for a given user.
 * @returns {{ macros: Array, names: Array<string> }}
 */
function generateMacros(userId, n) {
	const macroParams = [];
	const names = [];

	for (let i = 0; i < n; i++) {
		const name = `macro_${Math.random().toString(36).substring(2, 15)}`;
		names.push(name);

		const labels = [
			{ name: `L${i + 1}`, id: `l${i + 1}` },
			{ name: `L${i + 2}`, id: `l${i + 2}` },
		];
		const action = getAction(Object.values(ActionType)[Math.floor(Math.random() * Object.keys(ActionType).length)], 'google-drive', [{ name: `C${i + 1}`, id: `${i + 1}` }]);

		macroParams.push({ userId, name, labels, action });
	}

	return { macroParams, names };
}

beforeEach(async () => {
	await db.recursiveDelete(db.collection('users').doc(TEST_USER));
});

afterAll(async () => {
	await db.recursiveDelete(db.collection('users').doc(TEST_USER));
});

describe('macros.js integration', () => {
	it('createMacro + getMacro round-trip', async () => {
		const { macroParams } = generateMacros(TEST_USER, 1);
		const { userId, name, labels, action } = macroParams[0];

		const created = await createMacro(userId, name, labels, action);
		expect(created.id).toBeDefined();
		expect(created.data.name).toBe(name);
		expect(created.data.labels).toEqual(expect.arrayContaining(labels));
		expect(created.data.action).toEqual(action);

		const fetched = await getMacro(TEST_USER, name);
		expect(fetched.id).toBe(created.id);
		expect(fetched.data.labels).toEqual(expect.arrayContaining(labels));
		expect(fetched.data.action).toEqual(action);
	});

	it('getAllMacros returns an array with our macro', async () => {
		const { macroParams, names } = generateMacros(TEST_USER, 3);

		const macros = macroParams.map(({ userId, name, labels, action }) => createMacro(userId, name, labels, action));
		await Promise.all(macros);

		const all = await getAllMacros(TEST_USER);
		expect(Array.isArray(all)).toBe(true);
		expect(all.length).toBe(3);
		expect(all.map((m) => m.data.name)).toEqual(expect.arrayContaining(names));
	});

	it('getAllMacrosWithLabels filters correctly', async () => {
		const { macroParams } = generateMacros(TEST_USER, 10);

		const promises = macroParams.map(({ userId, name, labels, action }) => createMacro(userId, name, labels, action));
		const macros = await Promise.all(promises);

		const filtered = await getAllMacrosWithLabels(TEST_USER, ['l2', 'l7']);
		expect(filtered.length).toBe(macros.filter((m) => m.data.labels.some((l) => l.id === 'l2' || l.id === 'l7')).length); // Each label is assigned to 2 macros
	});

	it('deleteMacro removes the document and getMacro then throws', async () => {
		const { macroParams, names } = generateMacros(TEST_USER, 1);

		const promises = macroParams.map(({ userId, name, labels, action }) => createMacro(userId, name, labels, action));
		const macros = await Promise.all(promises);

		const macroId = macros[0].id;

		await deleteMacro(TEST_USER, macroId);
		await expect(getMacro(TEST_USER, names[0])).rejects.toThrow(DocumentNotFound);
	});
});
