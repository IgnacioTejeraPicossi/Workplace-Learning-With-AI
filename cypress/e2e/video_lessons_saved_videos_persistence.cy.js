// E2E - Video Lessons: Saved Videos persistence inside the module
describe('Video Lessons - Saved Videos persistence', () => {
  const title = `E2E VL Persist ${Date.now()}`;
  const url = 'https://www.youtube.com/watch?v=1hHMwLxN6EM';

  it('saves a video and finds it in Saved Videos list, then deletes it', () => {
    cy.visitHome();
    cy.openSidebarItem('learning-modules');
    cy.openSidebarItem('video-lessons', 'learning-modules');
    cy.contains('🎥 Video-Based Learning').should('exist');

    // Save the video
    cy.get('input[placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."]').clear().type(url);
    cy.get('input[placeholder*="Enter a descriptive title"]').clear().type(title);
    cy.get('input[placeholder="e.g., Programming, Leadership, Design"]').clear().type('E2E Testing');
    cy.contains('button', '💾 Save Video').click();

    // Ensure Saved Videos section is on screen and filter by the title
    cy.contains('h3', '🎬 Saved Videos').scrollIntoView();
    cy.contains('h2', 'Saved Videos', { timeout: 10000 }).should('exist');
    cy.contains('h2', 'Saved Videos').parent().within(() => {
      cy.get('input[type="text"]').first().clear().type(title);
    });

    // Verify the saved video appears
    cy.contains('🎥 ' + title, { timeout: 10000 }).should('exist');

    // Expand the card and verify iframe
    cy.contains('🎥 ' + title).parents('[data-video-id]').first().within(() => {
      cy.contains('📂 Expand').click();
    });
    cy.contains('🎥 ' + title).parents('[data-video-id]').first().find('iframe').should('be.visible');

    // Delete from Saved Videos (confirm dialog)
    cy.on('window:confirm', () => true);
    cy.contains('🎥 ' + title).parents('[data-video-id]').first().within(() => {
      cy.contains('Delete').click({ force: true });
    });
  });
});


