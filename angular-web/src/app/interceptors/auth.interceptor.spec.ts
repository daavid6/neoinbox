import { HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('Auth Interceptor', () => {
	let mockAuthService: jasmine.SpyObj<AuthService>;

	beforeEach(() => {
		mockAuthService = jasmine.createSpyObj('AuthService', ['getJwtToken']);
		TestBed.configureTestingModule({
			providers: [{ provide: AuthService, useValue: mockAuthService }],
		});
	});

	function run(req: HttpRequest<any>, nextSpy: jasmine.Spy) {
		let result: HttpRequest<any> | undefined;
		TestBed.runInInjectionContext(() => {
			authInterceptor(req, nextSpy).subscribe((r) => (result = r as any));
		});
		return result!;
	}

	it('should forward request unchanged when no token', (done) => {
		mockAuthService.getJwtToken.and.returnValue(null);
		const req = new HttpRequest('GET', '/api/data');
		const next = jasmine.createSpy('next').and.callFake((r) => {
			expect(r).toBe(req);
			done();
			return of(r);
		});
		run(req, next);
	});

	it('should add Authorization header when token present', (done) => {
		mockAuthService.getJwtToken.and.returnValue('abc123');
		const req = new HttpRequest('GET', '/api/data');
		const next = jasmine.createSpy('next').and.callFake((r) => {
			expect(r.headers.get('Authorization')).toBe('Bearer abc123');
			done();
			return of(r);
		});
		run(req, next);
	});

	['/api/', '/api/docs', '/auth-url/endpoint', '/api/auth-token'].forEach((url) => {
		it(`should NOT add header if url matches exception "${url}"`, (done) => {
			mockAuthService.getJwtToken.and.returnValue('xyz');
			const req = new HttpRequest('GET', url);
			const next = jasmine.createSpy('next').and.callFake((r) => {
				expect(r.headers.has('Authorization')).toBeFalse();
				done();
				return of(r);
			});
			run(req, next);
		});
	});
});
