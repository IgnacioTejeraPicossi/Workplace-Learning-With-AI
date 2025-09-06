// Cypress E2E Test - Human-Humanoid Lab Simulation
describe('Human-Humanoid Lab - Simulation', () => {
  beforeEach(() => {
    cy.visit('/');
    // Navigate to Human-Humanoid Lab
    cy.get('[data-testid="sidebar-human-humanoid-lab"]').click();
  });

  it('should run simulation after planning and show KPIs', () => {
    // First, generate a plan
    cy.get('[data-cy="tab-task"]').click();
    
    // Fill in task details
    cy.get('input[placeholder*="Task Name"]').clear().type('Test Simulation Task');
    cy.get('textarea[placeholder*="Description"]').clear().type('Simulate picking operation');
    
    // Generate plan
    cy.get('button').contains('Generate AI Plan').click();
    cy.get('button').contains('Generate AI Plan').should('exist', { timeout: 10000 });
    
    // Navigate to Sim Arena
    cy.get('[data-cy="tab-sim"]').click();
    
    // Run simulation
    cy.get('button').contains('Run Simulation').click();
    
    // Wait for simulation to complete
    cy.get('button').contains('Simulating...').should('exist');
    cy.get('button').contains('Run Simulation').should('exist', { timeout: 10000 });
    
    // Check simulation results
    cy.get('[data-cy="sim-results"]').should('exist');
    cy.get('div').contains('Total Time').should('exist');
    cy.get('div').contains('Minor Events').should('exist');
    cy.get('div').contains('Avg Step Time').should('exist');
  });

  it('should show warning when trying to simulate without plan', () => {
    // Navigate to Sim Arena without generating a plan
    cy.get('[data-cy="tab-sim"]').click();
    
    // Try to run simulation
    cy.get('button').contains('Run Simulation').click();
    
    // Should show warning
    cy.get('p').contains('Please generate a plan first before running simulation').should('exist');
  });
});
