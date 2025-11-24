// E2E - Team Dynamics header and auth notice
describe('Team Dynamics', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('learning-modules');
    cy.openSidebarItem('team-dynamics', 'learning-modules');
    cy.contains('Team Dynamics Analyzer').should('exist');
  });

  it('shows sign-in notice or signed-in banner', () => {
    cy.contains(/Please sign in|Signed in as/).should('exist');
  });
});


