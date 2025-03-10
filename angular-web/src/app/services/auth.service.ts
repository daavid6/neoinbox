import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { Tokens } from '../interfaces/Tokens';
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
		if (
			!options ||
			!options.scopes ||
			!Array.isArray(options.scopes) ||
			options.scopes.length === 0
		) {
			throw new Error('Missing required parameter: at least one valid scope is required');
		}

		const payload: Payload = {
			scopes: [],
		};

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

	/**
	 * Increments the client permissions to use G Calendar.
	 */
	public async incrementCalendarPermissions(): Promise<string> {
		const url: string = await this.getAuthURL({
			scopes: [
				'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
				'https://www.googleapis.com/auth/calendar.events.freebusy',
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

	/*** Functions which exchange a code for tokens. ***/

	public async exchangeCodeForTokens(code: string): Promise<{ tokens: Tokens; userId: string }> {
		try {
			const response = await firstValueFrom(
				this.http.post<{ data: { tokens: Tokens; userId: string }; message: string }>(
					ENDPOINTS.getTokens,
					{ code },
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
		// Set in memory
		this.accessToken$.next(tokens.access_token);
		this.isloggedIn = true;

		// Store in localStorage
		localStorage.setItem('accessToken', tokens.access_token);
		localStorage.setItem('isLoggedIn', 'true');
		localStorage.setItem('refreshToken', tokens.refresh_token);
	}

	public getCurrentUserId(): string | null {
		return this.currentUserId;
	}

	public setUserId(userId: string): void {
		this.currentUserId = userId;
		localStorage.setItem('userId', userId);
	}

	public isLoggedIn(): boolean {
		return this.isloggedIn;
	}

	public restoreAuthState(): void {
		const accessToken = localStorage.getItem('accessToken');
		const userId = localStorage.getItem('userId');

		if (!accessToken || !userId) return;

		if (this.isTokenExpired()) {
			try {
				this.refreshToken();
			} catch (error) {
				this.clearSession();
			}
		} else {
			this.accessToken$.next(accessToken);
			this.currentUserId = userId;
			this.isloggedIn = true;
		}
	}

	public clearSession(): void {
		localStorage.removeItem('accessToken');
		localStorage.removeItem('userId');
		localStorage.removeItem('refreshToken');
		localStorage.removeItem('isLoggedIn');

		this.accessToken$.next(null);
		this.currentUserId = null;
		this.isloggedIn = false;
	}

	public isTokenExpired(): boolean {
		const accessToken = localStorage.getItem('accessToken');

		if (!accessToken) return true;

		console.log('Access token:', accessToken);

		return false;
	}

	public async refreshToken(): Promise<void> {
		const refreshToken = localStorage.getItem('refreshToken');

		if (!refreshToken) {
			return Promise.reject(new Error('No refresh token available'));
		}

		// return firstValueFrom(
		// 	this.http.post<{ data: { tokens: Tokens }; message: string }>(
		// 		ENDPOINTS.refreshToken, // You'll need to add this endpoint to your backend
		// 		{ refresh_token: refreshToken },
		// 	),
		// ).then((response) => {
		// 	this.setTokens(response.data.tokens);
		// 	return Promise.resolve();
		// });
	}
}

interface Payload {
	scopes: string[];
	state?: object;
}
