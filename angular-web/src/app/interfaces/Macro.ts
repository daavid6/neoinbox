export interface Macro {
	id: string;
	data: {
		name: string;
		labels: [
			{
				id: string;
				name: string;
			},
		];
		action: {
			type: ACTION;
			service: ATTACHMENT | CONTENT | DATES | SUMMARY;
			content: [{ name: string; id: string }];
		};
	};
}

export enum ACTION {
	Attachment = 'attachment',
	Content = 'content',
	Summary = 'summary',
	Dates = 'dates',
}

export enum ATTACHMENT {
	GoogleDrive = 'google-drive',
	OneDrive = 'one-drive',
}

export enum SUMMARY {
	GoogleDrive = 'google-drive',
	OneDrive = 'one-drive',
}

export enum CONTENT {
	GoogleDrive = 'google-drive',
	OneDrive = 'one-drive',
}

export enum DATES {
	GoogleCalendar = 'google-drive',
	OutlookCalendar = 'outlook',
}
