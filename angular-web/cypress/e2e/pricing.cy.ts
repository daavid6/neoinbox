describe('Pricing Component E2E Tests', () => {
	const viewports = [
		{ name: 'desktop', viewport: 'macbook-13' },
		{ name: 'mobile', viewport: 'iphone-x' },
	];

	viewports.forEach((vp) => {
		describe(`${vp.name} - ${vp.viewport}`, () => {
			beforeEach(() => {
				cy.viewport(vp.viewport as Cypress.ViewportPreset);
				cy.visit('/pricing');
			});

			it('should display the pricing page with all tiers', () => {
				// Check for the main header
				cy.get('h2').should('be.visible').should('not.be.empty');

				// Check for the Basic tier
				cy.get('div[data-test="basic-tier-section"]').should('be.visible');
				cy.get('h3[data-test="basic-tier-section-title"]').should('be.visible').should('not.be.empty');
				cy.get('button[data-test="basic-tier-section-button"]').should('be.visible').should('not.be.empty').click();

				// Check for the Premium tier
				cy.get('div[data-test="premium-tier-section"]').should('be.visible');
				cy.get('h3[data-test="premium-tier-section-title"]').should('be.visible').should('not.be.empty');
				cy.get('button[data-test="premium-tier-section-button"]').should('be.visible').should('not.be.empty').click();

				// Check for the Enterprise tier
				cy.get('div[data-test="enterprise-tier-section"]').should('be.visible');
				cy.get('h3[data-test="enterprise-tier-section-title"]').should('be.visible').should('not.be.empty');
				cy.get('button[data-test="enterprise-tier-section-button"]').should('be.visible').should('not.be.empty').click();

				// Check for the contact section
				cy.get('section[data-test="contact-section"]').should('be.visible');
				cy.get('h3[data-test="contact-section-title"]').should('be.visible').should('not.be.empty');
				cy.get('button[data-test="contact-section-button"]').should('be.visible').should('not.be.empty').click();
			});

			it('should navigate to the home page when the logo is clicked', () => {
				cy.get('span[data-test="header-logo"]').click();
				cy.url().should('include', '/authenticate');
			});

			it('should navigate to the home page when the Home button is clicked', () => {
				cy.get('button[data-test="header-home-button"]').contains('Home').click();
				cy.url().should('include', '/authenticate');
			});

			it('should appears a FAQ button', () => {
				cy.get('button[data-test="header-faq-button"]').contains('FAQ').click();
			});
		});
	});
});
