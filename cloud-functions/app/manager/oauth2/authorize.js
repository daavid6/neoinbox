import { google } from 'googleapis';
import { Timestamp } from 'firebase-admin/firestore';
import { createRequire } from 'module';

import dotenv from 'dotenv';
dotenv.config({path: '../../../.env'});

import { createDocument, existsDoc, updateDocument } from '../firestore/crud.js'
import { firebaseAuth } from '../firestore/firebase.js';

const require = createRequire(import.meta.url);
const oAuthClientCredentials = require('../../private/service_accounts/gmail-watch-client-oauth.json');

const { client_secret, client_id, redirect_uris } = oAuthClientCredentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[1]);

async function exchangeCodeForToken(code) {
    return new Promise((resolve, reject) => {
        const decodedCode = decodeURIComponent(code);

        oAuth2Client.getToken(decodedCode, (err, token) => {
            if (err) {
                reject(err);
                return;
            }
            oAuth2Client.setCredentials(token);
            resolve(token);
        });
    });
}

async function getUserInfo(oAuth2Client) {
  const oauth2 = google.oauth2({
    auth: oAuth2Client,
    version: 'v2',
  });
  const res = await oauth2.userinfo.get();
  return res.data;
}

function formatUserData(userId, refresh_token) {
    return {
        userId,
        userData: {
			watch: {
            	historyId: '',
				expiration: Timestamp.fromMillis(Date.now()),
				enabled: false,
			},
            refresh_token: refresh_token,
        }
    };
}

async function getUserData(refresh_token) {
    const userInfo = await getUserInfo(oAuth2Client);

    try {
        const userRecord = await firebaseAuth.getUserByEmail(userInfo.email);
        return formatUserData(userRecord.uid, refresh_token);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            const newUser = await firebaseAuth.createUser({
                email: userInfo.email,
                displayName: userInfo.name,
                photoURL: userInfo.picture
            });

            return formatUserData(newUser.uid, refresh_token);
        }

        throw error;
    }
}

async function saveUserData(userId, userData) {
    if (existsDoc('users', userId)) {
		await createDocument('users', userId, userData);
    } else {
        await updateDocument('users', userId, userData);
	}
}

export async function validateCode(code) {
    try {
        const token = await exchangeCodeForToken(code);
        const { userId, userData } = await getUserData(token.refresh_token);
        await saveUserData(userId, userData);
        return {token, userId};
    } catch (error) {
        console.error('Error in validateCode:', error);
        throw error;
    }
}



async function refreshToken(refreshToken) {
	    const newOAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[1]);
    	newOAuth2Client.setCredentials({ refresh_token: refreshToken });
    
    try {
        const tokens = await new Promise((resolve, reject) => {
            newOAuth2Client.refreshAccessToken((err, tokens) => {
                if (err) reject(err);
                else resolve(tokens);
            });
        });
        
        newOAuth2Client.setCredentials(tokens);
        return newOAuth2Client;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error;
    }
}

export async function refreshAllTokens(ids) {
	const refreshPromises = ids.map(async (userInfo) => {
		try {
			const oAuth2Client = await refreshToken(userInfo.refresh_token);
            return {
                userId: userInfo.id,
                oAuth2Client
            };
		} catch (error) {
			console.error(`Failed to refresh token for user: ${userInfo.id}`, error);
			return null;
		}
	});


    const results = await Promise.all(refreshPromises);
    const successfulClients = results.filter(result => result !== null);

    console.log(`Refreshed ${successfulClients.length} out of ${ids.length} tokens`);
    return successfulClients;
}