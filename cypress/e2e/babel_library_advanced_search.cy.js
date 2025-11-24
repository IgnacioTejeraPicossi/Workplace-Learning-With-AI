// E2E - Babel Library: Advanced Search assertions
describe('Babel Library - Advanced Search', () => {
  it('opens Advanced Search and asserts features list', () => {
    cy.visitHome();
    cy.openSidebarItem('babel-library');
    cy.contains('🏛️ Babel Library').should('exist');
    cy.contains('button', '🔍 Advanced Search').click();
    cy.contains('h2', 'Advanced Search').should('exist');
    cy.contains('h3', '🔍 Search Features').should('exist');
    cy.contains('Full-text search').should('exist');
    cy.contains('Topic filtering').should('exist');
    cy.contains('Type categorization').should('exist');
    cy.contains('Date-based sorting').should('exist');
    cy.contains('Author tracking').should('exist');
  });
});


