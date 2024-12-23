import { PubSub } from '@google-cloud/pubsub';

import { projectName } from './constants/project.js';
import { environment } from './private/enviroment.js';
process.noDeprecation = true;

const pubsub = new PubSub({
	projectId: projectName,
	keyFilename: './private/service_accounts/pub-sub-publisher.json',
});

async function publishTestMessage() {
	const topic = pubsub.topic(environment.googleProjectConfig.topicName);

	try {
		const [messageId] = await topic.publishMessage({ data: Buffer.from('Test message!') });
		console.log(`Message ${messageId} published.`);
	} catch (error) {
		console.error('Error publishing message:', error);
	}
}

publishTestMessage();
