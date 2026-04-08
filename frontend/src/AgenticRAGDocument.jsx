import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeContext";

const AgenticRAGDocument = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState({});
  const [editing, setEditing] = useState({});
  const [editContent, setEditContent] = useState({});
  const [status, setStatus] = useState("");

  // Fetch real data from Agentic RAG backend
  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        setLoading(true);
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/api/agentic-rag/get-analyses`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Transform backend data to match frontend format
            const transformedDocs = data.analyses.map(analysis => ({
              id: analysis._id,
              filename: analysis.filename,
              question: analysis.question,
              answer: analysis.answer,
              type: analysis.filename.split('.').pop()?.toLowerCase() || 'txt',
              date: analysis.created_at.split('T')[0], // Extract date part
              tags: [analysis.module, 'Agentic RAG'], // Use module and type as tags
              rating: 9.0, // Default rating for now
              size: `${(analysis.answer?.length || 0 / 1024).toFixed(1)} KB`, // Convert answer length to KB
              scores: analysis.scores || {},
              parameters: analysis.parameters || {},
              citations: analysis.citations || [],
              // Store all additional analysis data for complete display
              metrics: analysis.metrics || {},
              router_selected: analysis.router_selected || [],
              used_paragraphs: analysis.used_paragraphs || [],
              run_id: analysis.run_id || '',
              elapsed_sec: analysis.elapsed_sec || 0
            }));
            setDocuments(transformedDocs);
          } else {
            console.error('Failed to fetch analyses:', data.error);
            setDocuments([]);
          }
        } else {
          console.error('Failed to fetch analyses:', response.status);
          setDocuments([]);
        }
      } catch (error) {
        console.error('Error fetching analyses:', error);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, []);

  // Handle navigation events from Babel Library
  useEffect(() => {
    const handleNavigateToModule = (event) => {
      const { resourceId, resourceTitle, targetPage, action, autoExpand, expandDocument } = event.detail;
      
      if (targetPage === 'document' && resourceId && expandDocument) {
        console.log(`🔍 [AgenticRAGDocument] Navigating to document: ${resourceId}, title: "${resourceTitle}"`);
        
        // Find the document by ID
        const targetDoc = documents.find(doc => doc.id === resourceId);
        if (targetDoc) {
          // Expand the specific document
          setExpanded(prev => ({
            ...prev,
            [resourceId]: true
          }));
          
          // If action is edit, also start editing
          if (action === 'edit') {
            setEditing(prev => ({
              ...prev,
              [resourceId]: true
            }));
            
            // Set edit content
            setEditContent(prev => ({
              ...prev,
              [resourceId]: {
                filename: targetDoc.filename,
                question: targetDoc.question,
                answer: targetDoc.answer
              }
            }));
          }
          
          // Scroll to the document (optional)
          setTimeout(() => {
            const element = document.getElementById(`document-${resourceId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
    };

    window.addEventListener('navigateToModule', handleNavigateToModule);
    return () => window.removeEventListener('navigateToModule', handleNavigateToModule);
  }, [documents]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === "all" || doc.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(b.date) - new Date(a.date);
      case "name":
        return a.filename.localeCompare(b.filename);
      case "rating":
        return b.rating - a.rating;
      case "size":
        return parseFloat(b.size) - parseFloat(a.size);
      default:
        return 0;
    }
  });

  const getFileIcon = (type) => {
    switch (type) {
      case "pdf": return "📄";
      case "docx": return "📝";
      case "txt": return "📃";
      case "md": return "📋";
      default: return "📎";
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 9.0) return "#22c55e"; // Green
    if (rating >= 8.0) return "#eab308"; // Yellow
    if (rating >= 7.0) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  const refreshAnalyses = () => {
    window.location.reload();
  };

  const toggleExpanded = (docId) => {
    setExpanded(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  const startEditing = (docId) => {
    const doc = documents.find(d => d.id === docId);
    console.log('🔍 [DEBUG] Starting edit for docId:', docId);
    console.log('🔍 [DEBUG] Found document:', doc);
    console.log('🔍 [DEBUG] Document answer:', doc?.answer);
    if (doc) {
      setEditContent(prev => ({
        ...prev,
        [docId]: {
          filename: doc.filename,
          question: doc.question,
          answer: doc.answer
        }
      }));
      setEditing(prev => ({
        ...prev,
        [docId]: true
      }));
    }
  };

  const handleEditChange = (docId, field, value) => {
    setEditContent(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        [field]: value
      }
    }));
  };

  const handleEditSave = async (docId) => {
    try {
      // Here you would typically call an API to update the document
      // For now, we'll just update the local state
      const updatedDoc = documents.find(doc => doc.id === docId);
      if (updatedDoc) {
        const newDocuments = documents.map(doc => 
          doc.id === docId 
            ? { 
                ...doc, 
                filename: editContent[docId].filename,
                question: editContent[docId].question,
                answer: editContent[docId].answer
              }
            : doc
        );
        setDocuments(newDocuments);
      }
      
      setEditing(prev => ({
        ...prev,
        [docId]: false
      }));
      setStatus(t("agenticRagDocumentModule.statusUpdated"));
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus(t("agenticRagDocumentModule.statusUpdateFailed"));
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const handleEditCancel = (docId) => {
    setEditing(prev => ({
      ...prev,
      [docId]: false
    }));
    setEditContent(prev => ({
      ...prev,
      [docId]: undefined
    }));
  };

  // Delete functionality
  const handleDelete = async (docId) => {
    if (window.confirm(t("agenticRagDocumentModule.confirmDelete"))) {
      try {
        console.log(`🗑️ Attempting to delete analysis with ID: ${docId}`);
        
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/api/agentic-rag/delete-analysis/${docId}`, {
          method: 'DELETE',
        });
        
        console.log(`📡 Delete response status: ${response.status}`);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`📊 Delete response:`, result);
          
          if (result.success) {
            // Remove from local state
            const newDocuments = documents.filter(doc => doc.id !== docId);
            setDocuments(newDocuments);
            
            // Clear expanded/editing state for deleted document
            setExpanded(prev => {
              const newExpanded = { ...prev };
              delete newExpanded[docId];
              return newExpanded;
            });
            setEditing(prev => {
              const newEditing = { ...prev };
              delete newEditing[docId];
              return newEditing;
            });
            
            setStatus(`✅ ${result.message}`);
            setTimeout(() => setStatus(""), 3000);
          } else {
            setStatus(`❌ ${result.message}`);
            setTimeout(() => setStatus(""), 3000);
          }
        } else {
          const errorText = await response.text();
          console.error(`❌ Delete failed with status ${response.status}:`, errorText);
          setStatus(t("agenticRagDocumentModule.statusDeleteFailed", { status: response.status }));
          setTimeout(() => setStatus(""), 3000);
        }
      } catch (error) {
        console.error('❌ Error deleting analysis:', error);
        setStatus(t("agenticRagDocumentModule.statusDeleteError", { message: error.message }));
        setTimeout(() => setStatus(""), 3000);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: "24px", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        minHeight: "400px"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔄</div>
          <p style={{ color: colors.textSecondary }}>{t("agenticRagDocumentModule.loadingPage")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ 
          color: colors.primary, 
          marginBottom: "8px",
          fontSize: "28px",
          fontWeight: "600"
        }}>
          {t("agenticRagDocumentModule.title")}
        </h1>
        <p style={{ 
          color: colors.textSecondary, 
          fontSize: "16px",
          lineHeight: "1.5"
        }}>
          {t("agenticRagDocumentModule.subtitle")}
        </p>
        
        {/* Status Messages */}
        {status && (
          <div style={{
            marginTop: "12px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: status.includes("✅") ? "#dcfce7" : "#fef2f2",
            color: status.includes("✅") ? "#166534" : "#dc2626",
            border: `1px solid ${status.includes("✅") ? "#bbf7d0" : "#fecaca"}`,
            fontSize: "14px",
            fontWeight: "500"
          }}>
            {status}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ 
        background: colors.cardBackground, 
        borderRadius: "12px", 
        padding: "24px",
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow,
        marginBottom: "24px"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          {/* Search */}
          <div style={{ flex: "1", minWidth: "200px" }}>
            <input
              type="text"
              placeholder={t("agenticRagDocumentModule.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                background: colors.background,
                color: colors.text,
                fontSize: "14px"
              }}
            />
          </div>

          {/* Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                background: colors.background,
                color: colors.text,
                fontSize: "14px"
              }}
            >
              <option value="all">{t("agenticRagDocumentModule.filterAllTypes")}</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="txt">TXT</option>
              <option value="md">MD</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                background: colors.background,
                color: colors.text,
                fontSize: "14px"
              }}
            >
              <option value="date">{t("agenticRagDocumentModule.sortDate")}</option>
              <option value="name">{t("agenticRagDocumentModule.sortName")}</option>
              <option value="rating">{t("agenticRagDocumentModule.sortRating")}</option>
              <option value="size">{t("agenticRagDocumentModule.sortSize")}</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshAnalyses}
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              border: "none",
              background: colors.primary,
              color: "white",
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            🔄 {loading ? t("agenticRagDocumentModule.loading") : t("agenticRagDocumentModule.refresh")}
          </button>
        </div>

        {/* Results Count */}
        <div style={{ 
          marginTop: "16px", 
          padding: "12px 16px", 
          background: colors.background,
          borderRadius: "6px",
          border: `1px solid ${colors.border}`
        }}>
          <span style={{ 
            color: colors.textSecondary, 
            fontSize: "14px"
          }}>
            {t("agenticRagDocumentModule.showingCount", { filtered: filteredDocuments.length, total: documents.length })}
          </span>
        </div>
      </div>

      {/* Documents Grid */}
      {sortedDocuments.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 24px",
          background: colors.cardBackground,
          borderRadius: "12px",
          border: `1px solid ${colors.border}`
        }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>📭</div>
          <h3 style={{ 
            color: colors.text, 
            marginBottom: "8px",
            fontSize: "20px",
            fontWeight: "500"
          }}>
            {t("agenticRagDocumentModule.emptyTitle")}
          </h3>
          <p style={{ 
            color: colors.textSecondary, 
            fontSize: "16px"
          }}>
            {searchTerm || filterType !== "all" 
              ? t("agenticRagDocumentModule.emptyHintFiltered")
              : t("agenticRagDocumentModule.emptyHintDefault")
            }
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {sortedDocuments.map(doc => (
            <div key={doc.id} id={`document-${doc.id}`} style={{
              background: colors.cardBackground,
              borderRadius: "12px",
              padding: "24px",
              border: `1px solid ${colors.border}`,
              boxShadow: colors.shadow,
              transition: "all 0.2s ease"
            }}>
              {/* Document Header */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "flex-start",
                marginBottom: "16px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>{getFileIcon(doc.type)}</span>
                  <div>
                    <h3 style={{ 
                      color: colors.text, 
                      margin: "0 0 4px 0",
                      fontSize: "18px",
                      fontWeight: "600"
                    }}>
                      {editing[doc.id] ? (
                        <input
                          type="text"
                          value={editContent[doc.id]?.filename || doc.filename}
                          onChange={(e) => handleEditChange(doc.id, 'filename', e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "4px",
                            border: `1px solid ${colors.border}`,
                            background: colors.background,
                            color: colors.text,
                            fontSize: "16px"
                          }}
                        />
                      ) : (
                        `${doc.filename} - ${t("agenticRagDocumentModule.analyzedSuffix")}`
                      )}
                    </h3>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "12px",
                      flexWrap: "wrap"
                    }}>
                      <span style={{ 
                        color: colors.textSecondary, 
                        fontSize: "12px"
                      }}>
                        📅 {doc.date}
                      </span>
                      <span style={{ 
                        color: colors.textSecondary, 
                        fontSize: "12px"
                      }}>
                        📏 {doc.size}
                      </span>
                      <span style={{ 
                        color: getRatingColor(doc.rating), 
                        fontSize: "12px",
                        fontWeight: "500"
                      }}>
                        ⭐ {doc.rating}
                      </span>
                      {doc.tags.map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            background: colors.primaryLight,
                            color: colors.primary,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: "500"
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: "flex", 
                  gap: "8px",
                  flexShrink: 0
                }}>
                  {editing[doc.id] ? (
                    <>
                      <button
                        onClick={() => handleEditSave(doc.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "none",
                          background: "#22c55e",
                          color: "white",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        {t("agenticRagDocumentModule.save")}
                      </button>
                      <button
                        onClick={() => handleEditCancel(doc.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #6b7280",
                          background: "transparent",
                          color: "#6b7280",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        {t("agenticRagDocumentModule.cancel")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleExpanded(doc.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: `1px solid ${colors.border}`,
                          background: colors.background,
                          color: colors.text,
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        {expanded[doc.id] ? t("agenticRagDocumentModule.compress") : t("agenticRagDocumentModule.expand")}
                      </button>
                      <button
                        onClick={() => startEditing(doc.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #3b82f6",
                          background: "#eff6ff",
                          color: "#3b82f6",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        {t("agenticRagDocumentModule.edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #ef4444",
                          background: "#fef2f2",
                          color: "#dc2626",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        {t("agenticRagDocumentModule.delete")}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Question Preview (always visible) */}
              <div style={{ 
                marginBottom: "12px",
                padding: "12px",
                background: colors.background,
                borderRadius: "6px",
                border: `1px solid ${colors.border}`
              }}>
                <strong style={{ color: colors.text }}>{t("agenticRagDocumentModule.questionLabel")}</strong>
                <p style={{ 
                  color: colors.text, 
                  margin: "8px 0 0 0",
                  fontSize: "14px",
                  lineHeight: "1.5"
                }}>
                  {editing[doc.id] ? (
                    <textarea
                      value={editContent[doc.id]?.question || doc.question}
                      onChange={(e) => handleEditChange(doc.id, 'question', e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        border: `1px solid ${colors.border}`,
                        background: colors.cardBackground,
                        color: colors.text,
                        fontSize: "14px",
                        minHeight: "60px",
                        resize: "vertical"
                      }}
                    />
                  ) : (
                    doc.question
                  )}
                </p>
              </div>

              {/* Quality Scores (always visible) */}
              {doc.scores && Object.keys(doc.scores).length > 0 && (
                <div style={{ 
                  display: "flex", 
                  gap: "12px", 
                  flexWrap: "wrap",
                  marginBottom: "12px"
                }}>
                  {/* Solo mostrar scores numéricos, no el comentario */}
                  {Object.entries(doc.scores)
                    .filter(([key, value]) => key !== 'comment' && typeof value === 'number')
                    .map(([key, value]) => (
                      <div key={key} style={{ textAlign: "center" }}>
                        <div style={{ 
                          fontSize: "16px", 
                          fontWeight: "600",
                          color: value >= 8 ? "#22c55e" : value >= 6 ? "#eab308" : "#ef4444"
                        }}>
                          {value}/10
                        </div>
                        <div style={{ color: colors.textSecondary, fontSize: "10px" }}>
                          {t(`agenticRagModule.${key}`, { defaultValue: key.charAt(0).toUpperCase() + key.slice(1) })}
                        </div>
                      </div>
                    ))}
                  
                  {/* Comentario con estilos específicos */}
                  {doc.scores.comment && (
                    <div style={{ 
                      marginTop: "8px",
                      padding: "8px 12px",
                      background: colors.background,
                      borderRadius: "6px",
                      border: `1px solid ${colors.border}`,
                      width: "100%"
                    }}>
                      <div style={{ 
                        color: colors.primary, 
                        fontSize: "12px", 
                        fontWeight: "500",
                        marginBottom: "4px"
                      }}>
                        {t("agenticRagModule.comment")}
                      </div>
                      <div style={{ 
                        color: colors.textSecondary, 
                        fontSize: "12px",
                        lineHeight: "1.4",
                        fontStyle: "italic"
                      }}>
                        {doc.scores.comment}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Expanded Content */}
              {expanded[doc.id] && (
                <div style={{ 
                  marginTop: "16px",
                  padding: "16px",
                  background: colors.background,
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`
                }}>
                  <h4 style={{ 
                    color: colors.primary, 
                    marginBottom: "12px",
                    fontSize: "16px",
                    fontWeight: "500"
                  }}>
                    {t("agenticRagDocumentModule.fullContent")}
                  </h4>
                  
                  {/* Answer */}
                  <div style={{ marginBottom: "16px" }}>
                    <strong style={{ color: colors.text }}>{t("agenticRagDocumentModule.answerLabel")}</strong>
                    <div style={{ 
                      marginTop: "8px",
                      padding: "12px",
                      background: colors.cardBackground,
                      borderRadius: "6px",
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                      fontSize: "14px",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap"
                    }}>
                      {editing[doc.id] ? (
                        (() => {
                          console.log('🔍 [DEBUG] Rendering textarea for doc.id:', doc.id);
                          console.log('🔍 [DEBUG] editContent[doc.id]:', editContent[doc.id]);
                          console.log('🔍 [DEBUG] editContent[doc.id]?.answer:', editContent[doc.id]?.answer);
                          console.log('🔍 [DEBUG] doc.answer:', doc.answer);
                          console.log('🔍 [DEBUG] Final value:', editContent[doc.id]?.answer || doc.answer);
                          return (
                            <textarea
                              value={editContent[doc.id]?.answer || doc.answer}
                              onChange={(e) => handleEditChange(doc.id, 'answer', e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                borderRadius: "4px",
                                border: `1px solid ${colors.border}`,
                                background: colors.background,
                                color: colors.text,
                                fontSize: "14px",
                                minHeight: "120px",
                                resize: "vertical"
                              }}
                              placeholder={t("agenticRagDocumentModule.placeholderAnswer")}
                            />
                          );
                        })()
                      ) : (
                        doc.answer
                      )}
                    </div>
                  </div>

                                     {/* Parameters Used */}
                   {doc.parameters && Object.keys(doc.parameters).length > 0 && (
                     <div style={{ marginBottom: "16px" }}>
                       <strong style={{ color: colors.text }}>{t("agenticRagDocumentModule.parametersUsed")}</strong>
                       <div style={{ 
                         marginTop: "8px",
                         padding: "12px",
                         background: colors.cardBackground,
                         borderRadius: "6px",
                         border: `1px solid ${colors.border}`,
                         fontSize: "12px",
                         color: colors.textSecondary
                       }}>
                         <div>{t("agenticRagDocumentModule.paramDepth")} {doc.parameters.depth}</div>
                         <div>{t("agenticRagDocumentModule.paramK")} {doc.parameters.k_init}</div>
                         <div>{t("agenticRagDocumentModule.paramHybrid")} {doc.parameters.use_hybrid ? t("agenticRagDocumentModule.yes") : t("agenticRagDocumentModule.no")}</div>
                         <div>{t("agenticRagDocumentModule.paramMaxParagraphs")} {doc.parameters.max_paragraphs}</div>
                       </div>
                     </div>
                   )}

                   {/* Performance Metrics */}
                   {doc.metrics && Object.keys(doc.metrics).length > 0 && (
                     <div style={{ marginBottom: "16px" }}>
                       <strong style={{ color: colors.text }}>{t("agenticRagModule.performanceMetrics")}</strong>
                       <div style={{ 
                         marginTop: "8px",
                         padding: "12px",
                         background: colors.cardBackground,
                         borderRadius: "6px",
                         border: `1px solid ${colors.border}`,
                         fontSize: "12px",
                         color: colors.textSecondary
                       }}>
                         <div>{t("agenticRagDocumentModule.lineTotalTokens", { n: doc.metrics.total_in + doc.metrics.total_out })}</div>
                         <div>{t("agenticRagDocumentModule.lineCost", { n: `$${doc.metrics.total_cost_usd?.toFixed(6) || '0.000000'}` })}</div>
                         <div>{t("agenticRagDocumentModule.lineLatency", { n: doc.metrics.total_latency_ms })}</div>
                         <div>{t("agenticRagDocumentModule.lineTotalTime", { n: doc.elapsed_sec })}</div>
                       </div>
                     </div>
                   )}

                   {/* Analysis Trace */}
                   <div style={{ marginBottom: "16px" }}>
                     <strong style={{ color: colors.text }}>{t("agenticRagDocumentModule.analysisTraceHeading")}</strong>
                     <div style={{ 
                       marginTop: "8px",
                       padding: "12px",
                       background: colors.cardBackground,
                       borderRadius: "6px",
                       border: `1px solid ${colors.border}`,
                       fontSize: "12px",
                       color: colors.textSecondary
                     }}>
                       <div>{t("agenticRagDocumentModule.lineRouter", { value: doc.router_selected?.join(", ") || t("agenticRagModule.none") })}</div>
                       <div>{t("agenticRagDocumentModule.lineParagraphs", { value: doc.used_paragraphs?.join(", ") || t("agenticRagModule.none") })}</div>
                       <div>{t("agenticRagDocumentModule.lineRunId", { value: doc.run_id || t("agenticRagModule.none") })}</div>
                     </div>
                   </div>

                  {/* Citations */}
                  {doc.citations && doc.citations.length > 0 && (
                    <div>
                      <strong style={{ color: colors.text }}>{t("agenticRagDocumentModule.citationsHeading")}</strong>
                      <div style={{ 
                        marginTop: "8px",
                        display: "grid",
                        gap: "8px"
                      }}>
                        {doc.citations.map((citation, index) => (
                          <div key={index} style={{
                            padding: "8px 12px",
                            background: colors.cardBackground,
                            borderRadius: "4px",
                            border: `1px solid ${colors.border}`,
                            fontSize: "12px"
                          }}>
                            <div style={{ 
                              color: colors.primary, 
                              fontWeight: "500",
                              marginBottom: "4px"
                            }}>
                              {t("agenticRagModule.idLabel")} {citation.id}
                            </div>
                            <div style={{ 
                              color: colors.text,
                              fontStyle: "italic"
                            }}>
                              {citation.snippet}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgenticRAGDocument;
