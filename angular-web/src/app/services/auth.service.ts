import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { Tokens } from '../interfaces/Tokens';
import { CLIENT_TYPES } from '../enums/ClientTypes';
import { ENDPOINTS } from '../enums/EndPoints';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	public accessToken$ = new BehaviorSubject<string | null>(null);

	private currentUserId: string | null = null;
	private isloggedIn: boolean = false;

	constructor(private http: HttpClient) {}

	/*** Functions which retrieve an authentication URL given a set of parameters. ***/

	/**
	 * Retrieves an authentication url.
	 *
	 * @param options Optional parameters for the Google Auth URL.
	 * @returns {Promise<void>} A promise that resolves when the authentication is initiated.
	 */
	private async getAuthURL(options: Payload): Promise<string> {
		// Validate required parameters.
		if (!options || !options.clientType) {
			throw new Error('Missing required parameter: clientType');
		}

		if (!options.scopes || !Array.isArray(options.scopes) || options.scopes.length === 0) {
			throw new Error('Missing required parameter: at least one valid scope is required');
		}

		const payload: Payload = {
			clientType: '',
			scopes: [],
		};

		if (options?.clientType) payload.clientType = options.clientType;
		if (options?.scopes) payload.scopes = options.scopes;
		if (options?.state) payload.state = options.state;

		// Call to backend endpoint which creates an auth URL based on the parameters.
		const response: { data: { url: string }; message: string } = await firstValueFrom(
			this.http.post<{ data: { url: string }; message: string }>(
				ENDPOINTS.getAuthURL,
				payload,
			),
		);

		return response.data.url;
	}

	/**
	 * Initiates the Google authentication flow.
	 *
	 * @returns {Promise<void>} A promise that resolves when the authentication is initiated.
	 */
	public async initiateGoogleAuth(): Promise<string> {
		const url = await this.getAuthURL({
			clientType: CLIENT_TYPES.loginOAuth2Client,
			scopes: [
				'https://www.googleapis.com/auth/gmail.readonly',
				'https://www.googleapis.com/auth/userinfo.email',
			],
		});

		// Redirect to the authentication URL.
		const popup = window.open(url, '_blank', `width=500,height=600,top=100,left=100`);

		if (!popup) throw new Error();

		const code = await new Promise<string>((resolve, reject) => {
			// Define a message event listener.
			const handleMessage = async (event: MessageEvent) => {
				// Optionally validate event.origin to ensure the message comes from a trusted source.
				if (event.data?.code) {
					try {
						// Clean up listener and polling timer.
						window.removeEventListener('message', handleMessage);
						clearInterval(pollTimer);
						// Resolve with the received code (or even proceed with token exchange here)
						resolve(event.data.code);
						// Close the popup if it's still open.
						if (!popup.closed) {
							popup.close();
						}
					} catch (error) {
						window.removeEventListener('message', handleMessage);
						clearInterval(pollTimer);
						reject(error);
					}
				}
			};

			window.addEventListener('message', handleMessage, false);

			// Poll in case the user manually closes the popup before completing auth.
			const pollTimer = window.setInterval(() => {
				if (popup.closed) {
					clearInterval(pollTimer);
					window.removeEventListener('message', handleMessage);
					reject(new Error('Authentication popup closed by user'));
				}
			}, 500);
		});

		return code;
	}

	/**
	 * Increments the client permissions to use G Drive.
	 */
	public async incrementDrivePermissions(): Promise<string> {
		const url: string = await this.getAuthURL({
			clientType: CLIENT_TYPES.driveOAuth2Client,
			scopes: ['https://www.googleapis.com/auth/drive'],
		});

		// Redirect to the authentication URL.
		const popup = window.open(url, '_blank', `width=500,height=600,top=100,left=100`);

		if (!popup) throw new Error();

		const code = await new Promise<string>((resolve, reject) => {
			// Define a message event listener.
			const handleMessage = async (event: MessageEvent) => {
				// Optionally validate event.origin to ensure the message comes from a trusted source.
				if (event.data?.code) {
					try {
						// Clean up listener and polling timer.
						window.removeEventListener('message', handleMessage);
						clearInterval(pollTimer);
						// Resolve with the received code (or even proceed with token exchange here)
						resolve(event.data.code);
						// Close the popup if it's still open.
						if (!popup.closed) {
							popup.close();
						}
					} catch (error) {
						window.removeEventListener('message', handleMessage);
						clearInterval(pollTimer);
						reject(error);
					}
				}
			};

			window.addEventListener('message', handleMessage, false);

			// Poll in case the user manually closes the popup before completing auth.
			const pollTimer = window.setInterval(() => {
				if (popup.closed) {
					clearInterval(pollTimer);
					window.removeEventListener('message', handleMessage);
					reject(new Error('Authentication popup closed by user'));
				}
			}, 500);
		});

		return code;
	}

	/*** Functions which exchange a code for tokens. ***/

	public async exchangeCodeForTokens(
		code: string,
		clientType: string,
	): Promise<{ tokens: Tokens; userId: string }> {
		try {
			const response = await firstValueFrom(
				this.http.post<{ data: { tokens: Tokens; userId: string }; message: string }>(
					ENDPOINTS.getTokens,
					{ code, clientType },
				),
			);

			return response.data;
		} catch (error) {
			console.error('Error exchanging code for tokens:', error);
			throw error;
		}
	}

	/*** Functions which manage the authentication state. ***/

	public setTokens(tokens: Tokens): void {
		this.accessToken$.next(tokens.access_token);
		this.isloggedIn = true;
	}

	public getCurrentUserId(): string | null {
		return this.currentUserId;
	}

	public setUserId(userId: string): void {
		this.currentUserId = userId;
	}

	public isLoggedIn(): boolean {
		return this.isloggedIn;
	}
}

interface Payload {
	clientType: string;
	scopes: string[];
	state?: object;
}
