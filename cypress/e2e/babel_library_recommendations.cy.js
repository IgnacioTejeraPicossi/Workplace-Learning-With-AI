// E2E - Babel Library: Recommendations panel and Learning Path Generator (Phase 2)
describe('Babel Library - Recommendations & Learning Path', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('babel-library');
    cy.contains('🏛️ Babel Library').should('exist');
    cy.contains('button', '🤖 AI Search').click();
  });

  it('shows the Recommended For You section', () => {
    // The recommendations panel renders when AI Search tab opens
    cy.contains('Recommended for you').should('exist');
  });

  it('opens Learning Path Generator and has input + generate button', () => {
    // Learning Path is inside a collapsible <details>
    cy.contains('Learning Path Generator').click();
    // The input and button should now be visible
    cy.get('input[placeholder*="machine learning"]').should('have.length.gte', 1);
    cy.contains('button', 'Generate path').should('exist');
  });

  it('can type a goal and click generate (graceful if backend unavailable)', () => {
    cy.contains('Learning Path Generator').click();
    // Find the learning path input (second input in AI Search or specific placeholder)
    cy.get('input[placeholder*="machine learning"]').last().clear().type('cloud computing');
    cy.contains('button', 'Generate path').click();
    // Wait and verify no crash
    cy.wait(2000);
    cy.get('body').should('be.visible');
  });
});
