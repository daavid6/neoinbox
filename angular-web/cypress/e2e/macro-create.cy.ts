describe('Macro Creation Page', () => {
	const viewports = [
		{ name: 'desktop', viewport: 'macbook-13' },
		{ name: 'mobile', viewport: 'iphone-x' },
	];

	viewports.forEach((vp) => {
		describe(`${vp.name} - ${vp.viewport}`, () => {
			beforeEach(() => {
				cy.viewport(vp.viewport as Cypress.ViewportPreset);

				// Mock API responses
				cy.intercept('POST', '**/macro-create', {fixture: 'macro-create.json'}).as('createMacro');
				cy.intercept('GET', '**/macro-get-all**', {fixture: 'macro-get-all.json'}).as('getMacros');

				cy.visit('/macro-create', {
					onBeforeLoad: (win) => {
						// Mock localStorage auth data
						win.localStorage.setItem('userId', 'test-user-123');
						win.localStorage.setItem('jwtToken', 'mock-jwt-token-for-testing');
						win.localStorage.setItem('accessToken', 'mock-access-token');
						win.localStorage.setItem('refreshToken', 'mock-refresh-token');
						win.localStorage.setItem('isLoggedIn', 'true');

						// Mock the Google API (gapi) object with label data
						Object.defineProperty(win, 'gapi', {
							value: {
								load: (api: any, callback: any) => {
									setTimeout(() => callback && callback(), 100);
								},
								client: {
									init: () => Promise.resolve(),
									setToken: () => {},
									gmail: {
										users: {
											labels: {
												list: () =>
													Promise.resolve({
														result: {
															labels: [
																{
																	id: 'CHAT',
																	name: 'CHAT',
																	messageListVisibility: 'hide',
																	labelListVisibility: 'labelHide',
																	type: 'system',
																},
																{
																	id: 'SENT',
																	name: 'SENT',
																	type: 'system',
																},
																{
																	id: 'INBOX',
																	name: 'INBOX',
																	type: 'system',
																},
																{
																	id: 'Label_3488477935097387016',
																	name: 'Prueba',
																	type: 'user',
																},
															],
														},
													}),
											},
											watch: () =>
												Promise.resolve({
													result: { historyId: '123', expiration: Date.now() + 604800000 },
												}),
											stop: () => Promise.resolve({ status: 204 }),
										},
									},
								},
							},
							writable: true,
							configurable: true,
						});
					},
				});
			});

			describe('Create a macro', () => {
				it('should create a new macro', () => {
					// Step 1: Fill in macro name
					cy.get('input[data-test="macro-name-input"]').should('be.visible').type('My E2E Test Macro');
					cy.get('button[data-test="set-name-next-button"]').should('not.be.disabled').click();

					// Step 2: Select an action
					cy.get('mat-chip-option[data-test="action-attachment"]').should('be.visible').click();
					cy.get('button[data-test="select-action-next-button"]').should('not.be.disabled').click();

					// Step 3: Select a label
					cy.get('input[data-test="label-name-input"]').should('be.visible').type('INBOX');
					cy.get('mat-option[data-test="label-inbox"]').click();

					cy.get('input[data-test="label-name-input"]').should('be.visible').type('SENT');
					cy.get('mat-option[data-test="label-sent"]').click();

					cy.get('button[data-test="select-labels-next-button"]').should('not.be.disabled').click();

					// Step 4: Select a folder

					cy.get('button[data-test="select-drive-folder-button"]').should('not.be.disabled');

					cy.window().then((win) => {
						const element = win.document.querySelector('app-macro-create');
						const ng = (win as any).ng;
						if (element && ng) {
							const component = ng.getComponent(element);
							if (component && component.selectedFolders) {
								component.selectedFolders.set([
									{ id: 'folder-123', name: 'My Test Folder' },
									{ id: 'folder-456', name: 'Another Folder' },
								]);
							}
						}
					});

					cy.get('button[data-test="select-drive-folder-next-button"]').should('not.be.disabled').click();

					// Step 5: Final step
					cy.get('button[data-test="create-macro-button"]').should('not.be.disabled').click();

					// Wait for API call and verify navigation
					cy.wait('@createMacro');
					cy.url().should('include', '/macro-menu');

					// Wait for the macro list to load
					cy.wait('@getMacros');

					// Verify the created macro appears in the list
					cy.get('[data-test="macro-list"]').should('contain', 'My E2E Test Macro');

					cy.get('[data-test="macro-item"]').should('contain', 'My E2E Test Macro').should('contain', 'INBOX').should('contain', 'SENT').should('contain', 'attachment').should('contain', 'My Test Folder').should('contain', 'Another Folder');
				});
			});
		});
	});
});
