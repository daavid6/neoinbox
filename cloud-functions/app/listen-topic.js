import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
process.noDeprecation = true;

import { PubSub } from '@google-cloud/pubsub';

import { environment } from './private/enviroment.js';

const pubsub = new PubSub({ projectId: environment.googleProjectConfig.projectName });
const subscription = pubsub.subscription(environment.googleProjectConfig.suscriptionName);

console.log('Listening to the topic...');
subscription.on('message', (message) => {
	console.log('    Received message: ', message.data.toString());
	message.ack();
});

subscription.on('error', (error) => {
	console.error('    Received error:', error);
});
