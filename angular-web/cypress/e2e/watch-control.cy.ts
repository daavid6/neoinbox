describe('Watch Control Page', () => {
	const viewports = [
		{ name: 'desktop', viewport: 'macbook-13' },
		{ name: 'mobile', viewport: 'iphone-x' },
	];

	viewports.forEach((vp) => {
		describe(`${vp.name} - ${vp.viewport}`, () => {
			beforeEach(() => {
				cy.viewport(vp.viewport as Cypress.ViewportPreset);

				// Mock authentication API endpoints
				cy.intercept('POST', '**/watch-enable', { fixture: 'watch-enable.json' }).as('enableWatch');
				cy.intercept('POST', '**/watch-disable', { fixture: 'watch-disable.json' }).as('disableWatch');
				cy.intercept('GET', '**/watch-status**', { fixture: 'watch-status.json' }).as('getWatchStatus');
				cy.intercept('GET', '**/macro-get-all**', { fixture: 'macro-get-all.json' }).as('getMacros');
				cy.intercept('DELETE', '**/macro-delete**', { fixture: 'macro-delete.json' }).as('deleteMacro');

				cy.visit('/watch-control', {
					onBeforeLoad: (win) => {
						// Mock localStorage auth data
						win.localStorage.setItem('userId', 'test-user-123');
						win.localStorage.setItem('jwtToken', 'mock-jwt-token-for-testing');
						win.localStorage.setItem('accessToken', 'mock-access-token');
						win.localStorage.setItem('refreshToken', 'mock-refresh-token');
						win.localStorage.setItem('isLoggedIn', 'true');

						// Mock the Google API (gapi) object
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
											watch: () =>
												Promise.resolve({
													result: { historyId: '1234567890', expiration: Date.now() + 604800000 },
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

			describe('Dashboard Layout and Navigation', () => {
				it('should display all dashboard components', () => {
					// Verify main dashboard cards
					cy.get('mat-card.status-card').should('be.visible');
					cy.get('mat-card.actions-card').should('be.visible');
					cy.get('mat-card.macros-preview-card').should('be.visible');

					// Verify toolbar and navigation
					cy.get('mat-toolbar.top-toolbar').should('be.visible');
					cy.get('h1').should('not.be.empty');
					cy.get('mat-sidenav').should('be.visible');
				});

				it('should have proper sidebar navigation', () => {
					// Verify sidebar elements
					cy.get('mat-nav-list').should('be.visible');
					cy.get('a[routerLink="/watch-control"]').should('contain', 'Dashboard');
					cy.get('a[routerLink="/macro-menu"]').should('contain', 'Macros');
					cy.get('a').should('contain', 'Analytics');
					cy.get('a').should('contain', 'Settings');

					// Test macro menu navigation
					cy.get('a[routerLink="/macro-menu"]').click();
					cy.url().should('include', '/macro-menu');
				});

				it('should handle user menu interactions', () => {
					// Open user menu
					cy.get('button[data-test="user-menu"]').contains('account_circle').click();

					// Verify menu items
					cy.get('[data-test="profile-button"]').should('contain', 'Profile');
					cy.get('[data-test="settings-button"]').should('contain', 'Settings');
					cy.get('[data-test="signout-button"]').should('contain', 'Sign out').click();

					cy.url().should('include', '/authenticate');
				});
			});

			describe('Service Status', () => {
				it('should display watch status as enabled', () => {
					// Verify status card shows enabled state
					cy.get('div[data-test="status-circle"]').should('have.class', 'active');
					cy.get('mat-slide-toggle[data-test="watch-toggle"] .mdc-switch').should('have.attr', 'aria-checked', 'true');
				});

				it('should display watch status as disabled', () => {		
					// Start with watch disabled
                    cy.intercept('GET', '**/watch-status**', { fixture: 'watch-status-disabled.json' }).as('getWatchStatusDisabledInitial');
                    cy.reload(); 
                    cy.wait('@getWatchStatusDisabledInitial');

					// Verify status card shows disabled state
					cy.get('div[data-test="status-circle"]').should('have.class', 'inactive');
					cy.get('mat-slide-toggle[data-test="watch-toggle"] .mdc-switch').should('have.attr', 'aria-checked', 'false');
				});

				it('should handle enabling watch status', () => {
					// Start with watch disabled
                    cy.intercept('GET', '**/watch-status**', { fixture: 'watch-status-disabled.json' }).as('getWatchStatusDisabledInitial');
                    cy.reload(); 
                    cy.wait('@getWatchStatusDisabledInitial');

					// Click toggle to enable
					cy.get('mat-slide-toggle[data-test="watch-toggle"]').click();

					// Verify processing state and then enabled state
					cy.get('div[data-test="status-circle"]').should('be.visible').should('have.class', 'processing');

					cy.wait(250);

					// Verify enabled state after API call
					cy.get('div[data-test="status-circle"]').should('be.visible').should('have.class', 'active');
					cy.get('mat-slide-toggle[data-test="watch-toggle"] .mdc-switch').should('have.attr', 'aria-checked', 'true');
				});

				it('should handle disabling watch status', () => {
					// Click toggle to disable
					cy.get('mat-slide-toggle[data-test="watch-toggle"]').click();

					// Verify disable state after API call
					cy.get('div[data-test="status-circle"]').should('be.visible').should('have.class', 'inactive');
					cy.get('mat-slide-toggle[data-test="watch-toggle"] .mdc-switch').should('have.attr', 'aria-checked', 'false');
				});
			});

			describe('Quick Actions', () => {
				it('should have all the buttons', () => {
					cy.get('button[data-test="goto-macro-menu"]').should('be.visible').should('be.enabled');
					cy.get('button[data-test="goto-macro-create"]').should('be.visible').should('be.enabled');
				});

				it('should navigate to macro menu', () => {
					cy.get('button[data-test="goto-macro-menu"]').click();
					cy.url().should('include', '/macro-menu');
				});

				it('should navigate to macro creation', () => {
					cy.get('button[data-test="goto-macro-create"]').click();
					cy.url().should('include', '/macro-create');
				});
			});

			describe('Macros Table', () => {
				it('should display macros in table format', () => {
					// Verify headers
					cy.get('th').should('contain', 'Name');
					cy.get('th').should('contain', 'Labels');
					cy.get('th').should('contain', 'Type');
					cy.get('th').should('contain', 'Folders');

					// Verify the created macro appears in the list
					cy.get('[data-test="macro-list"]').should('contain', 'My E2E Test Macro');

					cy.get('[data-test="macro-item"]').should('contain', 'My E2E Test Macro').should('contain', 'INBOX').should('contain', 'SENT').should('contain', 'attachment').should('contain', 'My Test Folder').should('contain', 'Another Folder');
				});

				it('should handle empty macro list', () => {
					// Override with empty macros
					cy.intercept('GET', '**/macro-get-all**', {fixture: 'macro-get-all-empty'}).as('getEmptyMacros');
					cy.reload();
					cy.wait('@getEmptyMacros');

					// Verify empty state
					cy.get('[data-test="macro-list"]').should('be.visible');
				});

				it('should handle macro deletion', () => {
					// Click delete button
					cy.get('[data-test="macro-item"]').find('button[data-test="delete-macro"]').click();

					// Verify that the macro is no longer in the list
					cy.get('[data-test="macro-item"]').should('not.exist');
				});

				it('should handle macro editing', () => {
					// Click edit button
					cy.get('[data-test="macro-item"]').first().find('button[data-test="edit-macro"]').click({ force: true });

					// Verify navigation to edit page
					cy.url().should('include', '/macro-create');
				});
			});
		});
	});
});
