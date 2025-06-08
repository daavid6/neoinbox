import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageEvent } from '@angular/material/paginator';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { ACTION, ATTACHMENT, Macro } from '../../interfaces/Macro';
import { AuthService } from '../../services/auth.service';
import { MacroService } from '../../services/macro.service';
import { MacroMenuComponent } from './macro-menu.component';

class TestableMacroMenuComponent extends MacroMenuComponent {
	public testHandlePage(event: PageEvent): void {
		return this.handlePage(event);
	}

	public testSignOut(): void {
		return this.signOut();
	}

	public testCreateMacro(): void {
		return this.createMacro();
	}

	public testDeleteMacro(macroId: string): Promise<void> {
		return this.deleteMacro(macroId);
	}

	public get isWatchEnabledValue(): boolean {
		return this.isWatchEnabled;
	}

	public get isWaitingResponseValue(): boolean {
		return this.isWatchEnabled;
	}

	public get dataSourceValue() {
		return this.dataSource;
	}

	public get pageSizeValue(): number {
		return this.pageSize;
	}

	public get lengthValue(): number {
		return this.length;
	}

	public get indexValue(): number {
		return this.index;
	}
}

describe('MacroMenuComponent', () => {
	let component: TestableMacroMenuComponent;
	let fixture: ComponentFixture<TestableMacroMenuComponent>;
	let mockAuthService: jasmine.SpyObj<AuthService>;
	let mockMacroService: jasmine.SpyObj<MacroService>;

	const mockMacros: Macro[] = [
		{
			id: '1',
			data: {
				name: 'Test Macro 1',
				labels: [{ id: 'label1', name: 'Important' }],
				action: {
					type: ACTION.Attachment,
					service: ATTACHMENT.GoogleDrive,
					content: [{ name: 'My Folder', id: 'folder1' }],
				},
			},
		},
		{
			id: '2',
			data: {
				name: 'Test Macro 2',
				labels: [{ id: 'label2', name: 'Urgent' }],
				action: {
					type: ACTION.Content,
					service: ATTACHMENT.GoogleDrive,
					content: [{ name: 'Folder', id: 'folder2' }],
				},
			},
		},
		{
			id: '3',
			data: {
				name: 'Test Macro 3',
				labels: [{ id: 'label3', name: 'Normal' }],
				action: {
					type: ACTION.Attachment,
					service: ATTACHMENT.GoogleDrive,
					content: [{ name: 'Another Folder', id: 'folder3' }],
				},
			},
		},
		{
			id: '4',
			data: {
				name: 'Test Macro 4',
				labels: [{ id: 'label4', name: 'Low Priority' }],
				action: {
					type: ACTION.Content,
					service: ATTACHMENT.OneDrive,
					content: [{ name: 'Urgent Folder', id: 'folder4' }],
				},
			},
		},
		{
			id: '5',
			data: {
				name: 'Test Macro 5',
				labels: [{ id: 'label5', name: 'Very Important' }],
				action: {
					type: ACTION.Attachment,
					service: ATTACHMENT.GoogleDrive,
					content: [{ name: 'Final Folder', id: 'folder5' }],
				},
			},
		},
	];

	beforeEach(async () => {
		mockAuthService = jasmine.createSpyObj('AuthService', ['getUserId', 'clearSession']);
		mockMacroService = jasmine.createSpyObj('MacroService', ['getAllMacros', 'deleteMacro']);

		mockAuthService.getUserId.and.returnValue('test-user');
		mockMacroService.getAllMacros.and.returnValue(Promise.resolve(mockMacros));
		mockMacroService.deleteMacro.and.returnValue(Promise.resolve());

		await TestBed.configureTestingModule({
			imports: [RouterTestingModule, BrowserAnimationsModule, TestableMacroMenuComponent],
			providers: [
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: MacroService, useValue: mockMacroService },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(TestableMacroMenuComponent);
		component = fixture.componentInstance;
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('ngOnInit', () => {
		it('should load macros on init', async () => {
			mockAuthService.getUserId.and.returnValue('test-user');
			mockMacroService.getAllMacros.and.returnValue(Promise.resolve(mockMacros));
			await component.ngOnInit();
			expect(mockAuthService.getUserId).toHaveBeenCalled();
			expect(mockMacroService.getAllMacros).toHaveBeenCalledWith('test-user');
			expect(component.dataSourceValue.data.length).toBe(5);
		});
	});

	describe('handlePage', () => {
		it('should handle page event', () => {
			const pageEvent: PageEvent = {
				pageIndex: 1,
				pageSize: 5,
				length: 10,
				previousPageIndex: 0,
			};
			component.testHandlePage(pageEvent);
			expect(component.indexValue).toBe(1);
			expect(component.pageSizeValue).toBe(5);
		});

		it('should update index and pageSize with different values', () => {
			const pageEvent: PageEvent = {
				pageIndex: 2,
				pageSize: 10,
				length: 25,
				previousPageIndex: 1,
			};
			component.testHandlePage(pageEvent);
			expect(component.indexValue).toBe(2);
			expect(component.pageSizeValue).toBe(10);
		});

		it('should handle the first page event', () => {
			const pageEvent: PageEvent = {
				pageIndex: 0,
				pageSize: 5,
				length: 10,
				previousPageIndex: undefined,
			};
			component.testHandlePage(pageEvent);
			expect(component.indexValue).toBe(0);
			expect(component.pageSizeValue).toBe(5);
		});

		it('should handle an event with a zero length', () => {
			const pageEvent: PageEvent = {
				pageIndex: 0,
				pageSize: 10,
				length: 0,
				previousPageIndex: undefined,
			};
			component.testHandlePage(pageEvent);
			expect(component.indexValue).toBe(0);
			expect(component.pageSizeValue).toBe(10);
		});
	});

	describe('createMacro', () => {
		it('should navigate to create macro page', () => {
			const router = TestBed.inject(Router);
			spyOn(router, 'navigate');

			component.testCreateMacro();
			expect(router.navigate).toHaveBeenCalledWith(['/macro-create']);
		});
	});

	describe('deleteMacro', () => {
		it('should delete a macro', async () => {
			await component.testDeleteMacro('1');
			expect(mockMacroService.deleteMacro).toHaveBeenCalledWith('test-user', '1');
		});
	});

	describe('signOut', () => {
		it('should sign out user', () => {
			const router = TestBed.inject(Router);
			spyOn(router, 'navigate');

			component.testSignOut();
			expect(mockAuthService.clearSession).toHaveBeenCalled();
			expect(router.navigate).toHaveBeenCalledWith(['/authenticate']);
		});
	});
});
