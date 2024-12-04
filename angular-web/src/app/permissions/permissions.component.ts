import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';

import { WatchGmailService } from '../services/watch-gmail.service';

@Component({
	selector: 'app-permissions',
	imports: [NgClass],
	templateUrl: './permissions.component.html',
	styleUrl: './permissions.component.css',
})
export class PermissionsComponent {
	public isWatchEnabled: boolean = false;
	public isWatchDisabled: boolean = false;

	constructor(
		private watchGmailService: WatchGmailService,
		private router: Router
	) {}

	ngOnInit() {
		if (!this.watchGmailService.getIsGapiInitialized())
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
