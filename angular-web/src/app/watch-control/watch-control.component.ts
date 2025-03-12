import { Component, OnInit, ViewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MacroService } from '../services/macro.service';
import { WatchGmailService } from '../services/watch-gmail.service';
import { AuthService } from '../services/auth.service';

import { Macro } from '../interfaces/Macro';

// Constants
const DEFAULT_MACROS_PER_PAGE = 4;

@Component({
	selector: 'app-watch-control',
	imports: [
		NgClass,
		RouterLink,

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
		MatProgressSpinnerModule,
	],
	templateUrl: './watch-control.component.html',
	styleUrl: './watch-control.component.css',
})
export class WatchControlComponent implements OnInit {
	// ---- Authentication state ----
	private userId: string | null = null;

	// ---- Watch status state ----
	protected isWatchEnabled: boolean = false;
	protected isWaitingResponse: boolean = false;

	// ---- Macro data state ----
	private currentMacros: Macro[] = [];
	private parsedMacros: object[] = [];

	// ---- Table UI state ----
	protected displayedColumns: string[] = ['name', 'labels', 'type', 'service'];
	protected dataSource = new MatTableDataSource<object>([]);

	// ---- Paginator variables ----
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
		if (!this.checkAuthentication()) {
			this.router.navigate(['/authenticate']);
			return;
		}

		try {
			await Promise.all([this.initializeWatchStatus(), this.loadMacroData()]);
		} catch (error) {
			console.error('Error initializing component:', error);
		}
	}

	// ---- Initializer methods ----

	/**
	 * Check if user is authenticated, redirect if not
	 * @returns false if not logged-in or user id is not set
	 */
	private checkAuthentication(): boolean {
		this.userId = this.authService.getUserId() || '';
		return this.authService.isLoggedIn() && !!this.userId;
	}

	/**
	 * Check if watch is enabled for the current user
	 */
	private async initializeWatchStatus(): Promise<void> {
		if (!this.userId) return;
		this.isWatchEnabled = await this.watchGmailService.isWatchEnabled(this.userId);
	}

	/**
	 * Load and process macro data
	 */
	private async loadMacroData(): Promise<void> {
		if (!this.userId) return;

		// Fetch macro data
		this.currentMacros = (await this.macroService.getAllMacros(this.userId)) ?? [];

		// Process data for display
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
	}

	// ---- UI event handlers ----

	/**
	 * Sign out the current user
	 */
	protected signOut(): void {
		this.authService.clearSession();
		this.router.navigate(['/authenticate']);
	}

	/**
	 * Toggle watch status
	 * @param enabled New watch status
	 */
	protected async toggleWatch(enabled: boolean): Promise<void> {
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

			// Revert UI to previous state on error
			setTimeout(() => {
				this.isWatchEnabled = previousState;
			}, 200);
		} finally {
			this.isWaitingResponse = false;
		}
	}

	/**
	 * Enable Gmail watch
	 */
	private async enableWatch(): Promise<void> {
		try {
			this.isWatchEnabled = true;
			await this.watchGmailService.watchGmail();
		} catch (error) {
			console.error('Error while enabling watch gmail:', error);
			throw error;
		}
	}

	/**
	 * Disable Gmail watch
	 */
	private async disableWatch(): Promise<void> {
		try {
			this.isWatchEnabled = false;
			await this.watchGmailService.unWatchGmail();
		} catch (error) {
			console.error('Error while disabling watch gmail:', error);
			throw error;
		}
	}

	/**
	 * Handle paginator events
	 */
	protected handlePage(event: PageEvent): void {
		this.pageSize = event.pageSize;
		this.index = event.pageIndex;
	}

	/**
	 * Navigate to macro creation page
	 */
	protected createMacro(): void {
		this.router.navigate(['/macro-create']);
	}
}
