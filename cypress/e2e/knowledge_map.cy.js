// E2E - Knowledge Map: basic search, counter, and web search panel
describe('Map of Knowledge', () => {
  it('opens, shows search and counter, and opens web search panel', () => {
    cy.visitHome();
    cy.openSidebarItem('knowledge-map');
    // Search input and Test Search button
    cy.get('input[placeholder="Search topics..."]').should('exist');
    cy.contains('button', 'Test Search').should('exist');
    // Counter "Showing X of Y topics"
    cy.contains(/Showing\s+\d+\s+of\s+\d+\s+topics/i, { timeout: 10000 }).should('exist');

    // Trigger web search
    cy.get('input[placeholder="Search topics..."]').clear().type('AI');
    cy.contains('button', 'Test Search').click();
    // Side panel should appear with either searching or results for "AI"
    cy.contains(/Results for "AI"|Searching for "AI"/, { timeout: 10000 }).should('exist');

    // Change mastery level filter (sanity check UI hooks)
    cy.contains('All Levels').parent().find('select').select('low');
    cy.contains(/Showing\s+\d+\s+of\s+\d+\s+topics/i).should('exist');

    // Select the first category from All Categories and assert counter may change
    cy.contains(/Showing\s+\d+\s+of\s+\d+\s+topics/i).invoke('text').then((beforeText) => {
      const beforeMatch = beforeText.match(/Showing\s+(\d+)\s+of\s+(\d+)\s+topics/i);
      const beforeX = beforeMatch ? parseInt(beforeMatch[1], 10) : null;

      cy.contains('All Categories').parent().find('select').then($sel => {
        const opts = $sel[0].options;
        if (opts.length > 1) {
          // select the first real category (index 1)
          cy.wrap($sel).select(opts[1].value);
          cy.contains(/Showing\s+\d+\s+of\s+\d+\s+topics/i).invoke('text').then((afterText) => {
            const afterMatch = afterText.match(/Showing\s+(\d+)\s+of\s+(\d+)\s+topics/i);
            const afterX = afterMatch ? parseInt(afterMatch[1], 10) : null;
            // Tolerant: if both numbers parsed, expect a change; otherwise just assert counter exists
            if (beforeX !== null && afterX !== null) {
              expect(afterX).to.not.eq(beforeX);
            }
          });
        }
      });
    });
  });
});


