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
	private userId: string | null = null;

	constructor(
		private watchGmailService: WatchGmailService,
		private authenticationService: AuthService,
		private router: Router,
	) {}

	async ngOnInit() {
		if (!this.authenticationService.isLoggedIn() || !this.authenticationService.getCurrentUserId()) {
			this.router.navigate(['/authenticate']);
			return;
		}

		this.userId = this.authenticationService.getCurrentUserId();

		this.isWatchEnabled = await this.watchGmailService.isWatchEnabled(this.userId as string);
	}

	public async enableWatch() {
		try {
			this.isWatchEnabled = true;
			await this.watchGmailService.watchGmail();
		} catch (error) {
			this.isWatchEnabled = false;
			console.error('Error while enabling watch gmail:', error);
		}
	}

	public async disableWatch() {
		try {
			this.isWatchEnabled = false;
			await this.watchGmailService.unWatchGmail();
		} catch (error) {
			this.isWatchEnabled = true;
			console.error('Error while disabling watch gmail:', error);
		}
	}

	public goConfig() {
		this.router.navigate(['/macro-menu']);
	}
}
