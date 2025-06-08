import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthenticateComponent } from './authenticate.component';
import { AuthService } from '../services/auth.service';

// Mock component to test private and protected methods
class TestableAuthenticateComponent extends AuthenticateComponent {
    public async testAuthenticate() {
        await this['authenticate']();
    }

	public async testLogIn() {
		await this.testAuthenticate();
	}

	public async testSignUp() {
		await this.testAuthenticate();
	}
}

describe('AuthenticateComponent', () => {
	let component: TestableAuthenticateComponent;
	let fixture: ComponentFixture<TestableAuthenticateComponent>;
	let mockAuthService: jasmine.SpyObj<AuthService>;

	beforeEach(async () => {
		mockAuthService = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'initiateGoogleAuth', 'validateCode', 'setUserId', 'setTokens', 'setJwtToken']);

		await TestBed.configureTestingModule({
			imports: [RouterTestingModule, TestableAuthenticateComponent],
			providers: [{ provide: AuthService, useValue: mockAuthService }],
		}).compileComponents();

		fixture = TestBed.createComponent(TestableAuthenticateComponent);
		component = fixture.componentInstance;
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('ngOnInit', () => {
		it('should navigate to watch-control if user is logged in', () => {
			const router = TestBed.inject(Router);
			spyOn(router, 'navigate');

			mockAuthService.isLoggedIn.and.returnValue(true);
			component.ngOnInit();
			expect(router.navigate).toHaveBeenCalledWith(['/watch-control']);
		});

		it('should not navigate if user is not logged in', () => {
			const router = TestBed.inject(Router);
			spyOn(router, 'navigate');

			mockAuthService.isLoggedIn.and.returnValue(false);
			component.ngOnInit();
			expect(router.navigate).not.toHaveBeenCalled();
		});
	});

	describe('authenticate', () => {
		it('should call authService methods and navigate on successful authentication', async () => {
			const router = TestBed.inject(Router);
			spyOn(router, 'navigate');

			mockAuthService.initiateGoogleAuth.and.resolveTo('test-code');
			mockAuthService.validateCode.and.resolveTo({ userId: 'test-user', tokens: { access_token: 'test-access', refresh_token: 'test-refresh', expiry_date: 12341233, id_token: 'fake-id-token', scope: 'fake-scope', token_type: 'Bearer' }, jwtToken: 'test-jwt' });

			await component.testAuthenticate();

			expect(mockAuthService.initiateGoogleAuth).toHaveBeenCalled();
			expect(mockAuthService.validateCode).toHaveBeenCalledWith('test-code');
			expect(mockAuthService.setUserId).toHaveBeenCalledWith('test-user');
			expect(mockAuthService.setTokens).toHaveBeenCalled();
			expect(mockAuthService.setJwtToken).toHaveBeenCalledWith('test-jwt');
			
			expect(router.navigate).toHaveBeenCalledWith(['/watch-control']);
		});

		it('should navigate to authenticate on authentication failure', async () => {
			const router = TestBed.inject(Router);
			spyOn(router, 'navigate');

			mockAuthService.initiateGoogleAuth.and.rejectWith(new Error('Authentication failed'));

			await component.testAuthenticate();

			expect(router.navigate).toHaveBeenCalledWith(['/authenticate']);
		});
	});

	describe('logIn', () => {
		it('should call authenticate method', async () => {
            spyOn(component, 'testAuthenticate');
			await component.testLogIn();
			expect(component.testAuthenticate).toHaveBeenCalled();
		});
	});

	describe('signUp', () => {
		it('should call authenticate method', async () => {
            spyOn(component, 'testAuthenticate');
			await component.testSignUp();
			expect(component.testAuthenticate).toHaveBeenCalled();
		});
	});
});
