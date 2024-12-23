import { PubSub } from '@google-cloud/pubsub';
import { projectName } from '../../constants/project.js';

/**
 * Creates a new Pub/Sub subscription if it does not already exist.
 *
 * @param {Topic} topic - The Pub/Sub topic object.
 * @param {string} subscriptionName - The name of the subscription to create.
 * @returns {Promise<Subscription>} - A promise that resolves to the subscription object.
 * @throws {Error} - If an error occurs while checking or creating the subscription.
 */
export async function createSubscription(topic, subscriptionName) {
	const pubsub = new PubSub({
		projectId: projectName,
		keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
	});

	try {
		const [subscription] = await pubsub.subscription(subscriptionName).get({ autoCreate: false });
		console.log(`Subscription ${subscription.name} already exists.`);
		return subscription;
	} catch (err) {
		if (err.code === 5) {
			const [subscription] = await topic.createSubscription(subscriptionName);
			console.log(`Subscription ${subscription.name} created.`);
			return subscription;
		}

		console.error('Error occurred while checking/creating subscription:', err);
		throw err;
	}
}
