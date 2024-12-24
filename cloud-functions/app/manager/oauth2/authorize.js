import { google } from 'googleapis';
import { Timestamp } from 'firebase-admin/firestore';

import dotenv from 'dotenv';
dotenv.config({path: '../../../.env'});

import { createDocument, existsDoc, updateDocument } from '../firestore/crud.js'
import { firebaseAuth } from '../firestore/firebase.js';

import oAuthClientCredentials from '../../private/service_accounts/gmail-watch-client-oauth.json' with { type: "json" };

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

function formatUserData(userId, token) {
    return {
        userId,
        userData: {
			watch: {
            	historyId: '',
				expiration: Timestamp.fromMillis(Date.now()),
				enabled: false,
			},
            tokens: {
                access_token: token.access_token,
                refresh_token: token.refresh_token,
                expiry_date: Timestamp.fromMillis(token.expiry_date),
                id_token: token.id_token,
                scope: token.scope,
                token_type: token.token_type,
            }
        }
    };
}

async function getUserData(token) {
    const userInfo = await getUserInfo(oAuth2Client);

    try {
        const userRecord = await firebaseAuth.getUserByEmail(userInfo.email);
        return formatUserData(userRecord.uid, token);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            const newUser = await firebaseAuth.createUser({
                email: userInfo.email,
                displayName: userInfo.name,
                photoURL: userInfo.picture
            });

            return formatUserData(newUser.uid, token);
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
        const { userId, userData } = await getUserData(token);
        await saveUserData(userId, userData);
        return {token, userId};
    } catch (error) {
        console.error('Error in validateCode:', error);
        throw error;
    }
}
