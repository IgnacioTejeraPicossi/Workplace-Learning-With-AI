// E2E - Babel Library: Add resource and verify appears in Catalog
describe('Babel Library - Add and Verify', () => {
  const title = `E2E Resource ${Date.now()}`;

  it('adds a new resource then finds it in Catalog search', () => {
    cy.visitHome();
    cy.openSidebarItem('babel-library');
    cy.contains('🏛️ Babel Library').should('exist');

    // Go to Add Resource
    cy.contains('button', '➕ Add Resource').click();
    cy.contains('h2', 'Add New Resource').should('exist');

    // Fill form
    cy.get('select').first().select('article');
    cy.get('input[placeholder="Enter resource title..."]').type(title);
    cy.get('input[placeholder="Enter author name..."]').type('E2E Bot');
    cy.get('input[placeholder="Enter topic or category..."]').type('E2E Testing');
    cy.get('textarea[placeholder="Enter resource description..."]').type('Resource created by Cypress E2E');

    cy.contains('button', '📚 Add to Library').click();

    // Back to Catalog and search by title
    cy.contains('button', '📚 Library Catalog').click();
    cy.get('input[placeholder="Search by title, author, or description..."]').clear().type(title);
    cy.contains(title).should('exist');
  });
});


