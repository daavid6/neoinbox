import express from 'express';
import { google } from 'googleapis';

import { validateCode } from './manager/oauth2/authorize.js';
import oAuthClientCredentials from './private/service_accounts/gmail-watch-client-oauth.json' with { type: "json" };

const router = express.Router();
export default router;

router.get('/auth/google', (req, res) => {
	const { client_secret, client_id, redirect_uris } = oAuthClientCredentials.web;
	const oAuth2Client = new google.auth.OAuth2(
		client_id,
		client_secret,
		redirect_uris[1] //'http://localhost:4200/callback' // Angular app callback URL
	);

	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		prompt: 'consent',  // force the consent window
		scope: [
			'https://www.googleapis.com/auth/gmail.readonly',
			'https://www.googleapis.com/auth/userinfo.email',
		],
	});

	res.json({ url: authUrl });
});

router.post('/auth/token', async (req, res) => {
	const { code } = req.body;
	try {
		const tokens = await validateCode(code);
		res.json(tokens);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});
