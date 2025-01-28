import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { BreakpointObserver } from '@angular/cdk/layout';
import { StepperOrientation, MatStepperModule } from '@angular/material/stepper';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { AsyncPipe } from '@angular/common';

import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatOptionSelectionChange } from '@angular/material/core';
import { WatchGmailService } from '../../services/watch-gmail.service';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
	selector: 'app-macro-create',
	imports: [
		MatStepperModule,
		MatCardModule,
		FormsModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatAutocompleteModule,
		MatInputModule,
		MatButtonModule,
		AsyncPipe,
		MatButtonModule,
		MatFormFieldModule,
		MatChipsModule,
		FormsModule,
		MatIconModule,
		MatGridListModule,
	],
	templateUrl: './macro-create.component.html',
	styleUrl: './macro-create.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MacroCreateComponent {
	protected readonly stepperOrientation: Observable<StepperOrientation>;
	protected readonly separatorKeysCodes: number[] = [ENTER, COMMA];

	// ---- Step 1: What to do ---- //

	// The options for 'What to do' in the macro
	protected readonly options: any[] = [
		{ text: 'Attachment', cols: 2, rows: 1, color: 'lightblue' },
		{ text: 'Content', cols: 1, rows: 2, color: 'lightgreen' },
		{ text: 'Summary', cols: 1, rows: 1, color: 'lightpink' },
		{ text: 'Dates', cols: 1, rows: 1, color: '#DDBDF1' },
	];

	// ---- Step 2: When to do it ---- //

	// The form control for user input
	protected readonly currentLabel = new FormControl<string>('');

	// A signal to store the current typed value
	protected readonly typedValue = signal<string>('');

	protected readonly filteredLabels = computed(() => {
		const value = this.typedValue().toLowerCase().trim();
		return this.allLabels().filter(
			(label) =>
				label.toLowerCase().includes(value) && !this.selectedLabels().includes(label),
		);
	});
	protected allLabels = signal<string[]>([]);
	public selectedLabels = signal<string[]>([]);

	private sub?: Subscription;

	async ngOnInit() {
		this.sub = this.currentLabel.valueChanges.subscribe((value) => {
			this.typedValue.set(value ?? '');
		});

		try {
			const labels = await this.watchGmailService.getLabels();

			if (labels) this.allLabels.set(labels.map((label) => label.name));
		} catch (error) {
			console.error('Error fetching Gmail labels:', error);
		}
	}

	ngOnDestroy() {
		this.sub?.unsubscribe();
	}

	constructor(
		private watchGmailService: WatchGmailService,
		private breakpointObserver: BreakpointObserver,
		private announcer: LiveAnnouncer,
	) {
		this.stepperOrientation = this.breakpointObserver
			.observe('(min-width: 800px)')
			.pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));
	}

	// Functions to add and remove keywords

	public addKeywordInputEvent(event: MatChipInputEvent): void {
		const keyword = (event.value || '').trim();

		if (!this.addKeyword(keyword)) return;

		this.announcer.announce(`added ${keyword}`);
		event.chipInput!.clear();
	}

	public addKeywordFromOption(event: MatOptionSelectionChange): void {
		if (!event.isUserInput) return;

		const keyword = (event.source.value || '').trim();
		if (!this.addKeyword(keyword)) return;

		this.announcer.announce(`added ${keyword}`);
	}

	private addKeyword(keyword: string): boolean {
		if (!this.allLabels().includes(keyword) || this.selectedLabels().includes(keyword))
			return false;

		this.selectedLabels.update((keywords) => [...keywords, keyword]);
		return true;
	}

	public removeKeyword(keyword: string): void {
		this.selectedLabels.update((keywords: string[]) => {
			if (!keywords.includes(keyword)) return keywords;

			this.announcer.announce(`removed ${keyword}`);
			return keywords.filter((k) => k !== keyword);
		});
	}
}
