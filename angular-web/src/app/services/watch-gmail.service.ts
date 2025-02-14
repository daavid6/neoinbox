import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { firstValueFrom } from 'rxjs/internal/firstValueFrom';

import { environment } from '../private/enviroments/enviroment';
import { AuthService } from './auth.service';
import { Label } from '../interfaces/Label';
import { ENDPOINTS } from '../enums/EndPoints';

declare const gapi: any;

@Injectable({
	providedIn: 'root',
})
export class WatchGmailService {
	private isGapiInitialized: boolean = false;

	constructor(
		private authService: AuthService,
		private http: HttpClient,
	) {
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
			await this.updateWatchData(res.result.historyId, res.result.expiration, true);
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

	public async isWatchEnabled(userId: string): Promise<boolean> {
		return await firstValueFrom(
			this.http.get<boolean>(`${ENDPOINTS.getWatchStatus}?userId=${userId}`),
		);
	}

	private async updateWatchData(
		historyId: string,
		expiration: number,
		beingEnable: boolean,
	): Promise<string> {
		const userId = this.authService.getCurrentUserId();

		if (!userId) throw new Error('User not authenticated');

		let oldHistoryId = '';

		if (beingEnable) {
			oldHistoryId = await firstValueFrom(
				this.http.post<string>(ENDPOINTS.enableWatch, {
					historyId: String(historyId),
					expiration,
					userId,
				}),
			);
		} else {
			await firstValueFrom(
				this.http.post(ENDPOINTS.disableWatch, {
					userId,
				}),
			);
		}

		return oldHistoryId;
	}

	private initializeGapiClient(token: string) {
		gapi.load('client', async () => {
			await gapi.client.init({
				apiKey: environment.gmailApiKey,
				discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
			});
			gapi.client.setToken({ access_token: token });
			this.isGapiInitialized = true;
		});
	}

	public async getLabels(): Promise<Label[] | null> {
		if (!this.isGapiInitialized) {
			console.error('GAPI client not initialized');
			throw new Error('GAPI client not initialized');
		}

		let labels: Label[];

		try {
			const res = await gapi.client.gmail.users.labels.list({
				userId: 'me',
				requestBody: {},
			});

			labels = res.result.labels;
		} catch (error) {
			throw new Error('Error while getting labels');
		}

		if (!labels || labels.length == 0) return null;

		return labels;
	}
}
