import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';

import { WatchGmailService } from '../services/watch-gmail.service';
import { AuthService } from '../services/auth.service';

@Component({
	selector: 'app-watch-control',
	imports: [NgClass],
	templateUrl: './watch-control.component.html',
	styleUrl: './watch-control.component.css',
})
export class WatchControlComponent {
	public isWatchEnabled: boolean = false;
	public isWatchDisabled: boolean = false;

	constructor(
		private watchGmailService: WatchGmailService,
		private authenticationService: AuthService,
		private router: Router
	) {}

	ngOnInit() {
		if (!this.authenticationService.getIsLoggedIn())
			this.router.navigate(['/authenticate']);
	}

	public async enableWatch() {
		try {
			await this.watchGmailService.watchGmail();
			this.isWatchEnabled = true;
			this.isWatchDisabled = false;
		} catch (error) {
			console.error('Error while enabling watch gmail:', error);
		}
	}

	public async disableWatch() {
		try {
			await this.watchGmailService.unWatchGmail();
			this.isWatchEnabled = false;
			this.isWatchDisabled = true;
		} catch (error) {
			console.error('Error while disabling watch gmail:', error);
		}
	}
}
