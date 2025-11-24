// Cypress Smoke E2E - Core navigation and key module checks
describe('App Smoke Navigation', () => {
  beforeEach(() => {
    cy.visitHome();
  });

  it('navigates to Help → Agent Theory & Documentation and opens the featured guide', () => {
    cy.openSidebarItem('help'); // open group
    cy.openSidebarItem('agent-theory-docs', 'help');
    cy.contains('Welcome to Agent Theory & Documentation').should('exist');
    cy.contains('button', 'Open in Theory').click();
    cy.contains('10 Core Agent Types (Poster + Guide)').should('exist');
  });

  it('navigates to Cybersecurity and opens Tools & Frameworks and Agent Security', () => {
    cy.openSidebarItem('cybersecurity');
    cy.contains('🔒 Cybersecurity').should('exist');
    cy.contains('button', 'Tools & Frameworks').click();
    cy.contains('🧰 Tools & Frameworks').should('exist');
    cy.contains('button', 'Agent Security').click();
    cy.contains('🤖 Agent Security Monitor').should('exist');
  });

  it('opens Micro-lessons and API Config modules', () => {
    cy.openSidebarItem('learning-modules'); // expand group
    cy.openSidebarItem('micro-lessons', 'learning-modules');
    cy.contains('h2', 'Micro-lesson').should('exist');

    cy.openSidebarItem('api-config');
    cy.contains('🔧 API Configuration').should('exist');
  });

  it('opens Robomind Clinic', () => {
    cy.openSidebarItem('robomind-clinic');
    cy.contains('🧠 Robomind Clinic').should('exist');
  });
});


