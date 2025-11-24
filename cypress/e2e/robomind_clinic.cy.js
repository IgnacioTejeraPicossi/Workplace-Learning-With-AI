// E2E - Robomind Clinic smoke
describe('Robomind Clinic', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('robomind-clinic');
    cy.contains('🧠 Robomind Clinic').should('exist');
  });

  it('shows header illustration and intro text', () => {
    cy.get('img[alt="Robomind Clinic — Identity Fracture"]').should('be.visible');
    cy.contains('Screen AI runs for Psychopathia Machinalis').should('exist');
  });
});


