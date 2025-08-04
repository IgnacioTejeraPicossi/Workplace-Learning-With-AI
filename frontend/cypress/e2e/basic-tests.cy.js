describe('Basic App Tests', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000')
  })

  it('should load the main application', () => {
    cy.get('body').should('be.visible')
  })

  it('should have the main navigation', () => {
    cy.get('[data-testid="sidebar"]').should('exist')
  })

  it('should display dashboard by default', () => {
    cy.contains('Dashboard').should('be.visible')
  })

  it('should have working navigation', () => {
    cy.contains('AI Study Buddy').click()
    cy.url().should('include', '/ai-study-buddy')
  })

  it('should have knowledge map accessible', () => {
    cy.contains('Map of Knowledge').click()
    cy.url().should('include', '/knowledge-map')
  })

  it('should have simulator working', () => {
    cy.contains('Simulator').click()
    cy.url().should('include', '/simulator')
  })
}) 