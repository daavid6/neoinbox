import { Injectable } from '@angular/core';
import { environment } from '../private/enviroments/enviroment';
import { AuthService } from './auth.service';

declare const gapi: any;

@Injectable({
	providedIn: 'root',
})
export class WatchGmailService {
	private isGapiInitialized: boolean = false;

	constructor(private authService: AuthService) {
		this.authService.accessToken$.subscribe((token) => {
			if (token && !this.isGapiInitialized) {
				this.initializeGapiClient(token);
			}
		});
	}

	public async watchGmail() {
		if (!this.isGapiInitialized) {
			console.error('GAPI client not initialized');
			throw new Error('GAPI client not initialized');
		}

		const res = await gapi.client.gmail.users.watch({
			userId: 'me',
			resource: {
				topicName: environment.googleProjectConfig.topicPath,
			},
		});

		console.log('Watch response:', res);
	}

	public async unWatchGmail() {
		if (!this.isGapiInitialized) {
			console.error('GAPI client not initialized');
			throw new Error('GAPI client not initialized');
		}

		const res = await gapi.client.gmail.users.stop({
			userId: 'me',
			requestBody: {},
		});

		console.log('Response:', res);
	}

	private initializeGapiClient(token: string) {
		gapi.load('client', async () => {
			await gapi.client.init({
				apiKey: environment.gmailApiKey,
				discoveryDocs: [
					'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
				],
			});
			gapi.client.setToken({ access_token: token });
			this.isGapiInitialized = true;
		});
	}
}
