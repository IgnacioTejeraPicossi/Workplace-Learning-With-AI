// E2E - Babel Library: Catalog search and filter
describe('Babel Library - Catalog actions', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('babel-library');
    cy.contains('🏛️ Babel Library').should('exist');
    cy.contains('button', '📚 Library Catalog').click();
  });

  it('types in search and changes topic filter', () => {
    cy.get('input[placeholder="Search by title, author, or description..."]').type('AI');
    cy.get('select').first().select(0); // All Topics
    // If there is at least one other topic option, select it
    cy.get('select').first().then($sel => {
      if ($sel[0].options.length > 1) {
        cy.wrap($sel).select(1);
      }
    });
  });
});


