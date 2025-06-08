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
	private initializationPromise: Promise<void> | null = null;

	constructor(
		private authService: AuthService,
		private http: HttpClient
	) {
		this.authService.accessToken$.subscribe((token) => {
			if (token) {
				this.initializeGapiClient(token);
			}
		});
	}

	private initializeGapiClient(token: string): Promise<void> {
		if (this.initializationPromise) {
			return this.initializationPromise;
		}

		this.initializationPromise = new Promise<void>((resolve, reject) => {
			gapi.load('client', async () => {
				try {
					await gapi.client.init({
						apiKey: environment.gmailApiKey,
						discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
					});
					gapi.client.setToken({ access_token: token });
					this.isGapiInitialized = true;
					resolve();
				} catch (error) {
					console.error('Failed to initialize GAPI client:', error);
					reject(error);
				}
			});
		});

		return this.initializationPromise;
	}

	private async ensureInitialized(): Promise<void> {
		if (!this.isGapiInitialized) {
			if (!this.initializationPromise) {
				throw new Error('GAPI client not initialized and no initialization in progress');
			}
			await this.initializationPromise;
		}
	}

	public async watchGmail() {
    	await this.ensureInitialized();

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
    	await this.ensureInitialized();

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
		const res = await firstValueFrom(this.http.get<{ data: boolean; message: string }>(`${ENDPOINTS.getWatchStatus}?userId=${userId}`));

		return res.data;
	}

	private async updateWatchData(historyId: string, expiration: number, beingEnable: boolean): Promise<string> {
		const userId = this.authService.getUserId();

		if (!userId) throw new Error('User not authenticated');

		let oldHistoryId = '';

		if (beingEnable) {
			oldHistoryId = await firstValueFrom(
				this.http.post<string>(ENDPOINTS.enableWatch, {
					historyId: String(historyId),
					expiration,
					userId,
				})
			);
		} else {
			await firstValueFrom(
				this.http.post(ENDPOINTS.disableWatch, {
					userId,
				})
			);
		}

		return oldHistoryId;
	}

	public async getLabels(): Promise<Label[] | null> {
    	await this.ensureInitialized();

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
