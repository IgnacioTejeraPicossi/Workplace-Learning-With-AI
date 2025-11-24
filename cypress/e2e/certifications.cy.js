// E2E - Certifications basic navigation
describe('Certifications', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('learning-modules');
    cy.openSidebarItem('certifications', 'learning-modules');
    cy.contains('Certification Path Recommendation').should('exist');
  });

  it('switches between tabs', () => {
    cy.contains('button', 'Get Recommendations').click();
    cy.contains('button', 'Study Plan').click();
    cy.contains('button', 'Practice Test').click();
    cy.contains('button', 'History').click();
  });
});


