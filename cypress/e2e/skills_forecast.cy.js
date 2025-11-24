// E2E - Skills Forecast basic interactions
describe('Skills Forecast', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('learning-modules');
    cy.openSidebarItem('skills-forecast', 'learning-modules');
    cy.contains('🔮 Skills Forecasting').should('exist');
  });

  it('enables Get Forecast when input present then clears', () => {
    cy.get('textarea, input[type="text"]').first().type('E2E: improve React, testing, DevOps');
    cy.contains('button', '🔮 Get Forecast').should('not.be.disabled');
    cy.contains('button', '🗑️ Clear').click();
  });
});


