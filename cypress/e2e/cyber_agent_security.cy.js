// E2E - Cybersecurity: Agent Security scan + Findings modal
describe('Cybersecurity - Agent Security', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('cybersecurity');
    cy.contains('button', 'Agent Security').click();
    cy.contains('🤖 Agent Security Monitor').should('exist');
    cy.contains('h3', 'Agent Security Status').should('exist');
  });

  it('opens Findings modal for first agent', () => {
    cy.contains('table tbody tr', '').first().within(() => {
      cy.contains('button', 'Findings').click();
    });
    cy.contains('Security Findings for').should('exist');
    cy.contains('Zero Trust').should('exist');
    cy.contains('Integrity').should('exist');
    cy.contains('DLP (Data Loss Prevention)').should('exist');
    cy.contains('button', 'Close').click();
  });

  it('runs a Scan on first agent and returns to idle', () => {
    cy.contains('table tbody tr', '').first().within(() => {
      cy.contains('button', 'Scan').click();
      cy.contains('button', 'Scanning…', { timeout: 2000 }).should('exist');
    });
    // scan sim is ~5-6s on backend; allow up to 12s for UI to refresh
    cy.wait(12000);
    cy.contains('table tbody tr', '').first().within(() => {
      cy.contains('button', 'Scan').should('exist');
    });
  });
});


