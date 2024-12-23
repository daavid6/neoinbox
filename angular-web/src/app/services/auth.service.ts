import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { Tokens } from '../interfaces/Tokens';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	public accessToken$ = new BehaviorSubject<string | null>(null);

	private currentUserId: string | null = null;
	private isloggedIn: boolean = false;
	private endpointUrl = 'http://localhost:3000';

	constructor(private http: HttpClient) {}

	async initiateGoogleAuth() {
		const response = await firstValueFrom(
			this.http.get<{ url: string }>(
				`${this.endpointUrl}/api/auth/google`
			)
		);
		window.location.href = response.url;
	}

	async exchangeCodeForTokens(code: string): Promise<Tokens> {
		try {
			const response = await firstValueFrom(
				this.http.post<{ token: Tokens; userId: string }>(
					`${this.endpointUrl}/api/auth/token`,
					{ code }
				)
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

	public getIsLoggedIn(): boolean {
		return this.isloggedIn;
	}

	public getCurrentUserId(): string | null {
		return this.currentUserId;
	}
}
