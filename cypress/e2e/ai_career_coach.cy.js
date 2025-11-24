// E2E - AI Career Coach: smoke test
describe('AI Career Coach module', () => {
  it('opens and shows header', () => {
    cy.visitHome();
    cy.openSidebarItem('learning-modules');
    cy.openSidebarItem('ai-career-coach', 'learning-modules');
    cy.contains('🎯 AI Career Coach').should('exist');
  });
});


