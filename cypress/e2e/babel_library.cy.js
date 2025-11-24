// E2E - Babel Library basic navigation
describe('Babel Library', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('babel-library');
    cy.contains('🏛️ Babel Library').should('exist');
  });

  it('switches to Advanced Search tab', () => {
    cy.contains('button', '🔍 Advanced Search').click();
    cy.contains('h2', 'Advanced Search').should('exist');
  });
});


