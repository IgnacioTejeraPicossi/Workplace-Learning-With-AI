// E2E - Cybersecurity: Tools & Frameworks (OWASP + ZAP mini-lab + presets)
describe('Cybersecurity - Tools & Frameworks', () => {
  beforeEach(() => {
    cy.visitHome();
    cy.openSidebarItem('cybersecurity');
    cy.contains('button', 'Tools & Frameworks').click();
    cy.contains('🧰 Tools & Frameworks').should('exist');
  });

  it('saves/loads a project preset and copies Jira markdown', () => {
    cy.get('input[placeholder="my-service"]').clear().type('e2e-demo');
    cy.contains('button', '💾 Save Preset').click();
    cy.contains('button', '📥 Load Preset').click();
    cy.contains('button', '📋 Copy Jira Markdown').click();
  });

  it('parses ZAP JSON into OWASP checklist', () => {
    const zap = `{"site":[{"alerts":[
      {"name":"SQL Injection","riskdesc":"High (High)","evidence":"xss"},
      {"name":"Security Misconfiguration","riskdesc":"Medium (Medium)","desc":"configuration missing security headers"},
      {"name":"Vulnerable Component: Outdated Library","riskdesc":"High (High)","desc":"outdated library vulnerable component detected"},
      {"name":"Authentication / Session Management","riskdesc":"High (High)","desc":"session fixation possible"},
      {"name":"Data Integrity","riskdesc":"High (High)","desc":"integrity tamper risk"},
      {"name":"Server-Side Request Forgery","riskdesc":"Critical (Critical)","desc":"ssrf via image fetch"}
    ]}],"generated":"2025-11-21T10:00:00Z"}`;

    cy.get('#zap-json').clear().type(zap, { delay: 0 });
    cy.contains('button', '🧪 Parse into OWASP checklist').click();

    // Verify key rows updated by heuristic parser
    const assertRow = (id, status, severity) => {
      cy.contains('td', id).parent('tr').within(() => {
        cy.get('select').eq(0).should('have.value', status);
        cy.get('select').eq(1).should('have.value', severity);
      });
    };
    assertRow('A03', 'issue', 'high');
    assertRow('A05', 'issue', 'medium');
    assertRow('A06', 'issue', 'high');
    assertRow('A07', 'issue', 'high');
    assertRow('A08', 'issue', 'high');
    assertRow('A10', 'issue', 'critical');
  });
});


