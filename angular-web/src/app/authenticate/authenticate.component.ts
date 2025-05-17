import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthService } from '../services/auth.service';

@Component({
	selector: 'app-authenticate',
	imports: [RouterLink, MatToolbarModule, MatButtonModule, MatIconModule],
	templateUrl: './authenticate.component.html',
	styleUrl: './authenticate.component.css',
})
export class AuthenticateComponent {
	constructor(
		private authService: AuthService,
		private router: Router,
	) {}

	ngOnInit() {
		if (this.authService.isLoggedIn()) {
			this.router.navigate(['/watch-control']);
			return;
		}
	}

	private async authenticate() {
		try {
			// Initiate Google authentication flow getting the code
			const code = await this.authService.initiateGoogleAuth();

			// Validate the code, uptade or create user data and get the user ID and tokens
			const { userId, tokens, jwtToken } = await this.authService.validateCode(code);

			// Set tokens for the current session
			this.authService.setUserId(userId);
			this.authService.setTokens(tokens);
			this.authService.setJwtToken(jwtToken);

			// Start navigation immediately
			this.router.navigate(['/watch-control']);
		} catch (error) {
			console.error('Authentication failed:', error);
			this.router.navigate(['/authenticate']);
		}
	}

	protected logIn() {
		return this.authenticate();
	}

	protected signUp() {
		return this.authenticate();
	}
}
