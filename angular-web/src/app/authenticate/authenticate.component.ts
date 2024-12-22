import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
	selector: 'app-authenticate',
	imports: [],
	templateUrl: './authenticate.component.html',
	styleUrl: './authenticate.component.css',
})
export class AuthenticateComponent {
	constructor(private authService: AuthService, private router: Router) {}

	public async login() {
		try {
			await this.authService.initiateGoogleAuth();
		} catch (error) {
			console.error('Login failed:', error);
			this.router.navigate(['/authenticate']);
		}
	}
}
