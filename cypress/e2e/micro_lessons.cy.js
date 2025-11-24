// E2E - Micro-lessons: modal opens and can be closed
describe('Micro-lessons', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('learning-modules');
    cy.openSidebarItem('micro-lessons', 'learning-modules');
    cy.contains('h2', 'Micro-lesson').should('exist');
  });

  it('opens generation modal and closes it', () => {
    cy.get('input[placeholder="Enter micro-lesson topic"]').type('E2E Testing Topic');
    cy.contains('button', 'Get Micro-lesson').click();
    cy.contains('h2', 'Micro-lesson').should('exist'); // modal title
    cy.get('button[aria-label="Close dialog"]').click();
  });
});


