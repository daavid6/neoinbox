import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
process.noDeprecation = true;

import { PubSub } from '@google-cloud/pubsub';
import { projectName } from './constants/project.js';

const pubsub = new PubSub({
	projectId: projectName,
	keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

async function publishTestMessage() {
	const topic = pubsub.topic('temazo');

	try {
		const [messageId] = await topic.publishMessage({ data: Buffer.from('Test message!') });
		console.log(`Message ${messageId} published.`);
	} catch (error) {
		console.error('Error publishing message:', error);
	}
}

publishTestMessage();
