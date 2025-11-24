// E2E - Babel Library: Search and open a resource via Edit button (navigates to module)
describe('Babel Library - Persistence and Open', () => {
  it('searches and opens first resource with Edit', () => {
    cy.visitHome();
    cy.openSidebarItem('babel-library');
    cy.contains('🏛️ Babel Library').should('exist');
    cy.contains('button', '📚 Library Catalog').click();

    // Find and click first "✏️ Edit"
    cy.contains('✏️ Edit', { timeout: 5000 }).first().click();

    // Assert we navigated to one of the known module headers
    const candidates = [
      '🎥 Video-Based Learning',
      'Certification Path Recommendation',
      '🎯 AI Career Coach',
      '🧠 Robomind Clinic',
      '🤖 AI Learning & Training'
    ];
    cy.contains(new RegExp(candidates.join('|'))).should('exist');
  });
});


