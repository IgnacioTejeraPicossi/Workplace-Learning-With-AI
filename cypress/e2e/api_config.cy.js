// E2E - API Config: switch provider and save keys
describe('API Configuration', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('api-config');
    cy.contains('🔧 API Configuration').should('exist');
  });

  it('switches to OpenAI and saves a dummy key locally', () => {
    cy.contains('button', '🚀 OpenAI API').click();
    cy.get('input[placeholder="sk-..."]').clear().type('sk-TEST');
    cy.contains('button', '💾 Save Keys').click();
    cy.contains('API configuration saved successfully!', { timeout: 3000 }).should('exist');
  });
});


