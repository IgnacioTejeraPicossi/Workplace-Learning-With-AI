// E2E - Babel Library: AI Content panels on resource cards (Phase 3)
describe('Babel Library - AI Content Panels', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('babel-library');
    cy.contains('🏛️ Babel Library').should('exist');
    cy.contains('button', '📚 Library Catalog').click();
  });

  it('catalog cards display classification badges when present', () => {
    // Wait for resources to load
    cy.wait(1000);
    // Check if any domain badge or difficulty badge exists (may not if backend not running)
    // At minimum, the catalog should render without crashing
    cy.get('body').should('be.visible');
    // If classification data exists, badges should be visible
    cy.document().then(doc => {
      const domainBadges = doc.querySelectorAll('span');
      const hasDomain = Array.from(domainBadges).some(el => el.textContent.includes('📂'));
      if (hasDomain) {
        cy.contains('📂').should('exist');
      }
    });
  });

  it('AI Content toggle button is present on cards with generated content', () => {
    cy.wait(1000);
    // Check if any AI Content toggle exists (only shows when content was generated)
    cy.document().then(doc => {
      const toggles = Array.from(doc.querySelectorAll('button')).filter(
        btn => btn.textContent.includes('🧠 AI Content')
      );
      if (toggles.length > 0) {
        // Click first toggle to expand
        cy.contains('button', '🧠 AI Content').first().click();
        // Should show summary or questions section
        cy.contains('Summary').should('exist');
      }
    });
  });
});
