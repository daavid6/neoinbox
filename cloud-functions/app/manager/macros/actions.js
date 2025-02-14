export const ActionType = Object.freeze({
	Attachment: 'attachment',
	Content: 'content',
	Summary: 'summary',
	Dates: 'dates',
});

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
