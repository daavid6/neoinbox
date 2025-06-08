import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ENDPOINTS } from '../enums/EndPoints';
import { AuthResponse } from '../interfaces/AuthResponse';
import { Tokens } from '../interfaces/Tokens';

describe('AuthService', () => {
	let service: AuthService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [AuthService],
		});
		service = TestBed.inject(AuthService);
		httpMock = TestBed.inject(HttpTestingController);
		localStorage.clear();
	});

	afterEach(() => {
		httpMock.verify();
		localStorage.clear();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('setJwtToken', () => {
		it('should store and retrieve JWT token', () => {
			service.setJwtToken('test-jwt');
			expect(localStorage.getItem('jwtToken')).toBe('test-jwt');
			expect(service.getJwtToken()).toBe('test-jwt');
		});
	});

	describe('getJwtToken', () => {
		it('should return null when no token set', () => {
			localStorage.removeItem('jwtToken');
			expect(service.getJwtToken()).toBeNull();
		});

		it('should return token from memory if setJwtToken called', () => {
			service.setJwtToken('mem-jwt');
			expect(service.getJwtToken()).toBe('mem-jwt');
		});
	});

	describe('setUserId', () => {
		it('should store and retrieve userId', () => {
			service.setUserId('user-123');
			expect(localStorage.getItem('userId')).toBe('user-123');
			expect(service.getUserId()).toBe('user-123');
		});
	});

	describe('getUserId', () => {
		it('should return empty string by default', () => {
			expect(service.getUserId()).toBe('');
		});

		it('should return stored userId after setUserId', () => {
			service.setUserId('user-xyz');
			expect(service.getUserId()).toBe('user-xyz');
		});
	});

	describe('setTokens', () => {
		it('should store tokens and reflect logged-in state', () => {
			const tokens: Tokens = {
				access_token: 'access',
				refresh_token: 'refresh',
				expiry_date: 0,
				id_token: '',
				scope: '',
				token_type: '',
			};
			service.setTokens(tokens);
			expect(localStorage.getItem('accessToken')).toBe('access');
			expect(localStorage.getItem('refreshToken')).toBe('refresh');
			expect(localStorage.getItem('isLoggedIn')).toBe('true');
			expect(service.isLoggedIn()).toBeTrue();
		});
	});

	describe('clearSession', () => {
		it('should clear all auth data', () => {
			localStorage.setItem('jwtToken', 'j');
			localStorage.setItem('userId', 'u');
			localStorage.setItem('accessToken', 'a');
			localStorage.setItem('refreshToken', 'r');
			localStorage.setItem('isLoggedIn', 'true');

			service.clearSession();

			expect(localStorage.getItem('jwtToken')).toBeNull();
			expect(localStorage.getItem('userId')).toBeNull();
			expect(localStorage.getItem('accessToken')).toBeNull();
			expect(localStorage.getItem('refreshToken')).toBeNull();
			expect(localStorage.getItem('isLoggedIn')).toBeNull();
			expect(service.isLoggedIn()).toBeFalse();
		});
	});

	describe('validateCode', () => {
		it('should POST to validateCode endpoint and set JWT token', async () => {
			const mockResp: { data: AuthResponse; message: string } = {
				data: {
					userId: 'u1',
					tokens: {
						access_token: 'a1',
						refresh_token: 'r1',
						expiry_date: 123,
						id_token: '',
						scope: '',
						token_type: '',
					},
					jwtToken: 'jwt-xyz',
				},
				message: 'ok',
			};

			// call and capture promise
			const promise = service.validateCode('the-code');

			const req = httpMock.expectOne(ENDPOINTS.validateCode);
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({ code: 'the-code' });
			req.flush(mockResp);

			// await the result
			const result = await promise;
			expect(result).toEqual(mockResp.data);
			expect(service.getJwtToken()).toBe('jwt-xyz');
		});
	});

	describe('isTokenExpired', () => {
		it('should be true if no accessToken in localStorage', () => {
			localStorage.removeItem('accessToken');
			expect(service.isTokenExpired()).toBeTrue();
		});

		it('should be false if accessToken exists', () => {
			localStorage.setItem('accessToken', 'abc');
			expect(service.isTokenExpired()).toBeFalse();
		});
	});

	describe('refreshToken', () => {
		it('should reject when no refreshToken in storage', async () => {
			localStorage.removeItem('refreshToken');
			await expectAsync(service.refreshToken()).toBeRejectedWithError('No refresh token available');
		});

		it('should resolve when refreshToken exists (stub implementation)', async () => {
			localStorage.setItem('refreshToken', 'r1');
			await expectAsync(service.refreshToken()).toBeResolved();
		});
	});

	describe('isLoggedIn', () => {
		it('should be false by default', () => {
			expect(service.isLoggedIn()).toBeFalse();
		});

		it('should be true after setTokens', () => {
			const tokens: Tokens = {
				access_token: 'a',
				refresh_token: 'r',
				expiry_date: 0,
				id_token: '',
				scope: '',
				token_type: '',
			};
			service.setTokens(tokens);
			expect(service.isLoggedIn()).toBeTrue();
		});
	});

	describe('restoreAuthState', () => {
		it('should do nothing if any item missing', () => {
			localStorage.clear();
			service.accessToken$.next(null);
			service.restoreAuthState();
			expect(service.isLoggedIn()).toBeFalse();
			expect(service.getUserId()).toBe('');
			expect(service.getJwtToken()).toBeNull();
		});

		it('should restore state when all items present and token not expired', () => {
			localStorage.setItem('accessToken', 'a1');
			localStorage.setItem('userId', 'u1');
			localStorage.setItem('jwtToken', 'j1');
			service.accessToken$.next(null);
			service.restoreAuthState();
			expect(service.isLoggedIn()).toBeTrue();
			expect(service.getUserId()).toBe('u1');
			expect(service.getJwtToken()).toBe('j1');
		});
	});

	describe('startAuthFlow', () => {
		it('should call getAuthURL then openAuthPopup', async () => {
			const anySvc: any = service;
			spyOn(anySvc, 'getAuthURL').and.resolveTo('http://url');
			spyOn(anySvc, 'openAuthPopup').and.resolveTo('code-123');
			const code = await service.initiateGoogleAuth();
			expect(anySvc.getAuthURL).toHaveBeenCalled();
			expect(anySvc.openAuthPopup).toHaveBeenCalledWith('http://url');
			expect(code).toBe('code-123');
		});
	});

	describe('getAuthURL', () => {
		it('should throw if scopes empty', async () => {
			await expectAsync((service as any).getAuthURL({ scopes: [] })).toBeRejectedWithError('Missing required parameter: at least one valid scope is required');
		});

		it('should POST and return URL', async () => {
			const promise = (service as any).getAuthURL({ scopes: ['s1'] });

			const req = httpMock.expectOne(ENDPOINTS.getAuthURL);
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({ scopes: ['s1'] });
			req.flush({ data: { url: 'u1' }, message: 'm' });

			const result = await promise;
			expect(result).toBe('u1');
		});
	});

	describe('openAuthPopup', () => {
		it('should throw if popup blocked', async () => {
			spyOn(window, 'open').and.returnValue(null);
			await expectAsync((service as any).openAuthPopup('url')).toBeRejectedWithError('Popup blocked. Please allow popups for this site.');
		});
	});
});
