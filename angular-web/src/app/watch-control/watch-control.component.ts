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

import { ViewChild } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';

import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MacroService } from '../services/macro.service';
import { Macro } from '../interfaces/Macro';

import { WatchGmailService } from '../services/watch-gmail.service';
import { AuthService } from '../services/auth.service';

const DEFAULT_MACROS_PER_PAGE = 4;

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

		MatTableModule,
		MatDividerModule,
		MatPaginatorModule,

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

	private currentUserId: string = '';
	private currentMacros: Macro[] = [];
	private parsedMacros: object[] = [];

	// Paginator variables
	protected displayedColumns: string[] = ['name', 'labels', 'type', 'service'];
	protected dataSource = new MatTableDataSource<object>([]);
	private array: object[] = [];

	protected pageSize = DEFAULT_MACROS_PER_PAGE;
	protected pageSizeOptions: number[] = [1, 2, 4, 6];
	protected length = 0;
	protected index = 0;

	@ViewChild(MatPaginator) paginator!: MatPaginator;

	constructor(
		private watchGmailService: WatchGmailService,
		private authService: AuthService,
		private router: Router,

		private macroService: MacroService,
	) {}

	async ngOnInit() {
		if (!this.authService.isLoggedIn() || !this.authService.getCurrentUserId()) {
			this.router.navigate(['/authenticate']);
			return;
		}
		this.userId = this.authService.getCurrentUserId();
		this.isWatchEnabled = await this.watchGmailService.isWatchEnabled(this.userId as string);

		try {
			this.currentUserId = this.authService.getCurrentUserId() || '';
			this.currentMacros = (await this.macroService.getAllMacros(this.currentUserId)) ?? [];

			this.parsedMacros = this.currentMacros.map((macro: Macro) => ({
				name: macro.data.name,
				labels: macro.data.labels.map((label) => label.name),
				type: macro.data.action.type,
				service: macro.data.action.service,
			}));

			// Update data source and UI
			this.length = this.parsedMacros.length;
			this.dataSource = new MatTableDataSource(this.parsedMacros);
			this.dataSource.paginator = this.paginator;
		} catch (error) {
			console.error('Error initializing component:', error);
		}
	}

	protected signOut() {
		this.authService.clearSession();
		this.router.navigate(['/authenticate']);
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

	// Reacts to paginator events
	protected handlePage(event: PageEvent) {
		this.pageSize = event.pageSize;
		this.index = event.pageIndex;
	}

	// Redirect to the macro creation page
	protected createMacro() {
		this.router.navigate(['/macro-create']);
	}
}
