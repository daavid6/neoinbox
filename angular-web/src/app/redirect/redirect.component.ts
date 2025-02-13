import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
	selector: 'app-redirect',
	templateUrl: './redirect.component.html',
	styleUrls: ['./redirect.component.css'],
})
export class RedirectComponent implements OnInit {
	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private authService: AuthService,
	) {}

	ngOnInit(): void {
		this.route.queryParams.subscribe(async (params) => {
			const code = params['code'];

			if (window.opener) {
				window.opener.postMessage({ code: code }, window.location.origin);
				// Close this popup.
				window.close();
			}
		});
		// 	const stateParam = params['state'];
		// 	let redirectRoute = '/watch-control'; // default

		// 	if (stateParam) {
		// 		try {
		// 			const state = JSON.parse(stateParam);
		// 			// For example, if state.redirect exists, navigate to that route
		// 			if (state && state.redirect) {
		// 				redirectRoute = state.redirect;
		// 			}
		// 		} catch (err) {
		// 			console.error('Invalid state param, using default redirect');
		// 		}
		// 	}

		// 	if (code) {
		// 		try {
		// 			await this.authService.exchangeCodeForTokens(code);
		// 			// Navigate to the route specified in state or default
		// 			this.router.navigate([redirectRoute]);
		// 		} catch (error) {
		// 			console.error('Error exchanging code for tokens:', error);
		// 			this.router.navigate(['/authenticate']);
		// 		}
		// 	} else {
		// 		this.router.navigate(['/authenticate']);
		// 	}
		// });
	}
}
