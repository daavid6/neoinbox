import { PubSub } from '@google-cloud/pubsub';

/**
 * Creates a new Pub/Sub topic if it does not already exist.
 *
 * @param {string} projectId - The ID of the Google Cloud project.
 * @param {string} topicNameOrId - The name or ID of the topic to create.
 * @returns {Promise<Topic>} - A promise that resolves to the topic object.
 * @throws {Error} - If an error occurs while checking or creating the topic.
 */
export async function createTopic(projectId, topicNameOrId) {
	const pubsub = new PubSub({
		projectId,
		keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
	});

	try {
		const [topic] = await pubsub.topic(topicNameOrId).get({ autoCreate: false });
		console.log(`Topic ${topic.name} already exists.`);
		return topic;
	} catch (err) {
		if (err.code === 5) {
			const [topic] = await pubsub.createTopic(topicNameOrId);
			console.log(`Topic ${topic.name} created.`);
			return topic;
		}

		console.error('Error occurred while checking/creating topic:', err);
		throw err;
	}
}
