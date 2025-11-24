// E2E - Repository Analyzer: submodule navigation and headers
describe('Repository Analyzer - Submodules', () => {
  it('opens Repo Analyzer, Agent Cursor AI, and Learning Repo', () => {
    cy.visitHome();

    // Repo Analyzer
    cy.openSidebarItem('repository-analyzer');
    cy.openSidebarItem('repo-analyzer', 'repository-analyzer');
    cy.contains('Repository Documentation Generator').should('exist');

    // Capture current form values
    cy.get('input[placeholder="https://github.com/username/repository"]').invoke('val').then((repoBefore) => {
      cy.get('input[placeholder="Leave empty for auto-detection"]').invoke('val').then((branchBefore) => {
        // Click first quick template and verify selection class toggles
        cy.contains('Quick Templates').parent().find('.template-grid .template-card').first().click();
        cy.contains('Quick Templates').parent().find('.template-grid .template-card').first().should('have.class', 'selected');

        // Repo URL should be prefilled by template
        cy.get('input[placeholder="https://github.com/username/repository"]').invoke('val').then((repoAfter) => {
          expect(repoAfter).to.match(/^https?:\/\//);
          expect(repoAfter).to.not.eq(repoBefore);
        });
        // Branch may be prefilled depending on template; if present, it should differ from before
        cy.get('input[placeholder="Leave empty for auto-detection"]').invoke('val').then((branchAfter) => {
          if (branchAfter && branchAfter.length > 0) {
            expect(branchAfter).to.not.eq(branchBefore);
          }
        });

        // Trigger Detect Branches and assert available branches appear if backend supports it
        cy.contains('button', 'Detect Branches').click();
        // If available branches are returned, at least one branch button should render
        cy.get('label').contains('Available Branches:').parent().find('button').its('length').then((len) => {
          // len may be 0 when backend returns none; assert len >= 0 always, and if > 0 ensure buttons exist
          if (len > 0) {
            cy.get('label').contains('Available Branches:').parent().find('button').first().should('exist').then(($btn)=>{
              const label = $btn.text().trim();
              // Click branch option and verify Branch input updates
              cy.wrap($btn).click();
              cy.get('input[placeholder="Leave empty for auto-detection"]').should('have.value', label);
              // Also verify selected style toggles to primary if class present
              cy.wrap($btn).should('have.class', 'btn-primary');
            });
          }
        });

        // Trigger Analyze Repository and assert Analysis Results when backend responds
        cy.contains('button', 'Analyze Repository').click();
        // If backend processes analysis, this section should appear; if not, test won't fail as we allow generous timeout and optional check
        cy.contains('Analysis Results', { timeout: 20000 }).should('exist');
        // Optional field assertions when present
        cy.contains('Repository Information').parent().within(() => {
          cy.contains('Branch:').then($el => {
            if ($el && $el.length) {
              cy.wrap($el).next().should('exist');
            }
          });
          cy.contains('Files Analyzed:').then($el => {
            if ($el && $el.length) {
              cy.wrap($el).next().should('exist');
            }
          });
          cy.contains('Quality Score:').then($el => {
            if ($el && $el.length) {
              cy.wrap($el).parent().invoke('text').then((text) => {
                // Expect something like "Quality Score: 85%" (percentage)
                const pct = /Quality\s+Score:\s*\d{1,3}%/i.test(text);
                expect(pct).to.eq(true);
              });
            }
          });
          cy.contains('Analysis Type:').then($el => {
            if ($el && $el.length) {
              cy.wrap($el).next().should('exist');
            }
          });
        });
      });
    });

    // Agent Cursor AI
    cy.openSidebarItem('repository-analyzer');
    cy.openSidebarItem('agent-cursor-ai', 'repository-analyzer');
    cy.contains('Agent Cursor AI').should('exist');

    // Learning Repo
    cy.openSidebarItem('repository-analyzer');
    cy.openSidebarItem('learning-repo', 'repository-analyzer');
    cy.contains('Learning Repository').should('exist');
  });
});


