// E2E - Simulations: start first scenario and verify session header
describe('Simulations module', () => {
  it('opens and starts a scenario', () => {
    cy.visitHome();
    cy.openSidebarItem('learning-modules');
    cy.openSidebarItem('simulations', 'learning-modules');
    cy.contains('🎮 Scenario Simulator').should('exist');
    // Click first scenario card
    cy.get('[style*="grid"] div').first().click({ force: true });
    // After starting, should show interactive session header text
    cy.contains('Interactive Training Scenario', { timeout: 10000 }).should('exist');
    // Step indicator starts at Step 1 of 4
    cy.contains(/Step \s*1\s* of \s*4/i).should('exist');

    // Choose Option A and verify progress to next step (Step 1 → Step 2)
    cy.contains('🎯 Interactive Simulation Active').parent().find('h5').first().invoke('text').then((q1) => {
      cy.contains(/^A\)/).click({ force: true });
      // Wait for response to render and "Next Step" button to appear
      cy.contains('Next Step', { timeout: 10000 }).should('exist').click();
      // Option selectors should be visible again for the next step
      cy.contains(/^A\)/, { timeout: 10000 }).should('exist');
      // Question changed for next step
      cy.contains('🎯 Interactive Simulation Active').parent().find('h5').first().invoke('text').should((q2) => {
        expect(q2.trim()).not.to.eq(q1.trim());
      });
      // Step indicator progressed to Step 2 of 4
      cy.contains(/Step \s*2\s* of \s*4/i, { timeout: 10000 }).should('exist');
    });
  });
});


