import {
	ChangeDetectionStrategy,
	Component,
	computed,
	signal,
	WritableSignal,
	CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { BreakpointObserver } from '@angular/cdk/layout';
import { StepperOrientation, MatStepperModule } from '@angular/material/stepper';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatChipInputEvent, MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatOptionSelectionChange } from '@angular/material/core';
import { MatGridListModule } from '@angular/material/grid-list';

import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { WatchGmailService } from '../../services/watch-gmail.service';
import { DriveService } from '../../services/drive.service';

@Component({
	selector: 'app-macro-create',
	imports: [
		// Angular Material
		MatStepperModule,
		MatCardModule,
		MatFormFieldModule,
		MatAutocompleteModule,
		MatInputModule,
		MatButtonModule,
		MatChipsModule,
		MatIconModule,
		MatGridListModule,
		// Angular Forms
		FormsModule,
		ReactiveFormsModule,
		// Utilities
		AsyncPipe,
	],
	templateUrl: './macro-create.component.html',
	styleUrl: './macro-create.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MacroCreateComponent {
	public selectedFolders = signal<{ name: string; id: string }[]>([]);

	protected readonly stepperOrientation: Observable<StepperOrientation>;
	protected readonly separatorKeysCodes: number[] = [ENTER, COMMA];
	protected readonly WHAT_TO_DO_OPTIONS = {
		attachment: 'Attachment',
		content: 'Content',
		summary: 'Summary',
		dates: 'Dates',
	};

	// ---- Step 2: What to do ---- //

	// The options for 'What to do' in the macro
	protected readonly selectedOption: WritableSignal<string> = signal<string>('');
	protected readonly options: any[] = [
		{ text: this.WHAT_TO_DO_OPTIONS.attachment, cols: 2, rows: 1, color: 'lightblue' },
		{ text: this.WHAT_TO_DO_OPTIONS.content, cols: 1, rows: 2, color: 'lightgreen' },
		{ text: this.WHAT_TO_DO_OPTIONS.summary, cols: 1, rows: 1, color: 'lightpink' },
		{ text: this.WHAT_TO_DO_OPTIONS.dates, cols: 1, rows: 1, color: '#DDBDF1' },
	];

	// ---- Step 3: When to do it ---- //

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
	private folderSub?: Subscription;

	protected appId: any;
	protected oauth: any;
	protected client: any;

	protected wasDrivePickerClicked: boolean = false;

	async ngOnInit() {
		this.sub = this.currentLabel.valueChanges.subscribe((value) => {
			this.typedValue.set(value ?? '');
		});

		this.folderSub = this.driveService.folderSelected.subscribe((folders) => {
			this.selectedFolders.set(folders);
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
		this.folderSub?.unsubscribe();
	}

	constructor(
		private watchGmailService: WatchGmailService,
		private breakpointObserver: BreakpointObserver,
		private announcer: LiveAnnouncer,
		protected driveService: DriveService,
	) {
		this.stepperOrientation = this.breakpointObserver
			.observe('(min-width: 800px)')
			.pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));
	}

	// What to do
	protected onOptionSelected(event: MatChipListboxChange): void {
		this.selectedOption.set(event.value);
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

	// Drive Picker
	protected openPicker() {
		this.driveService.showPicker();
	}
}
