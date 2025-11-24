// Custom Cypress commands for navigating the app sidebar
// Note: relies on data-testid attributes defined in Sidebar.jsx

Cypress.Commands.add('visitHome', () => {
  cy.visit('/');
});

Cypress.Commands.add('expandSidebar', (key) => {
  cy.get(`[data-testid="sidebar-${key}"]`).click();
});

Cypress.Commands.add('openSidebarItem', (key, parentKey) => {
  if (parentKey) {
    cy.expandSidebar(parentKey);
  }
  cy.get(`[data-testid="sidebar-${key}"]`).click();
});


