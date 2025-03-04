import { manageAttachment } from './actions/attachment.js';
import { manageContent } from './actions/content.js';
import { manageSummary } from './actions/summary.js';
import { manageDates } from './actions/dates.js';

export const ActionType = Object.freeze({
	Attachment: 'attachment',
	Content: 'content',
	Summary: 'summary',
	Dates: 'dates',
});

// Action formating
export function getAction(actionType, service, remainder) {
	switch (actionType) {
		case ActionType.Attachment:
			return actionAttachment(service, remainder);
		case ActionType.Content:
			return actionContent(service, remainder);
		case ActionType.Summary:
			return actionSummary(service, remainder);
		case ActionType.Dates:
			return actionDates(service, remainder);
	}
}

function actionAttachment(service, remainder) {
	return {
		type: ActionType.Attachment,
		service: service,
		content: remainder,
	};
}

function actionContent(service, remainder) {
	return {
		type: ActionType.Content,
		service: service,
		content: remainder,
	};
}

function actionSummary(service, remainder) {
	return {
		type: ActionType.Summary,
		service: service,
		content: remainder,
	};
}

function actionDates(service, remainder) {
	return {
		type: ActionType.Dates,
		service: service,
		content: remainder,
	};
}

export async function executeActions(actions, message, oAuth2Client) {
	if (!actions || typeof actions !== 'object') return;

	const promises = [];

	if (actions[ActionType.Attachment]) {
		promises.push(manageAttachment(actions[ActionType.Attachment], message, oAuth2Client));
	}
	if (actions[ActionType.Content]) {
		promises.push(manageContent(actions[ActionType.Content], message, oAuth2Client));
	}
	if (actions[ActionType.Summary]) {
		promises.push(manageSummary(actions[ActionType.Summary], message, oAuth2Client));
	}
	if (actions[ActionType.Dates]) {
		promises.push(manageDates(actions[ActionType.Dates], message, oAuth2Client));
	}

	await Promise.all(promises);
}
