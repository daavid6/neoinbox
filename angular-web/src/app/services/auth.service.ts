import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	public accessToken$ = new BehaviorSubject<string | null>(null);
	private isloggedIn: boolean = false;

	constructor(private auth: Auth) {}

	public async loginWithGoogle() {
		const provider = new GoogleAuthProvider();
		provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

		try {
			const result = await signInWithPopup(this.auth, provider);
			const credential = GoogleAuthProvider.credentialFromResult(result);
			const token = credential?.accessToken;
			this.accessToken$.next(token || null);
			this.isloggedIn = true;

			console.log('credential:', credential);
		} catch (error) {
			console.error('Login failed:', error);
			throw error;
		}
	}

	public getIsLoggedIn() {
		return this.isloggedIn;
	}
}
