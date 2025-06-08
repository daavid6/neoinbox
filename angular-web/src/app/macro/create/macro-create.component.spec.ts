import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipInputEvent, MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatStepperModule } from '@angular/material/stepper';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { ACTION, ATTACHMENT } from '../../interfaces/Macro';
import { AuthService } from '../../services/auth.service';
import { DriveService } from '../../services/drive.service';
import { MacroService } from '../../services/macro.service';
import { WatchGmailService } from '../../services/watch-gmail.service';
import { MacroCreateComponent } from './macro-create.component';
import { Router } from '@angular/router';
import { MatOptionSelectionChange } from '@angular/material/core';

// Mock component to test private and protected methods
class TestableMacroCreateComponent extends MacroCreateComponent {
	public testSaveMacroName(event: Event): void {
		return this.saveMacroName(event);
	}

	public testOnActionSelected(event: MatChipListboxChange): void {
		return this.onActionSelected(event);
	}

	public testAddKeywordInputEvent(event: MatChipInputEvent): void {
		return this.addKeywordInputEvent(event);
	}

	public testAddKeywordFromOption(event: MatOptionSelectionChange, labelInput: HTMLInputElement): void {
		return this.addKeywordFromOption(event, labelInput);
	}

	public testRemoveKeyword(label: any): void {
		return this.removeKeyword(label);
	}

	public testOpenPicker(actionType: ACTION): void {
		return this.openPicker(actionType);
	}

	public testExecuteFinalAction(): Promise<void> {
		return this.executeFinalAction();
	}

	public testSignOut(): void {
		return this.signOut();
	}

	public get allLabelsValue() {
		return this.allLabels;
	}

	public get selectedLabelsValue() {
		return this.selectedLabels;
	}

	public get macroNameValue() {
		return this.macroName;
	}

	public get selectedActionValue() {
		return this.selectedAction;
	}

	public get selectedFoldersValue() {
		return this.selectedFolders;
	}
}

describe('MacroCreateComponent', () => {
	let component: TestableMacroCreateComponent;
	let fixture: ComponentFixture<TestableMacroCreateComponent>;
	let mockAuthService: jasmine.SpyObj<AuthService>;
	let mockMacroService: jasmine.SpyObj<MacroService>;
	let mockWatchGmailService: jasmine.SpyObj<WatchGmailService>;
	let mockLiveAnnouncer: jasmine.SpyObj<LiveAnnouncer>;
	let mockDriveService: any;
	let folderSelectedEmitter: EventEmitter<any>;

	beforeEach(async () => {
		folderSelectedEmitter = new EventEmitter<any>();
		mockAuthService = jasmine.createSpyObj('AuthService', ['getUserId', 'clearSession']);
		mockMacroService = jasmine.createSpyObj('MacroService', ['createMacro']);
		mockWatchGmailService = jasmine.createSpyObj('WatchGmailService', ['getLabels']);
		mockLiveAnnouncer = jasmine.createSpyObj('LiveAnnouncer', ['announce']);
		mockDriveService = {
			showPicker: jasmine.createSpy('showPicker'),
			folderSelected: folderSelectedEmitter,
		};

		mockAuthService.getUserId.and.returnValue('test-user');

		await TestBed.configureTestingModule({
			imports: [RouterTestingModule, BrowserAnimationsModule, MatButtonModule, MatCardModule, MatIconModule, MatToolbarModule, MatMenuModule, MatDividerModule, MatStepperModule, MatSidenavModule, MatListModule, MatFormFieldModule, MatAutocompleteModule, MatInputModule, MatChipsModule, MatGridListModule, TestableMacroCreateComponent],
			providers: [
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: MacroService, useValue: mockMacroService },
				{ provide: WatchGmailService, useValue: mockWatchGmailService },
				{ provide: DriveService, useValue: mockDriveService },
				{ provide: LiveAnnouncer, useValue: mockLiveAnnouncer },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(TestableMacroCreateComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('saveMacroName', () => {
		it('should saveMacroName', () => {
			const event = { target: { value: 'Test Macro' } } as any;
			component.testSaveMacroName(event);
			expect(component.macroNameValue()).toBe('Test Macro');
		});
	});

	describe('onActionSelected', () => {
		it('should onActionSelected', () => {
			const event = { value: ACTION.Attachment } as any;
			component.testOnActionSelected(event);
			expect(component.selectedActionValue()).toBe(ACTION.Attachment);
		});
	});

	describe('addKeywordInputEvent', () => {
		it('should add a keyword if it exists in allLabels and is not already selected', () => {
			component.allLabelsValue.set([{ name: 'Test Label', id: '1' }]);
			component.selectedLabelsValue.set([]);
			const event = { value: 'Test Label', chipInput: { clear: () => {} } } as any;
			spyOn(event.chipInput, 'clear');
			component.testAddKeywordInputEvent(event);
			expect(component.selectedLabelsValue()).toEqual([{ name: 'Test Label', id: '1' }]);
			expect(event.chipInput.clear).toHaveBeenCalled();
			expect(mockLiveAnnouncer.announce).toHaveBeenCalled();
		});

		it('should not add a keyword if it does not exist in allLabelsValue', () => {
			component.allLabelsValue.set([]);
			component.selectedLabelsValue.set([]);
			const event = { value: 'Test Label', chipInput: { clear: () => {} } } as any;
			spyOn(event.chipInput, 'clear');
			component.testAddKeywordInputEvent(event);
			expect(component.selectedLabelsValue()).toEqual([]);
			expect(event.chipInput.clear).not.toHaveBeenCalled();
			expect(mockLiveAnnouncer.announce).not.toHaveBeenCalled();
		});

		it('should not add a keyword if it is already selected', () => {
			component.allLabelsValue.set([{ name: 'Test Label', id: '1' }]);
			component.selectedLabelsValue.set([{ name: 'Test Label', id: '1' }]);
			const event = { value: 'Test Label', chipInput: { clear: () => {} } } as any;
			spyOn(event.chipInput, 'clear');
			component.testAddKeywordInputEvent(event);
			expect(component.selectedLabelsValue()).toEqual([{ name: 'Test Label', id: '1' }]);
			expect(event.chipInput.clear).not.toHaveBeenCalled();
			expect(mockLiveAnnouncer.announce).not.toHaveBeenCalled();
		});
	});

	describe('addKeywordFromOption', () => {
		it('should add a keyword from option if it exists in allLabels and is not already selected', () => {
			component.allLabelsValue.set([{ name: 'Test Label', id: '1' }]);
			component.selectedLabelsValue.set([]);
			const inputElement = { value: '' } as any;
			const event = { source: { value: 'Test Label' }, isUserInput: true } as any;
			component.testAddKeywordFromOption(event, inputElement);
			expect(component.selectedLabelsValue()).toEqual([{ name: 'Test Label', id: '1' }]);
			expect(inputElement.value).toBe('');
			expect(mockLiveAnnouncer.announce).toHaveBeenCalled();
		});

		it('should not add a keyword from option if it does not exist in allLabels', () => {
			component.allLabelsValue.set([]);
			component.selectedLabelsValue.set([]);
			const inputElement = { value: '' } as any;
			const event = { source: { value: 'Test Label' }, isUserInput: true } as any;
			component.testAddKeywordFromOption(event, inputElement);
			expect(component.selectedLabelsValue()).toEqual([]);
			expect(inputElement.value).toBe('');
			expect(mockLiveAnnouncer.announce).not.toHaveBeenCalled();
		});

		it('should not add a keyword from option if it is already selected', () => {
			component.allLabelsValue.set([{ name: 'Test Label', id: '1' }]);
			component.selectedLabelsValue.set([{ name: 'Test Label', id: '1' }]);
			const inputElement = { value: '' } as any;
			const event = { source: { value: 'Test Label' }, isUserInput: true } as any;
			component.testAddKeywordFromOption(event, inputElement);
			expect(component.selectedLabelsValue()).toEqual([{ name: 'Test Label', id: '1' }]);
			expect(inputElement.value).toBe('');
			expect(mockLiveAnnouncer.announce).not.toHaveBeenCalled();
		});

		it('should not add a keyword from option if isUserInput is false', () => {
			component.allLabelsValue.set([{ name: 'Test Label', id: '1' }]);
			component.selectedLabelsValue.set([]);
			const inputElement = { value: '' } as any;
			const event = { source: { value: 'Test Label' }, isUserInput: false } as any;
			component.testAddKeywordFromOption(event, inputElement);
			expect(component.selectedLabelsValue()).toEqual([]);
			expect(inputElement.value).toBe('');
			expect(mockLiveAnnouncer.announce).not.toHaveBeenCalled();
		});
	});

	describe('removeKeyword', () => {
		it('should remove a label from selectedLabels when removeKeyword is called', () => {
			const labelToRemove = { name: 'Label1', id: '1' };
			component.selectedLabelsValue.set([labelToRemove, { name: 'Label2', id: '2' }]);

			component.testRemoveKeyword(labelToRemove);

			expect(component.selectedLabelsValue()).toEqual([{ name: 'Label2', id: '2' }]);
			expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith(`removed ${labelToRemove}`);
		});

		it('should not remove a label from selectedLabels if it is not present', () => {
			const labelToRemove = { name: 'Label1', id: '1' };
			component.selectedLabelsValue.set([{ name: 'Label2', id: '2' }]);

			component.testRemoveKeyword(labelToRemove);

			expect(component.selectedLabelsValue()).toEqual([{ name: 'Label2', id: '2' }]);
			expect(mockLiveAnnouncer.announce).not.toHaveBeenCalled();
		});
	});

	describe('openPicker', () => {
		it('should call driveService.showPicker when openPicker is called', () => {
			component.testOpenPicker(ACTION.Attachment);
			expect(mockDriveService.showPicker).toHaveBeenCalledWith(ACTION.Attachment);
		});
	});

	describe('executeFinalAction', () => {
		it('should call macroService.createMacro and navigate when executeFinalAction is called', async () => {
			const router = TestBed.inject(Router);
			spyOn(router, 'navigate');

			component.macroNameValue.set('My Test Macro');
			component.selectedLabelsValue.set([{ name: 'Label1', id: '1' }]);
			component.selectedActionValue.set(ACTION.Attachment);
			component.selectedFoldersValue.set([{ name: 'Folder1', id: 'fol1' }]);

			await component.testExecuteFinalAction();
			expect(mockMacroService.createMacro).toHaveBeenCalledWith('test-user', 'My Test Macro', [{ name: 'Label1', id: '1' }], ACTION.Attachment, ATTACHMENT.GoogleDrive, [{ name: 'Folder1', id: 'fol1' }]);
			expect(router.navigate).toHaveBeenCalledWith(['/macro-menu']);
		});
	});

	describe('signOut', () => {
		it('should clear session and navigate when signOut is called', () => {
			const router = TestBed.inject(Router);
			spyOn(router, 'navigate');

			component.testSignOut();
			expect(mockAuthService.clearSession).toHaveBeenCalled();
			expect(router.navigate).toHaveBeenCalledWith(['/authenticate']);
		});
	});
});
