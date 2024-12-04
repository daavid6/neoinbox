import { Component } from '@angular/core';

import { WatchGmailService } from '../services/watch-gmail.service';

@Component({
	selector: 'app-permissions',
	imports: [],
	templateUrl: './permissions.component.html',
	styleUrl: './permissions.component.css',
})
export class PermissionsComponent {
	public isWatchEnabled = false;

	constructor(private watchGmailService: WatchGmailService) {}

	public async enableWatch() {
		try {
			await this.watchGmailService.watchGmail();
		} catch (error) {
			console.error('Error while enabling watch gmail:', error);
		}
	}

	public async disableWatch() {
		try {
			await this.watchGmailService.unWatchGmail();
			this.isWatchEnabled = false;
		} catch (error) {
			console.error('Error while disabling watch gmail:', error);
		}
	}
}
