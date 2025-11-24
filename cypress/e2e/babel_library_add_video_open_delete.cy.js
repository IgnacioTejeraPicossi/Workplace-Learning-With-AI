// E2E - Babel Library: Add video with URL, open with Edit to Video Lessons, then delete
describe('Babel Library - Add video, open, delete', () => {
  const title = `E2E Video ${Date.now()}`;
  const url = 'https://www.youtube.com/watch?v=1hHMwLxN6EM';

  it('adds a video resource, opens it via Edit, and deletes it', () => {
    cy.visitHome();
    cy.openSidebarItem('babel-library');
    cy.contains('🏛️ Babel Library').should('exist');

    // Add Resource (video)
    cy.contains('button', '➕ Add Resource').click();
    cy.contains('h2', 'Add New Resource').should('exist');
    cy.get('select').first().select('video');
    cy.get('input[placeholder="Enter resource title..."]').type(title);
    cy.get('input[placeholder="Enter author name..."]').type('E2E Bot');
    cy.get('input[placeholder="Enter topic or category..."]').type('E2E Testing');
    cy.get('textarea[placeholder="Enter resource description..."]').type('E2E video added via Cypress');
    cy.get('input[placeholder="https://www.youtube.com/watch?v=..."]').type(url);
    cy.contains('button', '📚 Add to Library').click();

    // Go to Catalog and locate the newly added video
    cy.contains('button', '📚 Library Catalog').click();
    cy.get('input[placeholder="Search by title, author, or description..."]').clear().type(title);
    cy.contains(title).should('exist');

    // Open with Edit (should route to Video Lessons)
    cy.contains(title).parents('div').first().within(() => {
      cy.contains('✏️ Edit').click();
    });
    cy.contains('🎥 Video-Based Learning').should('exist');

    // Return to Library and delete the resource (uses local delete for added video)
    cy.openSidebarItem('babel-library');
    cy.contains('button', '📚 Library Catalog').click();
    cy.get('input[placeholder="Search by title, author, or description..."]').clear().type(title);
    cy.contains(title).parents('div').first().within(() => {
      cy.contains('🗑️').click();
    });
  });
});


