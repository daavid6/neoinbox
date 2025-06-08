describe('Authentication Page', () => {
	const viewports = [
		{ name: 'desktop', viewport: 'macbook-13' },
		{ name: 'mobile', viewport: 'iphone-x' },
	];

	viewports.forEach((vp) => {
		describe(`${vp.name} - ${vp.viewport}`, () => {
			beforeEach(() => {
				cy.visit('/authenticate', {
					onBeforeLoad: (win) => {
						// Mock window.open before the page loads
						win.open = cy
							.stub()
							.as('windowOpen')
							.callsFake(() => {
								setTimeout(() => {
									const messageEvent = new MessageEvent('message', {
										data: { code: 'fake-auth-code' },
										origin: win.location.origin,
									});
									win.dispatchEvent(messageEvent);
								}, 500);

								return {
									closed: false,
									close: cy.stub(),
									focus: cy.stub(),
								};
							});
					},
				});

				// Mock authentication API endpoints
				cy.intercept('POST', '**/auth-url', { fixture: 'auth-url.json' }).as('authUrlRequest');
				cy.intercept('POST', '**/auth-token', { fixture: 'auth-token.json' }).as('validateCodeRequest');
				cy.intercept('GET', '**/macro-get-all**', { fixture: 'macro-get-all.json' }).as('getMacros');
				cy.intercept('GET', '**/watch-status**', { fixture: 'watch-status.json' }).as('getWatchStatus');
			});

			describe('Authenticate', () => {
				it('should display the login page', () => {
					cy.get('h1').should('be.visible').should('not.be.empty').should('have.length', 1);
					cy.get('h2').should('be.visible').should('not.be.empty').should('have.length', 1);
					cy.get('h3').should('be.visible').should('not.be.empty');

					cy.get('[data-test="image"]').should('be.visible').should('have.attr', 'src').and('not.be.empty');
					cy.get('[data-test="image"]').should('be.visible').should('have.attr', 'alt').and('not.be.empty');

					cy.get('button[data-test="login-button"]').should('be.visible');
					cy.get('button[data-test="signup-button"]').should('be.visible');
				});

				it('should navigate to pricing page', () => {
					cy.get('button[data-test="pricing-button"]').should('be.visible').click();
					cy.url().should('include', '/pricing');

					cy.get('h3[data-test="basic-tier-section-title"]').should('be.visible').should('have.text', 'Basic');
					cy.get('h3[data-test="premium-tier-section-title"]').should('be.visible').should('have.text', 'Premium');
					cy.get('h3[data-test="enterprise-tier-section-title"]').should('be.visible').should('have.text', 'Enterprise');
				});

				it('should complete the authentication flow', () => {
					// Step 1: Click login button
					cy.get('button[data-test="login-button"]').should('be.visible').click();

					// Step 2: Verify popup was opened
					cy.get('@windowOpen').should('have.been.called');

					// Step 3: Wait for code validation after popup message
					cy.wait('@validateCodeRequest', { timeout: 5000 });

					// Step 4: Verify successful navigation to protected route
					cy.url().should('include', '/watch-control');

					// Step 5: Verify localStorage was set with auth data
					cy.window().then((win) => {
						expect(win.localStorage.getItem('userId')).to.equal('test-user-123');
						expect(win.localStorage.getItem('jwtToken')).to.equal('fake-jwt-token');
						expect(win.localStorage.getItem('isLoggedIn')).to.equal('true');
					});

					// Step 6: Verify the created macro appears in the list
					cy.get('[data-test="macro-list"]').should('contain', 'My E2E Test Macro');
					cy.get('[data-test="macro-item"]').should('contain', 'My E2E Test Macro').should('contain', 'INBOX').should('contain', 'SENT').should('contain', 'attachment').should('contain', 'My Test Folder').should('contain', 'Another Folder');
				});
			});
		});
	});
});
