import { ChangeDetectionStrategy, Component, computed, inject, model, signal } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
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

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatOptionSelectionChange } from '@angular/material/core';

@Component({
	selector: 'app-macro-stepper',
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
	],
	templateUrl: './macro-stepper.component.html',
	styleUrl: './macro-stepper.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MacroStepperComponent {
	readonly separatorKeysCodes: number[] = [ENTER, COMMA];
	private readonly allLabels: string[] = ['Label1', 'Label2', 'Label3', 'Test']; // Obtained from the user's GMAIL
	public readonly selectedLabels = signal<string[]>([]);

	readonly currentLabel = model<string>('');

	readonly filteredLabels = computed(() => {
		const currentLabel = this.currentLabel().toLowerCase().trim();

		return this.allLabels.filter(
			(label) => label.toLowerCase().includes(currentLabel) && !this.selectedLabels().includes(label),
		);
	});

	private _formBuilder = inject(FormBuilder);
	announcer = inject(LiveAnnouncer);

	stepperOrientation: Observable<StepperOrientation>;

	constructor() {
		const breakpointObserver = inject(BreakpointObserver);

		this.stepperOrientation = breakpointObserver
			.observe('(min-width: 800px)')
			.pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));
	}

	firstFormGroup = this._formBuilder.group({
		firstCtrl: ['', Validators.required],
	});

	secondFormGroup = this._formBuilder.group({
		secondCtrl: ['', Validators.required],
	});

	private addKeyword(keyword: string): boolean {
		if (!this.allLabels.includes(keyword) || this.selectedLabels().includes(keyword)) return false;

		this.selectedLabels.update((keywords) => [...keywords, keyword]);
		return true;
	}

	public addKeywordInputEvent(event: MatChipInputEvent): void {
		const keyword = (event.value || '').trim();

		if (!this.addKeyword(keyword)) return;

		this.announcer.announce(`added ${keyword}`);
		event.chipInput!.clear();
	}

	public addKeywordFromOption(event: MatOptionSelectionChange): void {
		const keyword = (event.source.value || '').trim();

		if (!this.addKeyword(keyword)) return;

		this.announcer.announce(`added ${keyword}`);
	}

	public removeKeyword(keyword: string): void {
		this.selectedLabels.update((keywords: string[]) => {
			if (!keywords.includes(keyword)) return keywords;

			this.announcer.announce(`removed ${keyword}`);
			return keywords.filter((k) => k !== keyword);
		});
	}
}
