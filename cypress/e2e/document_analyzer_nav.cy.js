// E2E - Document Analyzer: submodule navigation and headers
describe('Document Analyzer - Submodules', () => {
  it('opens Documents Analyzer, Learning Document, Agentic RAG Analyzer, and Agentic RAG Documents', () => {
    cy.visitHome();

    // Documents Analyzer
    cy.openSidebarItem('document-analyzer');
    cy.openSidebarItem('documents-analyzer', 'document-analyzer');
    cy.contains('📄 Document Analyzer').should('exist');

    // Learning Document
    cy.openSidebarItem('document-analyzer');
    cy.openSidebarItem('learning-document', 'document-analyzer');
    cy.contains('📚 Learning Document Library').should('exist');

    // Agentic RAG Analyzer
    cy.openSidebarItem('document-analyzer');
    cy.openSidebarItem('agentic-rag', 'document-analyzer');
    cy.contains('🚀 Agentic RAG Analyzer').should('exist');

    // Agentic RAG Documents
    cy.openSidebarItem('document-analyzer');
    cy.openSidebarItem('agentic-rag-document', 'document-analyzer');
    cy.contains('📋 Agentic RAG Documents').should('exist');
  });
});


