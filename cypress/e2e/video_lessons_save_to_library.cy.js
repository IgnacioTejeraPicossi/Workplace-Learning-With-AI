// E2E - Save a video from Video Lessons and verify it appears in Babel Library, then cleanup
describe('Video Lessons → Library integration', () => {
  const title = `E2E Saved Video ${Date.now()}`;
  const url = 'https://www.youtube.com/watch?v=1hHMwLxN6EM';

  it('saves video and verifies presence in Library, then deletes', () => {
    // Open Video Lessons
    cy.visitHome();
    cy.openSidebarItem('learning-modules');
    cy.openSidebarItem('video-lessons', 'learning-modules');
    cy.contains('🎥 Video-Based Learning').should('exist');

    // Fill URL, title, topic and save
    cy.get('input[placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."]').clear().type(url);
    cy.get('input[placeholder*="Enter a descriptive title"]').clear().type(title);
    cy.get('input[placeholder="e.g., Programming, Leadership, Design"]').clear().type('E2E Testing');
    cy.contains('button', '💾 Save Video').click();

    // Navigate to Babel Library and search for the video by title
    cy.openSidebarItem('babel-library');
    cy.contains('🏛️ Babel Library').should('exist');
    cy.contains('button', '📚 Library Catalog').click();
    // Allow backend write/read roundtrip
    cy.wait(2000);
    cy.get('input[placeholder="Search by title, author, or description..."]').clear().type(title);
    cy.contains(title, { timeout: 10000 }).should('exist');

    // Delete the record via 🗑️ (videos saved via backend expose delete button)
    cy.contains(title).parents('div').first().within(() => {
      cy.contains('🗑️').click();
    });
  });
});


