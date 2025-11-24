// E2E - Web Search query flow
describe('Web Search', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('learning-modules');
    cy.openSidebarItem('web-search', 'learning-modules');
    cy.contains('Web Search (AI + Internet)').should('exist');
  });

  it('runs a search and shows a results container', () => {
    cy.get('input[placeholder="🔍 Ask anything..."]').type('OpenAI vs local LLMs');
    cy.contains('button', '🔎 Search').click();
    cy.contains('🔍 Search Results for').should('exist');
  });
});


