import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { Tokens } from '../interfaces/Tokens';
import { ENDPOINTS } from '../enums/EndPoints';
import { AuthResponse } from '../interfaces/AuthResponse';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	// Observable for access token changes
	public accessToken$ = new BehaviorSubject<string | null>(null);

	private userId: string | null = null;
	private isloggedIn: boolean = false;
	private jwtToken: string | null = null;

	constructor(private http: HttpClient) {}

	// ---- OAuth Flow Methods ----

	/**
	 * Initiates the Google authentication flow for basic permissions
	 * @returns Promise with authorization code
	 */
	public async initiateGoogleAuth(): Promise<string> {
		return this.startAuthFlow({
			scopes: [
				'https://www.googleapis.com/auth/gmail.readonly',
				'https://www.googleapis.com/auth/userinfo.email',
			],
		});
	}

	/**
	 * Requests additional Google Drive permissions
	 * @returns Promise with authorization code
	 */
	public async incrementDrivePermissions(): Promise<string> {
		return this.startAuthFlow({
			scopes: ['https://www.googleapis.com/auth/drive'],
		});
	}

	/**
	 * Requests additional Google Calendar permissions
	 * @returns Promise with authorization code
	 */
	public async incrementCalendarPermissions(): Promise<string> {
		return this.startAuthFlow({
			scopes: [
				'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
				'https://www.googleapis.com/auth/calendar.events.freebusy',
			],
		});
	}

	/**
	 * Validates authorization code and exchanges it for tokens
	 * @param code - Authorization code from Google
	 * @returns Tokens and user ID
	 */
	public async validateCode(code: string): Promise<AuthResponse> {
		try {
			const response = await firstValueFrom(
				this.http.post<{ data: AuthResponse; message: string }>(
					ENDPOINTS.validateCode,
					{ code },
				),
			);

			this.setJwtToken(response.data.jwtToken);
      		return response.data;
		} catch (error) {
			console.error('Error exchanging code for tokens:', error);
			throw error;
		}
	}

	/**
	 * Sets JWT token in memory and localStorage
	 * @param token - JWT token to store
	 */
	public setJwtToken(token: string): void {
		this.jwtToken = token;
		localStorage.setItem('jwtToken', token);
	}

	/**
	 * Gets JWT token from memory
	 * @returns JWT token or null
	 */
	public getJwtToken(): string | null {
		return this.jwtToken || localStorage.getItem('jwtToken');
	}

	// ---- Data Management Methods ----

	/**
	 * Stores tokens in memory and localStorage
	 * @param tokens - Access and refresh tokens
	 */
	public setTokens(tokens: Tokens): void {
		// Set in memory
		this.accessToken$.next(tokens.access_token);
		this.isloggedIn = true;

		// Store in localStorage
		localStorage.setItem('accessToken', tokens.access_token);
		localStorage.setItem('isLoggedIn', 'true');
		localStorage.setItem('refreshToken', tokens.refresh_token);
	}

	/**
	 * Clears all authentication data
	 */
	public clearSession(): void {
		// Clear localStorage
		localStorage.removeItem('accessToken');
		localStorage.removeItem('userId');
		localStorage.removeItem('refreshToken');
		localStorage.removeItem('isLoggedIn');
		localStorage.removeItem('jwtToken');

		// Clear memory
		this.accessToken$.next(null);
		this.userId = null;
		this.isloggedIn = false;
		this.jwtToken = null;
	}

	/**
	 * Sets current user ID
	 * @param userId - User ID to store
	 */
	public setUserId(userId: string): void {
		this.userId = userId;
		localStorage.setItem('userId', userId);
	}

	/**
	 * Gets current user ID
	 * @returns User ID or null
	 */
	public getUserId(): string | null {
		return this.userId;
	}

	/**
	 * Restores authentication state from localStorage
	 */
	public restoreAuthState(): void {
		const accessToken = localStorage.getItem('accessToken');
		const userId = localStorage.getItem('userId');
		const jwtToken = localStorage.getItem('jwtToken');

		if (!accessToken || !userId || !jwtToken) return;

		if (this.isTokenExpired()) {
			try {
				this.refreshToken();
			} catch (error) {
				this.clearSession();
			}
		} else {
			this.accessToken$.next(accessToken);
			this.userId = userId;
			this.isloggedIn = true;
			this.jwtToken = jwtToken;
		}
	}

	/**
	 * Checks if access token is expired
	 * @returns true if token is expired or missing
	 */
	public isTokenExpired(): boolean {
		const accessToken = localStorage.getItem('accessToken');
		return !accessToken;
	}

	/**
	 * Refreshes access token using refresh token
	 */
	public async refreshToken(): Promise<void> {
		const refreshToken = localStorage.getItem('refreshToken');

		if (!refreshToken) {
			return Promise.reject(new Error('No refresh token available'));
		}

		// return firstValueFrom(
		// 	this.http.post<{ data: { tokens: Tokens }; message: string }>(
		// 		ENDPOINTS.refreshToken,
		// 		{ refresh_token: refreshToken },
		// 	),
		// ).then((response) => {
		// 	this.setTokens(response.data.tokens);
		// 	return Promise.resolve();
		// });
	}

	/**
	 * Checks if user is logged in
	 * @returns true if logged in
	 */
	public isLoggedIn(): boolean {
		return this.isloggedIn;
	}

	// ---- Private Helper Methods ----

	/**
	 * Starts an OAuth flow with specific scopes
	 * @param options - Auth flow options
	 * @returns Promise with authorization code
	 */
	private async startAuthFlow(options: Payload): Promise<string> {
		const url = await this.getAuthURL(options);
		return this.openAuthPopup(url);
	}

	/**
	 * Gets an authentication URL from the backend
	 * @param options - Auth options
	 * @returns Promise with auth URL
	 */
	private async getAuthURL(options: Payload): Promise<string> {
		// Validate required parameters.
		if (!options?.scopes || !Array.isArray(options.scopes) || options.scopes.length === 0) {
			throw new Error('Missing required parameter: at least one valid scope is required');
		}

		const payload: Payload = {
			scopes: [],
		};

		if (options?.scopes) payload.scopes = options.scopes;
		if (options?.state) payload.state = options.state;

		// Call to backend endpoint which creates an auth URL based on the parameters.
		const response = await firstValueFrom(
			this.http.post<{ data: { url: string }; message: string }>(
				ENDPOINTS.getAuthURL,
				payload,
			),
		);

		return response.data.url;
	}

	/**
	 * Opens authentication popup and handles the response
	 * @param url - Authentication URL
	 * @returns Promise with authorization code
	 */
	private async openAuthPopup(url: string): Promise<string> {
		// Open popup window
		const popup = window.open(url, '_blank', 'width=500,height=600,top=100,left=100');
		if (!popup) throw new Error('Popup blocked. Please allow popups for this site.');

		// Wait for response via postMessage
		const code = new Promise<string>((resolve, reject) => {
			// Handler for message from popup
			const handleMessage = (event: MessageEvent) => {
				if (event.data?.code) {
					try {
						// Clean up listener and polling timer.
						window.removeEventListener('message', handleMessage);
						clearInterval(pollTimer);

						// Get the auth code
						resolve(event.data.code);

						// Close popup if still open
						if (!popup.closed) {
							popup.close();
						}
					} catch (error) {
						cleanup();
						reject(error);
					}
				}
			};

			// Poll for manually closed popup
			const pollTimer = window.setInterval(() => {
				if (popup.closed) {
					cleanup();
					reject(new Error('Authentication popup closed by user'));
				}
			}, 500);

			// Cleanup function
			const cleanup = () => {
				window.removeEventListener('message', handleMessage);
				clearInterval(pollTimer);
			};

			// Set up message listener
			window.addEventListener('message', handleMessage, false);
		});

		return code;
	}
}

interface Payload {
	scopes: string[];
	state?: object;
}
