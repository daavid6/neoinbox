import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthService } from '../services/auth.service';

@Component({
	selector: 'app-authenticate',
	imports: [MatToolbarModule, MatButtonModule, MatIconModule],
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

	protected async login() {
		try {
			const code = await this.authService.initiateGoogleAuth();
			const { tokens, userId } = await this.authService.exchangeCodeForTokens(code);

			this.authService.setTokens(tokens);
			this.authService.setUserId(userId);
			this.router.navigate(['/watch-control']);
		} catch (error) {
			console.error('Login failed:', error);
			this.router.navigate(['/authenticate']);
		}
	}
}
