import axios from 'axios';
import { environment } from '../../private/enviroment.js';
import { logger } from '../errors/logger.js';

/**
 * WhatsApp client for sending messages through the Meta WhatsApp Business API
 */
class WhatsAppClient {
	constructor() {
		this.apiUrl = 'https://graph.facebook.com/v22.0';
		this.phoneNumberId = environment.whatsappProjectConfig.numberId;
		this.accessToken = environment.whatsappProjectConfig.accessToken;
		this.allowedNumbers = environment.whatsappProjectConfig.allowedTestNumbers;

		if (!this.phoneNumberId || !this.accessToken) {
			logger.warn('WhatsApp API credentials are missing or incomplete');
		}
	}

	/**
	 * Send a text message to a WhatsApp number
	 *
	 * @param {string} to - Recipient phone number with country code (e.g. "15551234567")
	 * @param {string} text - Message text to send
	 * @returns {Promise<object>} API response
	 */
	async sendTextMessage(to, _text) {
		if (!this.isConfigured()) {
			throw new Error('WhatsApp API not properly configured');
		}

		try {
			const formattedNumber = this.formatPhoneNumber(to);

			const response = await axios({
				method: 'POST',
				url: `${this.apiUrl}/${this.phoneNumberId}/messages`,
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					messaging_product: 'whatsapp',
					to: formattedNumber,
					type: 'template',
					template: {
						name: 'hello_world',
						language: { code: 'es' },
					},
				}),
			});

			logger.info(`WhatsApp message sent to ${formattedNumber}`, {
				messageId: response.data?.messages?.[0]?.id,
			});
			return response.data;
		} catch (error) {
			logger.error('Failed to send WhatsApp message', error);
			throw new Error(
				`WhatsApp message failed: ${error.response?.data?.error?.message || error.message}`,
			);
		}
	}

	/**
	 * Format phone number to E.164 format required by WhatsApp API
	 *
	 * @param {string} phoneNumber - Phone number to format
	 * @returns {string} Formatted phone number
	 */
	formatPhoneNumber(phoneNumber) {
		// Remove any non-digit characters
		let formatted = phoneNumber.replace(/\D/g, '');

		// Ensure it has a country code
		if (!formatted.startsWith('34') && !formatted.startsWith('+34')) {
			formatted = '34' + formatted; // Default to ES if no country code
		}

		// Remove + if present
		formatted = formatted.replace(/^\+/, '');

		if (!this.allowedNumbers.includes(formatted)) {
			throw new Error('Number not include among the allowed numbers');
		}

		return formatted;
	}

	/**
	 * Check if the WhatsApp client is properly configured
	 *
	 * @returns {boolean} Whether client is configured
	 */
	isConfigured() {
		return Boolean(this.phoneNumberId && this.accessToken);
	}

	/**
	 * Send a verification code to a WhatsApp number
	 *
	 * @param {string} to - Recipient phone number with country code
	 * @param {string} verificationCode - Code to be sent
	 * @returns {Promise<object>} API response
	 */
	async sendVerificationCode(to, verificationCode) {
		if (!this.isConfigured()) {
			throw new Error('WhatsApp API not properly configured');
		}

		try {
			const formattedNumber = this.formatPhoneNumber(to);

			const response = await axios({
				url: `${this.apiUrl}/${this.phoneNumberId}/messages`,
				method: 'post',
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
				data: JSON.stringify({
					messaging_product: 'whatsapp',
					to: formattedNumber,
					type: 'template',
					template: {
						name: 'hello_world',
						language: { code: 'en_US' },
					},
				}),
			});

			// const response = await axios({
			// 	method: 'POST',
			// 	url: `${this.apiUrl}/${this.phoneNumberId}/messages`,
			// 	headers: {
			// 		Authorization: `Bearer ${this.accessToken}`,
			// 		'Content-Type': 'application/json',
			// 	},
			// 	data: JSON.stringify({
			// 		messaging_product: 'whatsapp',
			// 		to: formattedNumber,
			// 		type: 'text',
			// 		text: {
			// 			body: `Hola`,
			// 		},
			// 	}),
			// });

			logger.info(`WhatsApp verification code sent to ${formattedNumber}`, {
				messageId: response.data?.messages?.[0]?.id,
			});
			return response.data;
		} catch (error) {
			logger.error('Failed to send WhatsApp verification code', error);
			throw new Error(
				`WhatsApp verification failed: ${error.response?.data?.error?.message || error.message}`,
			);
		}
	}
}

// Create a singleton instance
export const whatsAppClient = new WhatsAppClient();

try {
	const response = await whatsAppClient.sendVerificationCode('+34681658781', 122156);
	console.log(response);
} catch (error) {
	console.log(error);
}
