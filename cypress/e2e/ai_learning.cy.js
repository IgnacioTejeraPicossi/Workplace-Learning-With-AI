// E2E - AI Learning & Training basic rendering and lesson presence
describe('AI Learning & Training', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('learning-modules');
    cy.openSidebarItem('ai-learning', 'learning-modules');
    cy.contains('🤖 AI Learning & Training').should('exist');
  });

  it('renders lessons and shows Psychopathia Machinalis entry', () => {
    cy.contains('📚 Lessons').click();
    cy.contains(/Psychopathia Machinalis/i).should('exist');
  });
});


