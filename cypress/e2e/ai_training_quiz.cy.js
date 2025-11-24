// E2E - AI Learning & Training: complete a quiz and verify progress tag
describe('AI Learning - Complete Quiz', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('learning-modules');
    cy.openSidebarItem('ai-learning', 'learning-modules');
    cy.contains('🤖 AI Learning & Training').should('exist');
    cy.contains('📚 Lessons').click();
  });

  it('opens a lesson, navigates to quiz, submits, and shows completed tag', () => {
    // Open a lesson that includes a quiz (any card with "🧠 Quiz included")
    cy.contains('🧠 Quiz included').first().parents('div').first().click();

    // Click Next until Take Quiz appears (cap to 12 iterations)
    let steps = 0;
    function nextOrQuiz() {
      if (steps++ > 12) return;
      cy.contains('button', '📝 Take Quiz').then(($btn) => {
        if ($btn.length) {
          $btn.click();
        } else {
          cy.contains('button', 'Next →').click();
          nextOrQuiz();
        }
      });
    }
    nextOrQuiz();

    // Answer all questions by picking the first option in each
    cy.get('input[type="radio"]').then(($radios) => {
      const names = new Set();
      $radios.each((_, el) => names.add(el.name));
      Array.from(names).forEach((name) => {
        cy.get(`input[name="${name}"]`).first().check({ force: true });
      });
    });

    cy.contains('button', '📤 Submit Quiz').should('not.be.disabled').click();
    cy.contains(/Excellent|Good job|Keep studying/).should('exist');
    cy.contains('button', 'Continue').click();

    // Back to lessons and verify tag
    cy.contains('button', '← Back to Lessons').click();
    cy.contains('✅ Quiz completed').should('exist');
  });
});


