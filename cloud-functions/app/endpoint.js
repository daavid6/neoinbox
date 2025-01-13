import express from 'express';
import { google } from 'googleapis';
import { Timestamp } from 'firebase-admin/firestore';

import { readDocument, updateDocument } from './manager/firestore/crud.js';
import { validateCode } from './manager/oauth2/authorize.js';
import { renewExpiringWatches } from './manager/gmail/renew-expiring-watches.js'

import oAuthClientCredentials from './private/service_accounts/gmail-watch-client-oauth.json' with { type: "json" };

const router = express.Router();
export default router;

router.get('/auth/google', (_req, res) => {
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
		const {token, userId} = await validateCode(code);
		res.json({ token, userId });
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

router.post('/watch/enable', async (req, res) => {
    const { historyId, expiration, userId } = req.body;
    
    try {        
        // Read the current document to get the old historyId
        const userData = await readDocument('users', userId);
        const oldHistoryId = userData?.watch?.historyId || '';
        
        // Update the document with the new historyId
        await updateDocument('users', userId, {
            'watch.historyId': historyId,
            'watch.expiration': Timestamp.fromMillis(expiration),
			'watch.enabled': true,
        });
        
        res.status(200).json({ oldHistoryId });
    } catch (error) {
        console.error('Error updating watch data:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/watch/disable', async (req, res) => {
    const { userId } = req.body;
    
    try {        
        await updateDocument('users', userId, {
            'watch.enabled': false,
        });
        
        res.status(200).json({ message: 'Watch disabled' });
    } catch (error) {
        console.error('Error updating watch data:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/watch/renew', async (_req, res) => {   
    try {        
        await renewExpiringWatches();
        res.status(200).json({ message: 'Watch renew' });
    } catch (error) {
        console.error('Error renewing watch data:', error);
        res.status(500).json({ error: error.message });
    }
});
