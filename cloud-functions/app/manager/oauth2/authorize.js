import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

import fs from 'fs';
import path from 'path'
import readline from 'readline';
import open from 'open'; //To open the link to authoritation
import dotenv from 'dotenv';
dotenv.config({path: '../../../.env'});

import oAuthClientCredentials from '../../private/service_accounts/gmail-watch-client-oauth.json' with { type: "json" };
const OAUTH_CREDENTIAL_DIR = './app/private/watch-token';

/**
 * Generates a new OAuth2 token for the given OAuth2 client.
 * 
 * This function generates an authorization URL, opens it in the default browser,
 * and prompts the user to enter the authorization code from the browser. It then
 * exchanges the authorization code for an access token and saves it to a file.
 * 
 * @param {OAuth2Client} oAuth2Client - The OAuth2 client to get the token for.
 * @returns {Promise<OAuth2Client>} A promise that resolves with the OAuth2 client
 *                                  with the new token set.
 * @throws Will throw an error if there is an issue retrieving the access token.
 */
export function getNewToken() {
  const { client_secret, client_id, redirect_uris } = oAuthClientCredentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
	  	'https://www.googleapis.com/auth/gmail.readonly', 
      	'https://www.googleapis.com/auth/userinfo.email',
    ]
  })

  open(authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      const decodedCode = decodeURIComponent(code);
      oAuth2Client.getToken(decodedCode, async (err, token) => {
        if (err) {
          console.error('Error retrieving access token', err);
          reject(err);
        } else {
          oAuth2Client.setCredentials(token);
          const userInfo = await getUserInfo(oAuth2Client);
          const userEmail = userInfo.email; // We could better use the id. I keep the email to simplify debugging process
          const userTokenPath = path.join(OAUTH_CREDENTIAL_DIR, `${userEmail}_token.json`);
          fs.writeFileSync(userTokenPath, JSON.stringify(token));
          resolve(oAuth2Client);
        }
      });
    });
  });
}

export function getNewTokenByCode(code) {
	const { client_secret, client_id, redirect_uris } = oAuthClientCredentials.web;
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[1]);
	const decodedCode = decodeURIComponent(code);

return new Promise((resolve, reject) => {
    oAuth2Client.getToken(decodedCode, async (err, token) => {
      if (err) {
        console.error('Error retrieving access token', err);
        reject(err);
      } else {
        try {
          oAuth2Client.setCredentials(token);
          const userInfo = await getUserInfo(oAuth2Client);
          const userEmail = userInfo.email;
          const userTokenPath = path.join(OAUTH_CREDENTIAL_DIR, `${userEmail}_token.json`);
          fs.writeFileSync(userTokenPath, JSON.stringify(token));
          resolve(token); // Return the token instead of oAuth2Client
        } catch (error) {
          reject(error);
        }
      }
    });
  });
}


export async function refreshToken() {
	const { client_secret, client_id, redirect_uris } = oAuthClientCredentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const userId = oAuth2Client._clientId
const userInfo = await getUserInfo(oAuth2Client);
const userEmail = userInfo.email; // We could better use the id. I keep the email to simplify debugging process
	const userTokenPath = path.join(OAUTH_CREDENTIAL_DIR, `${userEmail}_token.json`);
	const tokenStoragePath = path.join(OAUTH_CREDENTIAL_DIR, userTokenPath)

  // Check if we have previously stored a token.
  if (!fs.existsSync(tokenStoragePath)) return null

  const token = JSON.parse(fs.readFileSync(tokenStoragePath));
  oAuth2Client.setCredentials(token);

  if (oAuth2Client.isTokenExpiring()) {
    try {
      const newToken = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(newToken.credentials);
      fs.writeFileSync(tokenStoragePath, JSON.stringify(newToken.credentials));
      console.log('Token refreshed and stored to', tokenStoragePath);
    } catch (err) {
      console.error('Error refreshing access token', err);
      return null
    }
  }

  return oAuth2Client;

}

/**
 * Retrieves the user's profile information.
 * 
 * @param {OAuth2Client} oAuth2Client - The OAuth2 client with the user's credentials.
 * @returns {Promise<Object>} A promise that resolves with the user's profile information.
 */
export async function getUserInfo(oAuth2Client) {
  const oauth2 = google.oauth2({
    auth: oAuth2Client,
    version: 'v2',
  });
  const res = await oauth2.userinfo.get();
  return res.data;
}