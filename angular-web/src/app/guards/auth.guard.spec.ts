import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
	let guard: AuthGuard;
	let authService: jasmine.SpyObj<AuthService>;
	let router: jasmine.SpyObj<Router>;

	beforeEach(() => {
		authService = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUserId']);
		router = jasmine.createSpyObj('Router', ['navigate']);

		TestBed.configureTestingModule({
			providers: [AuthGuard, { provide: AuthService, useValue: authService }, { provide: Router, useValue: router }],
		});

		guard = TestBed.inject(AuthGuard);
	});

	it('should allow activation when user is logged in and has an ID', () => {
		authService.isLoggedIn.and.returnValue(true);
		authService.getUserId.and.returnValue('user-123');

		const result = guard.canActivate();
		expect(result).toBeTrue();
		expect(router.navigate).not.toHaveBeenCalled();
	});

	it('should deny activation and redirect when not logged in', () => {
		authService.isLoggedIn.and.returnValue(false);
		authService.getUserId.and.returnValue('');

		const result = guard.canActivate();
		expect(result).toBeFalse();
		expect(router.navigate).toHaveBeenCalledWith(['/authenticate']);
	});

	it('should deny activation and redirect when logged in but no user ID', () => {
		authService.isLoggedIn.and.returnValue(true);
		authService.getUserId.and.returnValue('');

		const result = guard.canActivate();
		expect(result).toBeFalse();
		expect(router.navigate).toHaveBeenCalledWith(['/authenticate']);
	});
});
