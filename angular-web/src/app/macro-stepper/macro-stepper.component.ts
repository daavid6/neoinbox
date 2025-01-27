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
	private readonly allTags: string[] = ['Tag1', 'Tag2', 'Tag3', 'Test']; // Obtained from the user's GMAIL
	public readonly selectedTags = signal<string[]>([]);

	readonly currentTag = model<string>('');

	readonly filteredTags = computed(() => {
		const currentTag = this.currentTag().toLowerCase().trim();

		return this.allTags.filter(
			(tag) => tag.toLowerCase().includes(currentTag) && !this.selectedTags().includes(tag),
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
		if (!this.allTags.includes(keyword) || this.selectedTags().includes(keyword)) return false;

		this.selectedTags.update((keywords) => [...keywords, keyword]);
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
		this.selectedTags.update((keywords: string[]) => {
			if (!keywords.includes(keyword)) return keywords;

			this.announcer.announce(`removed ${keyword}`);
			return keywords.filter((k) => k !== keyword);
		});
	}
}
