import { PubSub } from '@google-cloud/pubsub';

import { environment } from './private/enviroment.js';
process.noDeprecation = true;

const pubsub = new PubSub({
	projectId: environment.googleProjectConfig.projectName,
	keyFilename: './private/service_accounts/pub-sub-listener.json'
});
const subscription = pubsub.subscription(environment.googleProjectConfig.suscriptionName);

console.log('Listening to the topic...');
subscription.on('message', (message) => {
	console.log('    Received message: ', message.data.toString());
	message.ack();
});

subscription.on('error', (error) => {
	console.error('    Received error:', error);
});
