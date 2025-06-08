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
	}
}
