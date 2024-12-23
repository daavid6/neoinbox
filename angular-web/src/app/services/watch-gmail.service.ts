import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { firstValueFrom } from 'rxjs/internal/firstValueFrom';

import { environment } from '../private/enviroments/enviroment';
import { AuthService } from './auth.service';

declare const gapi: any;

@Injectable({
	providedIn: 'root',
})
export class WatchGmailService {
	private isGapiInitialized: boolean = false;
	private endpointUrl = 'http://localhost:3000';

	constructor(private authService: AuthService, private http: HttpClient) {
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

		if (res.result.historyId) {
			await this.updateWatchData(
				res.result.historyId,
				res.result.expiration,
				true
			);
		}

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

		if (res.status === 204) {
			await this.updateWatchData('', 0, false);
		}

		console.log('Response:', res);
	}

	private async updateWatchData(
		historyId: string,
		expiration: number,
		beingEnable: boolean
	): Promise<string> {
		const userId = this.authService.getCurrentUserId();

		if (!userId) throw new Error('User not authenticated');

		let oldHistoryId = '';

		if (beingEnable) {
			oldHistoryId = await firstValueFrom(
				this.http.post<string>(
					`${this.endpointUrl}/api/watch/enable`,
					{
						historyId,
						expiration,
						userId,
					}
				)
			);
		} else {
			await firstValueFrom(
				this.http.post(`${this.endpointUrl}/api/watch/disable`, {
					userId,
				})
			);
		}

		return oldHistoryId;
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
