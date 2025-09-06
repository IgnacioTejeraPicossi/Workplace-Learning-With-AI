// Cypress E2E Test - Human-Humanoid Lab Plan Generation
describe('Human-Humanoid Lab - Plan Generation', () => {
  beforeEach(() => {
    cy.visit('/');
    // Navigate to Human-Humanoid Lab
    cy.get('[data-testid="sidebar-human-humanoid-lab"]').click();
  });

  it('should generate a plan and render steps', () => {
    // Navigate to Task Playbook tab
    cy.get('[data-cy="tab-task"]').click();
    
    // Fill in task details
    cy.get('input[placeholder*="Task Name"]').clear().type('Test Picking Task');
    cy.get('textarea[placeholder*="Description"]').clear().type('Pick item from shelf A1 and place into bin B2');
    
    // Add a step hint
    cy.get('button').contains('+ Add Step').click();
    cy.get('input[placeholder*="Step 1 description"]').type('Navigate to shelf A1');
    
    // Generate plan
    cy.get('button').contains('Generate AI Plan').click();
    
    // Wait for plan generation
    cy.get('button').contains('Generating...').should('exist');
    cy.get('button').contains('Generate AI Plan').should('exist', { timeout: 10000 });
    
    // Check if plan was generated
    cy.get('[data-cy="plan-generated"]').should('exist');
    cy.get('ol > li').should('have.length.at.least', 3);
    
    // Navigate to Overview to see plan status
    cy.get('[data-cy="tab-overview"]').click();
    cy.get('[data-cy="overview"]').contains('Plan:').should('exist');
  });

  it('should show error when trying to generate plan without twin', () => {
    // Navigate to Task Playbook tab
    cy.get('[data-cy="tab-task"]').click();
    
    // Try to generate plan without configuring twin
    cy.get('button').contains('Generate AI Plan').click();
    
    // Should show warning
    cy.get('p').contains('Please configure your Digital Twin first').should('exist');
  });
});
