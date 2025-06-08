import { Router, RouterLink } from '@angular/router';
import { Component, computed, signal, WritableSignal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
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
import { MatListModule } from '@angular/material/list';

import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { WatchGmailService } from '../../services/watch-gmail.service';
import { DriveService } from '../../services/drive.service';
import { ACTION, ATTACHMENT } from '../../interfaces/Macro';
import { NameId } from '../../interfaces/NameId';
import { AuthService } from '../../services/auth.service';
import { MacroService } from '../../services/macro.service';

type Folder = NameId;
type ReducedLabel = NameId;

@Component({
	selector: 'app-macro-create',
	imports: [
		RouterLink,
		// Angular Material
		MatToolbarModule,
		MatMenuModule,
		MatDividerModule,
		MatStepperModule,
		MatSidenavModule,
		MatListModule,
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
})
export class MacroCreateComponent {
	protected readonly stepperOrientation: Observable<StepperOrientation>;
	protected readonly separatorKeysCodes: number[] = [ENTER, COMMA];

	/* ---- Step 2: What to do ---- */

	// The options for 'What to do' in the macro
	ACTION = ACTION;
	protected readonly actions: any[] = [
		{ text: ACTION.Attachment, cols: 2, rows: 1, color: 'lightblue' },
		{ text: ACTION.Content, cols: 1, rows: 2, color: 'lightgreen' },
		{ text: ACTION.Summary, cols: 1, rows: 1, color: 'lightpink' },
		{ text: ACTION.Dates, cols: 1, rows: 1, color: '#DDBDF1' },
	];

	/* ---- Step 3: When to do it ---- */

	// The form control for user input
	protected readonly currentLabel = new FormControl<string>('');

	// A signal to store the current typed value
	protected readonly typedValue = signal<string>('');

	protected readonly filteredLabels = computed(() => {
		const value = this.typedValue().toLowerCase().trim();

		return this.allLabels()
			.filter((label) => !this.selectedLabels().includes(label) && label.name.toLowerCase().includes(value))
			.map((label) => label.name);
	});
	protected allLabels = signal<ReducedLabel[]>([]);

	// Subscriptions
	private sub?: Subscription;
	private folderSub?: Subscription;

	// Selections
	protected readonly macroName: WritableSignal<string> = signal<string>('');
	protected readonly selectedAction: WritableSignal<string> = signal<string>('');
	protected readonly selectedLabels: WritableSignal<ReducedLabel[]> = signal<ReducedLabel[]>([]);
	protected readonly selectedFolders: WritableSignal<Folder[]> = signal<Folder[]>([]);

	/**
	 * The function to run when the component is initialized
	 */
	async ngOnInit() {
		this.sub = this.currentLabel.valueChanges.subscribe((value) => {
			this.typedValue.set(value ?? '');
		});

		this.folderSub = this.driveService.folderSelected.subscribe((folders) => {
			this.selectedFolders.set(folders);
		});

		try {
			const labels = await this.watchGmailService.getLabels();
			labels && this.allLabels.set(labels.map(({ name, id }) => ({ name, id })));
		} catch (error) {
			console.error('Error fetching Gmail labels:', error);
		}
	}

	/**
	 * The function to run when the component is destroyed
	 */
	ngOnDestroy() {
		this.sub?.unsubscribe();
		this.folderSub?.unsubscribe();
	}

	constructor(
		private watchGmailService: WatchGmailService,
		private macroService: MacroService,
		private authService: AuthService,
		private breakpointObserver: BreakpointObserver,
		private announcer: LiveAnnouncer,
		protected driveService: DriveService,
		private router: Router
	) {
		this.stepperOrientation = this.breakpointObserver.observe('(min-width: 800px)').pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));
	}

	// Selectors
	protected saveMacroName(event: Event): void {
		const input = event.target as HTMLInputElement;
		this.macroName.set(input.value);
	}

	protected onActionSelected(event: MatChipListboxChange): void {
		this.selectedAction.set(event.value);
	}

	// Functions to add and remove labels

	protected addKeywordInputEvent(event: MatChipInputEvent): void {
		const labelName = (event.value || '').trim();

		const label: ReducedLabel | undefined = this.allLabels().find(
			(label) => label.name.trim() == labelName
		);

		if (!label || !this.addKeyword(label)) return;

		this.announcer.announce(`added ${label}`);
		event.chipInput!.clear();
	}

	protected addKeywordFromOption(event: MatOptionSelectionChange, labelInput: HTMLInputElement): void {
		if (!event.isUserInput) return;

		const labelName = (event.source.value || '').trim();
		const label: ReducedLabel | undefined = this.allLabels().find(
			(label) => label.name.trim() == labelName
		);

		if (!label || !this.addKeyword(label)) return;

		this.announcer.announce(`added ${label}`);

		labelInput.value = '';
		this.currentLabel.setValue('');
		this.typedValue.set('');
	}

	private addKeyword(label: ReducedLabel): boolean {
		if (!this.allLabels().includes(label) || this.selectedLabels().some(selectedLabel => selectedLabel.id === label.id)) return false;

		this.selectedLabels.update((labels) => [...labels, label]);
		return true;
	}

	protected removeKeyword(label: ReducedLabel): void {
		this.selectedLabels.update((labels: ReducedLabel[]) => {
			if (!labels.includes(label)) return labels;

			this.announcer.announce(`removed ${label}`);
			return labels.filter((l) => l !== label);
		});
	}

	// Drive Picker
	protected openPicker(actionType: ACTION) {
		this.driveService.showPicker(actionType);
	}

	protected async executeFinalAction() {
		const userId = this.authService.getUserId() || '';
		const name = this.macroName();
		const labels = this.selectedLabels();
		const actionType = this.selectedAction() as ACTION;
		const service = ATTACHMENT.GoogleDrive;
		const remainder = this.selectedFolders();

		await this.macroService.createMacro(userId, name, labels, actionType, service, remainder);
		this.router.navigate(['/macro-menu']);
	}

	//Increment permissions
	protected async incrementCalendarPermissions() {
		await this.authService.incrementCalendarPermissions();
	}

	/**
	 * Sign out the current user
	 */
	protected signOut(): void {
		this.authService.clearSession();
		this.router.navigate(['/authenticate']);
	}
}
