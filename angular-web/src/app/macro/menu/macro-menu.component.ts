import { Component, ViewChild } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MacroService } from '../../services/macro.service';
import { AuthService } from '../../services/auth.service';
import { Macro } from '../../interfaces/Macro';

const DEFAULT_MACROS_PER_PAGE = 4;

@Component({
	selector: 'app-macro-menu',
	imports: [
		MatTableModule,
		MatCardModule,
		MatIconModule,
		MatButtonModule,
		MatDividerModule,
		MatPaginatorModule,
	],
	templateUrl: './macro-menu.component.html',
	styleUrl: './macro-menu.component.css',
})
export class MacroMenuComponent {
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
		private router: Router,
		private macroService: MacroService,
		private authService: AuthService,
	) {}

	async ngOnInit() {
		try {
			this.currentUserId = this.authService.getCurrentUserId() || '';
			this.currentMacros = await this.macroService.getAllMacros(this.currentUserId);

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
