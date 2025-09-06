// Cypress E2E Test - Human-Humanoid Lab Safety & Judge
describe('Human-Humanoid Lab - Safety & Judge', () => {
  beforeEach(() => {
    cy.visit('/');
    // Navigate to Human-Humanoid Lab
    cy.get('[data-testid="sidebar-human-humanoid-lab"]').click();
  });

  it('should pass safety check and compute judge score', () => {
    // First, generate a plan
    cy.get('[data-cy="tab-task"]').click();
    
    // Fill in task details
    cy.get('input[placeholder*="Task Name"]').clear().type('Test Safety Task');
    cy.get('textarea[placeholder*="Description"]').clear().type('Test safety evaluation');
    
    // Generate plan
    cy.get('button').contains('Generate AI Plan').click();
    cy.get('button').contains('Generate AI Plan').should('exist', { timeout: 10000 });
    
    // Run simulation
    cy.get('[data-cy="tab-sim"]').click();
    cy.get('button').contains('Run Simulation').click();
    cy.get('button').contains('Run Simulation').should('exist', { timeout: 10000 });
    
    // Run safety check
    cy.get('[data-cy="tab-safety"]').click();
    cy.get('button').contains('Run Safety Check').click();
    
    // Wait for safety check
    cy.get('button').contains('Checking...').should('exist');
    cy.get('button').contains('Run Safety Check').should('exist', { timeout: 10000 });
    
    // Check safety results
    cy.get('[data-cy="safety-results"]').should('exist');
    cy.get('span').contains('SAFETY PASSED').should('exist');
    
    // Navigate to Overview to see complete workflow
    cy.get('[data-cy="tab-overview"]').click();
    cy.get('[data-cy="overview"]').contains('Safety:').should('exist');
  });

  it('should show warning when trying to run safety check without plan', () => {
    // Navigate to Safety & Ethics without generating a plan
    cy.get('[data-cy="tab-safety"]').click();
    
    // Try to run safety check
    cy.get('button').contains('Run Safety Check').click();
    
    // Should show warning
    cy.get('p').contains('Please configure Twin, Task, and Plan before running safety check').should('exist');
  });

  it('should allow configuring safety context', () => {
    // Navigate to Safety & Ethics
    cy.get('[data-cy="tab-safety"]').click();
    
    // Check safety context checkboxes
    cy.get('input[type="checkbox"]').first().should('be.checked');
    cy.get('input[type="checkbox"]').first().uncheck();
    cy.get('input[type="checkbox"]').first().should('not.be.checked');
    
    // Modify payload weight
    cy.get('input[type="number"]').clear().type('5.5');
    cy.get('input[type="number"]').should('have.value', '5.5');
  });
});
