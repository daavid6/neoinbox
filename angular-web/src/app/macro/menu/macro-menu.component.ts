import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MacroService } from '../../services/macro.service';
import { AuthService } from '../../services/auth.service';

import { Macro } from '../../interfaces/Macro';

// Constants
const DEFAULT_MACROS_PER_PAGE = 4;

@Component({
	selector: 'app-macro-menu',
	imports: [
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
	],
	templateUrl: './macro-menu.component.html',
	styleUrl: './macro-menu.component.css',
})
export class MacroMenuComponent implements OnInit {
	// ---- Watch status state ----
	protected isWatchEnabled: boolean = false;
	protected isWaitingResponse: boolean = false;

	// ---- Macro data state ----
	private currentMacros: Macro[] = [];
	private parsedMacros: object[] = [];

	// ---- Table UI state ----
	protected displayedColumns: string[] = ['name', 'labels', 'type', 'folders', 'actions'];
	protected dataSource = new MatTableDataSource<object>([]);

	// ---- Paginator variables ----
	protected pageSize = DEFAULT_MACROS_PER_PAGE;
	protected pageSizeOptions: number[] = [1, 2, 4, 6];
	protected length = 0;
	protected index = 0;

	@ViewChild(MatPaginator) paginator!: MatPaginator;

	constructor(
		private authService: AuthService,
		private router: Router,
		private macroService: MacroService,
	) {}

	async ngOnInit() {
		try {
			await this.loadMacroData();
		} catch (error) {
			console.error('Error initializing component:', error);
		}
	}

	// ---- Initializer methods ----

	/**
	 * Load and process macro data
	 */
	private async loadMacroData(): Promise<void> {
		// Fetch macro data
		this.currentMacros = (await this.macroService.getAllMacros(this.authService.getUserId())) ?? [];

		// Process data for display
		this.parsedMacros = this.currentMacros.map((macro: Macro) => ({
			id: macro.id,
			name: macro.data.name,
			labels: macro.data.labels.map((label) => label.name).join(', '),
			type: macro.data.action.type,
			folders: macro.data.action.content.map((folder) => folder.name).join(', '),
		}));

		// Update data source and UI
		this.length = this.parsedMacros.length;
		this.dataSource = new MatTableDataSource(this.parsedMacros);
		this.dataSource.paginator = this.paginator;
	}

	// ---- Paginator event handlers ----

	/**
	 * Handle paginator events
	 */
	protected handlePage(event: PageEvent): void {
		this.pageSize = event.pageSize;
		this.index = event.pageIndex;
	}

	// ---- UI event handlers ----

	/**
	 * Sign out the current user
	 */
	protected signOut(): void {
		this.authService.clearSession();
		this.router.navigate(['/authenticate']);
	}

	// ---- Macro event handlers ----

	/**
	 * Navigate to macro creation page
	 */
	protected createMacro(): void {
		this.router.navigate(['/macro-create']);
	}

	protected async editMacro(macroId: string): Promise<void> {
		await this.deleteMacro(macroId);
		this.createMacro();
	}

	protected async deleteMacro(macroId: string): Promise<void> {
		try {
			// Wait for the deletion to complete
			await this.macroService.deleteMacro(this.authService.getUserId(), macroId);

			// Update the local arrays directly before refreshing
			this.currentMacros = this.currentMacros.filter((macro) => macro.id !== macroId);
			this.parsedMacros = this.parsedMacros.filter((macro: any) => macro.id !== macroId);

			this.length = this.parsedMacros.length;
			this.dataSource.data = this.parsedMacros;
		} catch (error) {
			console.error('Error deleting macro:', error);
		}
	}
}
