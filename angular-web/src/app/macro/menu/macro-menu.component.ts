import { Component, ViewChild } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import {
	ALLOWED_COLORS,
	Label,
	LabelListVisibility,
	MessageListVisibility,
	Type,
} from '../../interfaces/Label';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';

export interface Macro {
	name: string;
	what: string;
	labels: string;
	where: string;
}

const DEFAULT_MACROS_PER_PAGE = 4;

const label1: Label = {
	id: 'A',
	name: 'A',
	messageListVisibility: MessageListVisibility.SHOW,
	labelListVisibility: LabelListVisibility.SHOW,
	type: Type.USER,
	messagesTotal: 1,
	messagesUnread: 1,
	threadsTotal: 1,
	threadsUnread: 1,
	color: {
		textColor: ALLOWED_COLORS[1],
		backgroundColor: ALLOWED_COLORS[1],
	},
};

const ELEMENT_DATA: Macro[] = [
	{ name: 'Macro 1', what: 'Do this', labels: label1.name, where: 'Where 1' },
	{ name: 'Macro 2', what: 'Do this', labels: label1.name, where: 'Where 2' },
	{ name: 'Macro 3', what: 'Do this', labels: label1.name, where: 'Where 3' },
	{ name: 'Macro 4', what: 'Do this', labels: label1.name, where: 'Where 4' },
	{ name: 'Macro 5', what: 'Do this', labels: label1.name, where: 'Where 5' },
	{ name: 'Macro 6', what: 'Do this', labels: label1.name, where: 'Where 6' },
	{ name: 'Macro 7', what: 'Do this', labels: label1.name, where: 'Where 7' },
	{ name: 'Macro 8', what: 'Do this', labels: label1.name, where: 'Where 8' },
	{ name: 'Macro 9', what: 'Do this', labels: label1.name, where: 'Where 9' },
	{ name: 'Macro 10', what: 'Do this', labels: label1.name, where: 'Where 10' },
	{ name: 'Macro 11', what: 'Do this', labels: label1.name, where: 'Where 11' },
	{ name: 'Macro 12', what: 'Do this', labels: label1.name, where: 'Where 12' },
	{ name: 'Macro 13', what: 'Do this', labels: label1.name, where: 'Where 13' },
	{ name: 'Macro 14', what: 'Do this', labels: label1.name, where: 'Where 14' },
	{ name: 'Macro 15', what: 'Do this', labels: label1.name, where: 'Where 15' },
	{ name: 'Macro 16', what: 'Do this', labels: label1.name, where: 'Where 16' },
	{ name: 'Macro 17', what: 'Do this', labels: label1.name, where: 'Where 17' },
];

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
	// Paginator variables
	protected displayedColumns: string[] = ['name', 'what', 'labels', 'where'];
	protected dataSource = new MatTableDataSource<Macro>(ELEMENT_DATA);
	private array: any = ELEMENT_DATA;

	protected pageSize = DEFAULT_MACROS_PER_PAGE;
	protected pageSizeOptions: number[] = [1, 2, 4, 6];
	protected length = ELEMENT_DATA.length;
	protected currentPage = 0;

	@ViewChild(MatPaginator) paginator!: MatPaginator;

	constructor(private router: Router) {}

	ngOnInit() {
		this.dataSource.paginator = this.paginator;
		this.iterator();
	}

	// Reacts to paginator events
	protected handlePage(event: PageEvent) {
		this.currentPage = event.pageIndex;
		this.pageSize = event.pageSize;
		this.iterator();
	}

	// Iterates over the data array to display the correct page
	private iterator() {
		const end = (this.currentPage + 1) * this.pageSize;
		const start = this.currentPage * this.pageSize;
		const part = this.array.slice(start, end);
		this.dataSource = part;
	}

	// Redirect to the macro creation page
	protected createMacro() {
		this.router.navigate(['/macro-create']);
	}
}
