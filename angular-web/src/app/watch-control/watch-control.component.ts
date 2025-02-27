import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { WatchGmailService } from '../services/watch-gmail.service';
import { AuthService } from '../services/auth.service';

@Component({
	selector: 'app-watch-control',
	imports: [
		NgClass,
		MatToolbarModule,
		MatButtonModule,
		MatIconModule,
		MatSidenavModule,
		MatListModule,
		MatCardModule,
		MatMenuModule,

		MatSlideToggleModule,
		RouterLink,
		MatProgressSpinnerModule,
	],
	templateUrl: './watch-control.component.html',
	styleUrl: './watch-control.component.css',
})
export class WatchControlComponent {
	protected isWatchEnabled: boolean = false;
	protected isWaitingResponse: boolean = false;
	private userId: string | null = null;

	constructor(
		private watchGmailService: WatchGmailService,
		private authService: AuthService,
		private router: Router,
	) {}

	async ngOnInit() {
		if (!this.authService.isLoggedIn() || !this.authService.getCurrentUserId()) {
			this.router.navigate(['/authenticate']);
			return;
		}
		this.userId = this.authService.getCurrentUserId();
		this.isWatchEnabled = await this.watchGmailService.isWatchEnabled(this.userId as string);
	}

	protected async toggleWatch(enabled: boolean) {
		if (this.isWaitingResponse) return;

		this.isWaitingResponse = true;
		const previousState = this.isWatchEnabled;

		try {
			if (enabled) {
				await this.enableWatch();
			} else {
				await this.disableWatch();
			}
		} catch (error) {
			console.error('Error toggling watch:', error);
			setTimeout(() => {
				this.isWatchEnabled = previousState;
			}, 200);
		} finally {
			this.isWaitingResponse = false;
		}
	}

	private async enableWatch() {
		try {
			this.isWatchEnabled = true;
			await this.watchGmailService.watchGmail();
		} catch (error) {
			console.error('Error while enabling watch gmail:', error);
			throw error;
		}
	}

	private async disableWatch() {
		try {
			this.isWatchEnabled = false;
			await this.watchGmailService.unWatchGmail();
		} catch (error) {
			console.error('Error while disabling watch gmail:', error);
			throw error;
		}
	}
}
