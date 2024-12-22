import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
	selector: 'app-auth-callback-component',
	imports: [],
	templateUrl: './auth-callback-component.component.html',
	styleUrl: './auth-callback-component.component.css',
})
export class AuthCallbackComponent implements OnInit {
	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private authService: AuthService
	) {}

	ngOnInit() {
		this.route.queryParams.subscribe(async (params) => {
			if (params['code']) {
				try {
					await this.authService.exchangeCodeForTokens(
						params['code']
					);
					this.router.navigate(['/permissions']);
				} catch (error) {
					console.error('Error exchanging code for tokens:', error);
					this.router.navigate(['/authenticate']);
					throw error;
				}
			}
		});
	}
}
