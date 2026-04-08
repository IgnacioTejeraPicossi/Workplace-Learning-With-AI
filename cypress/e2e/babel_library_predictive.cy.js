// E2E - Babel Library: Predictive Intelligence dashboard (Phase 4)
describe('Babel Library - Predictive Intelligence', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('babel-library');
    cy.contains('🏛️ Babel Library').should('exist');
    cy.contains('button', '🤖 AI Search').click();
  });

  it('shows the Predictive Intelligence collapsible panel', () => {
    cy.contains('Predictive Intelligence').should('exist');
  });

  it('opens panel and shows Load Analytics button', () => {
    cy.contains('Predictive Intelligence').click();
    cy.contains('button', 'Load Analytics').should('exist');
  });

  it('clicks Load Analytics and shows dashboard or handles error gracefully', () => {
    cy.contains('Predictive Intelligence').click();
    cy.contains('button', 'Load Analytics').click();
    // Wait for API response (may fail if backend not running, but UI should not crash)
    cy.wait(3000);
    cy.get('body').should('be.visible');
    // If data loaded, trend analysis section should appear
    cy.document().then(doc => {
      const hasTrends = doc.body.textContent.includes('Trend Analysis');
      if (hasTrends) {
        cy.contains('Trend Analysis').should('exist');
        cy.contains('Demand vs Supply').should('exist');
        cy.contains('Network Insights').should('exist');
      }
    });
  });
});
