describe('Macro Menu Page', () => {
	const viewports = [
		{ name: 'desktop', viewport: 'macbook-13' },
		{ name: 'mobile', viewport: 'iphone-x' },
	];

	viewports.forEach((vp) => {
		describe(`${vp.name} - ${vp.viewport}`, () => {
			beforeEach(() => {
				cy.viewport(vp.viewport as Cypress.ViewportPreset);

				// Mock API responses
				cy.intercept('GET', '**/macro-get-all**', { fixture: 'macro-get-all.json' }).as('getMacros');
				cy.intercept('POST', '**/macro-create', { fixture: 'macro-create.json' }).as('createMacro');
				cy.intercept('DELETE', '**/macro-delete**', { fixture: 'macro-delete.json' }).as('deleteMacro');

				cy.visit('/macro-menu', {
					onBeforeLoad: (win) => {
						// Mock localStorage auth data
						win.localStorage.setItem('userId', 'test-user-123');
						win.localStorage.setItem('jwtToken', 'mock-jwt-token-for-testing');
						win.localStorage.setItem('accessToken', 'mock-access-token');
						win.localStorage.setItem('refreshToken', 'mock-refresh-token');
						win.localStorage.setItem('isLoggedIn', 'true');
					},
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

				it('should navigate to create macro page', () => {
					cy.get('[data-test="create-macro-button"]').should('be.visible').click();
					cy.url().should('include', '/macro-create');
				});
			});
		});
	});
});
