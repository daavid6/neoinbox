import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { Tokens } from '../interfaces/Tokens';
import { CLIENT_TYPES } from '../enums/ClientTypes';

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
		if (options?.state) payload.state = JSON.stringify(options.state);

		// Call to backend endpoint which creates an auth URL based on the parameters.
		const response: { url: string } = await firstValueFrom(
			this.http.post<{ url: string }>(
				'https://europe-west2-neoinbox.cloudfunctions.net/auth-google',
				payload,
			),
		);

		return response.url;
	}

	/**
	 * Initiates the Google authentication flow.
	 *
	 * @returns {Promise<void>} A promise that resolves when the authentication is initiated.
	 */
	public async initiateGoogleAuth(): Promise<void> {
		const url = await this.getAuthURL({
			clientType: CLIENT_TYPES.loginOAuth2Client,
			scopes: [
				'https://www.googleapis.com/auth/gmail.readonly',
				'https://www.googleapis.com/auth/userinfo.email',
			],
		});

		// Redirect to the authentication URL.
		window.location.href = url;
	}

	
	/*** Functions which exchange a code for tokens. ***/


	public async exchangeCodeForTokens(code: string): Promise<Tokens> {
		try {
			const response = await firstValueFrom(
				this.http.post<{ token: Tokens; userId: string }>(
					'https://europe-west2-neoinbox.cloudfunctions.net/auth-token',
					{ code },
				),
			);

			this.currentUserId = response.userId;
			this.accessToken$.next(response.token.access_token);
			this.isloggedIn = true;
			return response.token;
		} catch (error) {
			console.error('Error exchanging code for tokens:', error);
			throw error;
		}
	}

	public isLoggedIn(): boolean {
		return this.isloggedIn;
	}

	public getCurrentUserId(): string | null {
		return this.currentUserId;
	}
}

interface Payload {
	clientType: string;
	scopes: string[];
	state?: string;
}
