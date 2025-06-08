import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MacroService } from './macro.service';
import { ENDPOINTS } from '../enums/EndPoints';
import { ACTION, ATTACHMENT, Macro } from '../interfaces/Macro';
import { NameId } from '../interfaces/NameId';

describe('MacroService', () => {
	let service: MacroService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [MacroService],
		});
		service = TestBed.inject(MacroService);
		httpMock = TestBed.inject(HttpTestingController);
		localStorage.clear();
	});

	afterEach(() => {
		httpMock.verify();
	});

	describe('getAllMacros', () => {
		it('should return undefined when no userId provided', async () => {
			const result = await service.getAllMacros('');
			expect(result).toBeUndefined();
		});

		it('should GET macros and return data.macros when userId provided', async () => {
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

			const promise = service.getAllMacros('user123');
			const req = httpMock.expectOne(`${ENDPOINTS.getAllMacros}?userId=user123`);
			expect(req.request.method).toBe('GET');
			req.flush({ data: { macros: mockMacros }, message: 'OK' });

			const result = await promise;
			expect(result).toEqual(mockMacros);
		});
	});

	describe('createMacro', () => {
		it('should POST to createMacro endpoint with correct body', async () => {
			const userId = 'u1';
			const name = 'MyMacro';
			const labels: NameId[] = [{ id: 'l1', name: 'Label1' }];
			const actionType = ACTION.Attachment;
			const serviceName = 'MyService';
			const remainder = { foo: 42 };

			const promise = service.createMacro(userId, name, labels, actionType, serviceName, remainder);

			const req = httpMock.expectOne(ENDPOINTS.createMacro);
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({
				userId,
				name,
				labels,
				actionType,
				service: serviceName,
				remainder,
			});
			req.flush('created');

			await expectAsync(promise).toBeResolved();
		});
	});

	describe('deleteMacro', () => {
		it('should do nothing when userId or macroId is missing', async () => {
			// no userId
			(service as any).deleteMacro('', 'm1');
			// no macroId
			(service as any).deleteMacro('u1', '');
			// ensure no HTTP calls
			httpMock.expectNone(ENDPOINTS.deleteMacro);

			expect().nothing();
		});

		it('should DELETE when both userId and macroId provided', async () => {
			const userId = 'u2';
			const macroId = 'm2';

			const promise = service.deleteMacro(userId, macroId);
			const req = httpMock.expectOne(ENDPOINTS.deleteMacro);
			expect(req.request.method).toBe('DELETE');
			expect(req.request.body).toEqual({ userId, macroId });
			req.flush({});

			await expectAsync(promise as Promise<void>).toBeResolved();
		});
	});
});
