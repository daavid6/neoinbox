import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { WatchGmailService } from './watch-gmail.service';
import { AuthService } from './auth.service';
import { ENDPOINTS } from '../enums/EndPoints';
import { environment } from '../private/enviroments/enviroment';

declare let window: any;

describe('WatchGmailService', () => {
	let service: WatchGmailService;
	let httpMock: HttpTestingController;
	let authSpy: jasmine.SpyObj<AuthService>;

	beforeEach(() => {
		// stub global gapi
		window.gapi = {
			load: (_mod: any, cb: any) => cb(),
			client: {
				init: jasmine.createSpy('init').and.returnValue(Promise.resolve()),
				setToken: jasmine.createSpy('setToken'),
				gmail: {
					users: {
						watch: jasmine.createSpy('watch').and.resolveTo({ result: { historyId: 'H1', expiration: 1234 } }),
						stop: jasmine.createSpy('stop').and.resolveTo({ status: 204 }),
						labels: {
							list: jasmine.createSpy('labels.list').and.resolveTo({ result: { labels: [{ id: 'L1', name: 'Inbox' }] } }),
						},
					},
				},
			},
		};

		authSpy = jasmine.createSpyObj('AuthService', ['getUserId'], {
			accessToken$: new BehaviorSubject<string | null>(null),
		});

		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [{ provide: AuthService, useValue: authSpy }],
		});

		service = TestBed.inject(WatchGmailService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	describe('isWatchEnabled', () => {
		it('should GET watch status for a given userId', async () => {
			const call = service.isWatchEnabled('user1');
			const req = httpMock.expectOne(`${ENDPOINTS.getWatchStatus}?userId=user1`);
			expect(req.request.method).toBe('GET');
			req.flush({ data: true, message: 'OK' });

			await expectAsync(call).toBeResolvedTo(true);
		});
	});

	describe('updateWatchData', () => {
		it('should POST enableWatch when beingEnable=true and return previous historyId', async () => {
			authSpy.getUserId.and.returnValue('user2');
			const promise = (service as any).updateWatchData('H1', 5000, true) as Promise<string>;

			const req = httpMock.expectOne(ENDPOINTS.enableWatch);
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({
				historyId: 'H1',
				expiration: 5000,
				userId: 'user2',
			});
			req.flush('OLD_H');

			await expectAsync(promise).toBeResolvedTo('OLD_H');
		});

		it('should POST disableWatch when beingEnable=false and return empty string', async () => {
			authSpy.getUserId.and.returnValue('user3');
			const promise = (service as any).updateWatchData('', 0, false) as Promise<string>;

			const req = httpMock.expectOne(ENDPOINTS.disableWatch);
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({ userId: 'user3' });
			req.flush({});

			await expectAsync(promise).toBeResolvedTo('');
		});

		it('should reject when userId is empty', async () => {
			authSpy.getUserId.and.returnValue('');
			const p = (service as any).updateWatchData('H', 1, true) as Promise<string>;
			await expectAsync(p).toBeRejectedWithError('User not authenticated');
		});
	});

	describe('watchGmail / unWatchGmail', () => {
		beforeEach(() => {
			spyOn<any>(service, 'ensureInitialized').and.resolveTo();
		});

		it('watchGmail should call GAPI watch and updateWatchData', async () => {
			const updateSpy = spyOn<any>(service, 'updateWatchData').and.resolveTo('OLD');
			await service.watchGmail();

			expect(window.gapi.client.gmail.users.watch).toHaveBeenCalledWith({
				userId: 'me',
				resource: { topicName: environment.googleProjectConfig.topicPath },
			});
			expect(updateSpy).toHaveBeenCalledWith('H1', 1234, true);
		});

		it('unWatchGmail should call GAPI stop and updateWatchData', async () => {
			const updateSpy = spyOn<any>(service, 'updateWatchData').and.resolveTo('');
			await service.unWatchGmail();

			expect(window.gapi.client.gmail.users.stop).toHaveBeenCalledWith({
				userId: 'me',
				requestBody: {},
			});
			expect(updateSpy).toHaveBeenCalledWith('', 0, false);
		});
	});

	describe('getLabels', () => {
		beforeEach(() => {
			spyOn<any>(service, 'ensureInitialized').and.resolveTo();
		});

		it('should return array of labels when non-empty', async () => {
			// stub returns minimal label
			window.gapi.client.gmail.users.labels.list.and.resolveTo({
				result: {
					labels: [{ id: 'L1', name: 'Inbox' }],
				},
			});

			const labels = await service.getLabels();
			expect(window.gapi.client.gmail.users.labels.list).toHaveBeenCalledWith({ userId: 'me', requestBody: {} });

			// only assert the fields you care about
			expect(labels).toEqual([
				jasmine.objectContaining({
					id: 'L1',
					name: 'Inbox',
				}),
			]);
		});

		it('should return null when labels list is empty', async () => {
			window.gapi.client.gmail.users.labels.list.and.resolveTo({ result: { labels: [] } });
			const labels = await service.getLabels();
			expect(labels).toBeNull();
		});

		it('should throw on API error', async () => {
			window.gapi.client.gmail.users.labels.list.and.rejectWith(new Error('fail'));
			await expectAsync(service.getLabels()).toBeRejectedWithError('Error while getting labels');
		});
	});
});
