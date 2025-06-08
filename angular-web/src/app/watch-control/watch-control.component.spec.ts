import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { ACTION, ATTACHMENT, Macro } from '../interfaces/Macro';
import { AuthService } from '../services/auth.service';
import { MacroService } from '../services/macro.service';
import { WatchGmailService } from '../services/watch-gmail.service';
import { WatchControlComponent } from './watch-control.component';

class TestableWatchControlComponent extends WatchControlComponent {
	public testToggleWatch(enabled: boolean): Promise<void> {
		return this.toggleWatch(enabled);
	}

	public testEnableWatch(): Promise<void> {
		return this['enableWatch']();
	}

	public testDisableWatch(): Promise<void> {
		return this['disableWatch']();
	}

	public testHandlePage(event: PageEvent): void {
		return this.handlePage(event);
	}

	public testCreateMacro(): void {
		return this.createMacro();
	}

	public testDeleteMacro(macroId: string): Promise<void> {
		return this.deleteMacro(macroId);
	}

	public testSignOut(): void {
		return this.signOut();
	}

	public get isWatchEnabledValue(): boolean {
		return this.isWatchEnabled;
	}

	public get isWaitingResponseValue(): boolean {
		return this.isWaitingResponse;
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

describe('WatchControlComponent', () => {
	let component: TestableWatchControlComponent;
	let fixture: ComponentFixture<TestableWatchControlComponent>;
	let mockAuthService: jasmine.SpyObj<AuthService>;
	let mockMacroService: jasmine.SpyObj<MacroService>;
	let mockWatchGmailService: jasmine.SpyObj<WatchGmailService>;

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
	];

	beforeEach(async () => {
		mockAuthService = jasmine.createSpyObj('AuthService', ['getUserId', 'clearSession']);
		mockMacroService = jasmine.createSpyObj('MacroService', ['getAllMacros', 'deleteMacro']);
		mockWatchGmailService = jasmine.createSpyObj('WatchGmailService', ['isWatchEnabled', 'watchGmail', 'unWatchGmail']);

		mockAuthService.getUserId.and.returnValue('test-user');
		mockMacroService.deleteMacro.and.returnValue(Promise.resolve());
		mockMacroService.getAllMacros.and.returnValue(Promise.resolve(mockMacros));
		mockWatchGmailService.isWatchEnabled.and.returnValue(Promise.resolve(true));
		mockWatchGmailService.watchGmail.and.returnValue(Promise.resolve());
		mockWatchGmailService.unWatchGmail.and.returnValue(Promise.resolve());

		await TestBed.configureTestingModule({
			imports: [RouterTestingModule, BrowserAnimationsModule, MatTableModule, MatPaginatorModule, MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule, MatListModule, MatCardModule, MatMenuModule, MatDividerModule, MatSlideToggleModule, MatProgressSpinnerModule, TestableWatchControlComponent],
			providers: [
				{ provide: AuthService, useValue: mockAuthService },
				{ provide: MacroService, useValue: mockMacroService },
				{ provide: WatchGmailService, useValue: mockWatchGmailService },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(TestableWatchControlComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('ngOnInit', () => {
		it('should initialize component properties', async () => {
			await component.ngOnInit();

			expect(mockAuthService.getUserId).toHaveBeenCalled();
			expect(mockWatchGmailService.isWatchEnabled).toHaveBeenCalledWith('test-user');
		});
	});

	describe('toggleWatch', () => {
		it('should enable watch if disabled', async () => {
			mockWatchGmailService.watchGmail.and.returnValue(Promise.resolve());
			mockWatchGmailService.unWatchGmail.and.returnValue(Promise.resolve());
			component['isWatchEnabled'] = false;
			await component['toggleWatch'](true);
			expect(mockWatchGmailService.watchGmail).toHaveBeenCalled();
			expect(component['isWatchEnabled']).toBe(true);
		});

		it('should disable watch if enabled', async () => {
			mockWatchGmailService.watchGmail.and.returnValue(Promise.resolve());
			mockWatchGmailService.unWatchGmail.and.returnValue(Promise.resolve());
			component['isWatchEnabled'] = true;
			await component['toggleWatch'](false);
			expect(mockWatchGmailService.unWatchGmail).toHaveBeenCalled();
			expect(component['isWatchEnabled']).toBe(false);
		});
	});

	describe('enableWatch', () => {
		it('should enable watch', async () => {
			await component.testEnableWatch();
			expect(mockWatchGmailService.watchGmail).toHaveBeenCalled();
			expect(component.isWatchEnabledValue).toBe(true);
		});

		it('should handle errors when enabling watch', async () => {
			mockWatchGmailService.watchGmail.and.rejectWith(new Error('test error'));
			try {
				await component.testEnableWatch();
			} catch (error) {
				expect(mockWatchGmailService.watchGmail).toHaveBeenCalled();
				expect(component.isWatchEnabledValue).toBe(true);
			}
		});
	});

	describe('disableWatch', () => {
		it('should disable watch', async () => {
			await component.testDisableWatch();
			expect(mockWatchGmailService.unWatchGmail).toHaveBeenCalled();
			expect(component.isWatchEnabledValue).toBe(false);
		});

		it('should handle errors when disabling watch', async () => {
			mockWatchGmailService.unWatchGmail.and.rejectWith(new Error('test error'));
			try {
				await component.testDisableWatch();
			} catch (error) {
				expect(mockWatchGmailService.unWatchGmail).toHaveBeenCalled();
				expect(component.isWatchEnabledValue).toBe(false);
			}
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
		it('should clear session and navigate to authenticate', () => {
			const router = TestBed.inject(Router);
			spyOn(router, 'navigate');

			component.testSignOut();
			expect(mockAuthService.clearSession).toHaveBeenCalled();
			expect(router.navigate).toHaveBeenCalledWith(['/authenticate']);
		});
	});
});
