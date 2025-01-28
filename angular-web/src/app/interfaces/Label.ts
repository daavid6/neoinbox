export interface Label {
	id: string;
	name: string;
	messageListVisibility: MessageListVisibility;
	labelListVisibility: LabelListVisibility;
	type: Type;
	messagesTotal: number;
	messagesUnread: number;
	threadsTotal: number;
	threadsUnread: number;
	color?: {
		textColor: GmailColor;
		backgroundColor: GmailColor;
	};
}

export enum MessageListVisibility {
	SHOW = 'show', // Show the label in the message list
	HIDE = 'hide', // Do not show the label in the message list
}

export enum LabelListVisibility {
	SHOW = 'labelShow', // Show the label in the label list
	SHOW_IF_UNREAD = 'labelShowIfUnread', // Show the label if there are any unread messages
	HIDE = 'labelHide', // Do not show the label in the label list
}

export enum Type {
	SYSTEM = 'system', // Labels created by Gmail
	USER = 'user', // Custom labels created by the user or application
}

export type GmailColor = (typeof ALLOWED_COLORS)[number];

export const ALLOWED_COLORS = [
	'#000000',
	'#434343',
	'#666666',
	'#999999',
	'#cccccc',
	'#efefef',
	'#f3f3f3',
	'#ffffff',
	'#fb4c2f',
	'#ffad47',
	'#fad165',
	'#16a766',
	'#43d692',
	'#4a86e8',
	'#a479e2',
	'#f691b3',
	'#f6c5be',
	'#ffe6c7',
	'#fef1d1',
	'#b9e4d0',
	'#c6f3de',
	'#c9daf8',
	'#e4d7f5',
	'#fcdee8',
	'#efa093',
	'#ffd6a2',
	'#fce8b3',
	'#89d3b2',
	'#a0eac9',
	'#a4c2f4',
	'#d0bcf1',
	'#fbc8d9',
	'#e66550',
	'#ffbc6b',
	'#fcda83',
	'#44b984',
	'#68dfa9',
	'#6d9eeb',
	'#b694e8',
	'#f7a7c0',
	'#cc3a21',
	'#eaa041',
	'#f2c960',
	'#149e60',
	'#3dc789',
	'#3c78d8',
	'#8e63ce',
	'#e07798',
	'#ac2b16',
	'#cf8933',
	'#d5ae49',
	'#0b804b',
	'#2a9c68',
	'#285bac',
	'#653e9b',
	'#b65775',
	'#822111',
	'#a46a21',
	'#aa8831',
	'#076239',
	'#1a764d',
	'#1c4587',
	'#41236d',
	'#83334c',
	'#464646',
	'#e7e7e7',
	'#0d3472',
	'#b6cff5',
	'#0d3b44',
	'#98d7e4',
	'#3d188e',
	'#e3d7ff',
	'#711a36',
	'#fbd3e0',
	'#8a1c0a',
	'#f2b2a8',
	'#7a2e0b',
	'#ffc8af',
	'#7a4706',
	'#ffdeb5',
	'#594c05',
	'#fbe983',
	'#684e07',
	'#fdedc1',
	'#0b4f30',
	'#b3efd3',
	'#04502e',
	'#a2dcc1',
	'#c2c2c2',
	'#4986e7',
	'#2da2bb',
	'#b99aff',
	'#994a64',
	'#f691b2',
	'#ff7537',
	'#ffad46',
	'#662e37',
	'#ebdbde',
	'#cca6ac',
	'#094228',
	'#42d692',
	'#16a765',
] as const;
