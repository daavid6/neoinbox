import { mergeMacrosActions, getAllMacrosWithLabels } from '../../macros/macros.js';
import { executeActions } from '../../macros/actions.js';

export async function manageMessage(message, userId, oAuth2Client) {
	const { labels } = extractInfoFromMessage(message);

	const triggeredMacros = await getAllMacrosWithLabels(userId, labels);
	console.log('TriggeredMacrosArray', JSON.stringify(triggeredMacros));

	const actions = mergeMacrosActions(triggeredMacros);
	console.log('Action', JSON.stringify(actions));

	executeActions(actions, message, oAuth2Client);
}

function extractInfoFromMessage(message) {
	const subject = message.payload.headers?.find((h) => h.name === 'Subject')?.value;
	const from = message.payload.headers?.find((h) => h.name === 'From')?.value;
	const to = message.payload.headers?.find((h) => h.name === 'To')?.value;
	const labels = message.labelIds;

	console.log('Payload:', JSON.stringify(message.payload));
	console.log('Message ID:', message.id);
	console.log('From:', from || 'No From');
	console.log('To:', to);
	console.log('Subject:', subject || 'No Subject');
	console.log('Labels:', labels.toLocaleString());

	return { subject, from, to, labels };
}
