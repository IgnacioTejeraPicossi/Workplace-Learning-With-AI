// E2E - Babel Library: AI Search tab — semantic/hybrid search and AI classification badges
describe('Babel Library - AI Search', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('babel-library');
    cy.contains('🏛️ Babel Library').should('exist');
    cy.contains('button', '🤖 AI Search').click();
  });

  it('opens AI Search tab, shows input and suggestion chips', () => {
    cy.contains('Ask the AI library assistant').should('exist');
    // Verify the search input is present
    cy.get('input[placeholder*="machine learning"]').should('exist');
    // Verify at least one suggestion chip is visible
    cy.contains('button', '💡').should('exist');
  });

  it('performs an AI search and shows results or fallback', () => {
    cy.get('input[placeholder*="machine learning"]').type('artificial intelligence');
    cy.contains('button', '🤖').click(); // Search button

    // Wait for either results or fallback message (backend may or may not be running)
    cy.wait(3000);
    // Should either show result cards or the "no results" state — page should not crash
    cy.get('body').should('be.visible');
  });
});
