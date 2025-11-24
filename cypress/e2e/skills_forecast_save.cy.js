// E2E - Skills Forecast: attempt to run and save forecast if backend available
describe('Skills Forecast - Generate and Save (conditional)', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('learning-modules');
    cy.openSidebarItem('skills-forecast', 'learning-modules');
    cy.contains('🔮 Skills Forecasting').should('exist');
  });

  it('runs forecast and saves when results appear', () => {
    cy.get('textarea, input[type="text"]').first().type('E2E user: focus on React, testing, DevOps in next 6 months');
    cy.contains('button', '🔮 Get Forecast').click();
    // Wait up to 25s for forecast content to appear (streaming + processing)
    cy.contains('📊 Your Skills Forecast', { timeout: 25000 }).then(($el) => {
      if ($el && $el.length) {
        cy.contains('button', '📋 Save Forecast', { timeout: 5000 }).click();
        cy.on('window:alert', (txt) => {
          expect(txt).to.contain('Forecast saved successfully');
        });
      }
    });
  });
});


