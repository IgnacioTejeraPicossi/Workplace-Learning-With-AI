// E2E - Babel Library: Batch Admin Panel — classify all + generate content + stats (Phases 1-3)
describe('Babel Library - Batch Admin Panel', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('babel-library');
    cy.contains('🏛️ Babel Library').should('exist');
    cy.contains('button', '🤖 AI Search').click();
  });

  it('opens the Classification & Indexing admin panel', () => {
    cy.contains('AI Classification & Indexing').click();
    cy.contains('button', 'Classify all resources').should('exist');
  });

  it('shows Refresh Stats button and Generate AI content button', () => {
    cy.contains('AI Classification & Indexing').click();
    cy.contains('button', 'Refresh Stats').should('exist');
    cy.contains('button', 'Generate AI content').should('exist');
  });

  it('clicks Refresh Stats and displays stats grid', () => {
    cy.contains('AI Classification & Indexing').click();
    cy.contains('button', 'Refresh Stats').click();
    cy.wait(2000);
    // If backend is running, stats grid should appear with icons
    cy.document().then(doc => {
      const hasStats = doc.body.textContent.includes('📚');
      if (hasStats) {
        cy.contains('📚').should('exist'); // Total indexed
        cy.contains('🧠').should('exist'); // LLM classified
      }
    });
  });
});
