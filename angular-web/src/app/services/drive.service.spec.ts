import { TestBed } from '@angular/core/testing';
import { ACTION } from '../interfaces/Macro';
import { Tokens } from '../interfaces/Tokens';
import { AuthService } from './auth.service';
import { DriveService } from './drive.service';

describe('DriveService', () => {
	let service: DriveService;
	let authSpy: jasmine.SpyObj<AuthService>;

	beforeEach(() => {
		window.gapi = {
			load: jasmine.createSpy('gapi.load').and.callFake((mod: any, cb: any) => cb()),
		};

		window.google = {
			picker: {
				Response: { ACTION: 'action', DOCUMENTS: 'docs' },
				Action: { PICKED: 'picked' },
				Document: { NAME: 'name', ID: 'id' },
			},
		};

		authSpy = jasmine.createSpyObj('AuthService', ['incrementDrivePermissions', 'validateCode', 'setTokens']);

		TestBed.configureTestingModule({
			providers: [{ provide: AuthService, useValue: authSpy }],
		});
		service = TestBed.inject(DriveService);

		(service as any).pickerInited = false;
		(service as any).accessToken = '';
	});

	describe('onPickerApiLoad', () => {
		it('should set pickerInited to true', () => {
			expect((service as any).pickerInited).toBeFalse();
			service.onPickerApiLoad();
			expect((service as any).pickerInited).toBeTrue();
		});
	});

	describe('showPicker', () => {
		beforeEach(() => {
			// stub createPicker so we don’t need real google.picker
			spyOn<any>(service, 'createPicker').and.resolveTo();
		});

		it('should call createPicker immediately when already initialized', () => {
			(service as any).pickerInited = true;
			service.showPicker(ACTION.Attachment);
			expect((service as any).createPicker).toHaveBeenCalledWith(ACTION.Attachment);
		});

		it('should load picker API then call createPicker when not initialized', () => {
			(service as any).pickerInited = false;
			service.showPicker(ACTION.Content);
			expect(window.gapi.load).toHaveBeenCalledWith('picker', jasmine.any(Function));
			expect((service as any).createPicker).toHaveBeenCalledWith(ACTION.Content);
			expect((service as any).pickerInited).toBeTrue();
		});
	});

	describe('pickerCallback (protected)', () => {
		let emitSpy: jasmine.Spy;
		beforeEach(() => {
			emitSpy = spyOn(service.folderSelected, 'emit');
		});

		it('should not emit if action is not PICKED', () => {
			const data = { action: 'not-picked', docs: [{ name: 'A', id: '1' }] };
			(service as any).pickerCallback(data);
			expect(emitSpy).not.toHaveBeenCalled();
		});

		it('should not emit if docs array is empty', () => {
			const data = { action: 'picked', docs: [] };
			(service as any).pickerCallback(data);
			expect(emitSpy).not.toHaveBeenCalled();
		});

		it('should emit folder list when docs present', () => {
			const docs = [
				{ name: 'FolderX', id: 'fx' },
				{ name: 'FolderY', id: 'fy' },
			];
			const data = { action: 'picked', docs };
			(service as any).pickerCallback(data);
			expect(emitSpy).toHaveBeenCalledWith([
				{ name: 'FolderX', id: 'fx' },
				{ name: 'FolderY', id: 'fy' },
			]);
		});
	});

	describe('requestDrivePermissions (protected)', () => {
		const fakeTokens: Tokens = {
			access_token: 'A1',
			refresh_token: 'R1',
			expiry_date: 999,
			id_token: '',
			scope: '',
			token_type: '',
		};

		it('should resolve tokens on success', async () => {
			authSpy.incrementDrivePermissions.and.resolveTo('code-123');
			authSpy.validateCode.and.resolveTo({ userId: 'u', tokens: fakeTokens, jwtToken: '' });

			const result = await (service as any).requestDrivePermissions();
			expect(authSpy.incrementDrivePermissions).toHaveBeenCalled();
			expect(authSpy.validateCode).toHaveBeenCalledWith('code-123');
			expect(result).toBe(fakeTokens);
		});

		it('should reject if authService throws', async () => {
			authSpy.incrementDrivePermissions.and.rejectWith(new Error('fail'));
			await expectAsync((service as any).requestDrivePermissions()).toBeRejectedWithError('fail');
		});
	});
});

declare let window: any;

describe('DriveService', () => {
	let service: DriveService;
	let authSpy: jasmine.SpyObj<AuthService>;

	beforeEach(() => {
		// stub global gapi
		window.gapi = {
			load: jasmine.createSpy('gapi.load').and.callFake((mod: any, cb: any) => cb()),
		};

		// stub google.picker namespace for pickerCallback
		window.google = {
			picker: {
				Response: { ACTION: 'action', DOCUMENTS: 'docs' },
				Action: { PICKED: 'picked' },
				Document: { NAME: 'name', ID: 'id' },
			},
		};

		authSpy = jasmine.createSpyObj('AuthService', ['incrementDrivePermissions', 'validateCode', 'setTokens']);

		TestBed.configureTestingModule({
			providers: [{ provide: AuthService, useValue: authSpy }],
		});
		service = TestBed.inject(DriveService);

		// reset internal state
		(service as any).pickerInited = false;
		(service as any).accessToken = '';
	});

	describe('onPickerApiLoad', () => {
		it('should set pickerInited to true', () => {
			expect((service as any).pickerInited).toBeFalse();
			service.onPickerApiLoad();
			expect((service as any).pickerInited).toBeTrue();
		});
	});

	describe('showPicker', () => {
		beforeEach(() => {
			// stub createPicker so we don’t need real google.picker
			spyOn<any>(service, 'createPicker').and.resolveTo();
		});

		it('should call createPicker immediately when already initialized', () => {
			(service as any).pickerInited = true;
			service.showPicker(ACTION.Attachment);
			expect((service as any).createPicker).toHaveBeenCalledWith(ACTION.Attachment);
		});

		it('should load picker API then call createPicker when not initialized', () => {
			(service as any).pickerInited = false;
			// call
			service.showPicker(ACTION.Content);
			// gapi.load stub invokes callback synchronously
			expect(window.gapi.load).toHaveBeenCalledWith('picker', jasmine.any(Function));
			expect((service as any).createPicker).toHaveBeenCalledWith(ACTION.Content);
			expect((service as any).pickerInited).toBeTrue();
		});
	});

	describe('pickerCallback (protected)', () => {
		let emitSpy: jasmine.Spy;
		beforeEach(() => {
			emitSpy = spyOn(service.folderSelected, 'emit');
		});

		it('should not emit if action is not PICKED', () => {
			const data = { action: 'not-picked', docs: [{ name: 'A', id: '1' }] };
			(service as any).pickerCallback(data);
			expect(emitSpy).not.toHaveBeenCalled();
		});

		it('should not emit if docs array is empty', () => {
			const data = { action: 'picked', docs: [] };
			(service as any).pickerCallback(data);
			expect(emitSpy).not.toHaveBeenCalled();
		});

		it('should emit folder list when docs present', () => {
			const docs = [
				{ name: 'FolderX', id: 'fx' },
				{ name: 'FolderY', id: 'fy' },
			];
			const data = { action: 'picked', docs };
			(service as any).pickerCallback(data);
			expect(emitSpy).toHaveBeenCalledWith([
				{ name: 'FolderX', id: 'fx' },
				{ name: 'FolderY', id: 'fy' },
			]);
		});
	});

	describe('requestDrivePermissions (protected)', () => {
		const fakeTokens: Tokens = {
			access_token: 'A1',
			refresh_token: 'R1',
			expiry_date: 999,
			id_token: '',
			scope: '',
			token_type: '',
		};

		it('should resolve tokens on success', async () => {
			authSpy.incrementDrivePermissions.and.resolveTo('code-123');
			authSpy.validateCode.and.resolveTo({ userId: 'u', tokens: fakeTokens, jwtToken: '' });

			const result = await (service as any).requestDrivePermissions();
			expect(authSpy.incrementDrivePermissions).toHaveBeenCalled();
			expect(authSpy.validateCode).toHaveBeenCalledWith('code-123');
			expect(result).toBe(fakeTokens);
		});

		it('should reject if authService throws', async () => {
			authSpy.incrementDrivePermissions.and.rejectWith(new Error('fail'));
			await expectAsync((service as any).requestDrivePermissions()).toBeRejectedWithError('fail');
		});
	});
});
