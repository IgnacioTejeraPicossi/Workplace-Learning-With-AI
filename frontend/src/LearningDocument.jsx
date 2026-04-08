import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeContext";

const LearningDocument = () => {
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

  // Fetch real data from Document Analyzer backend
  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        setLoading(true);
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/api/document-analyzer/get-saved-analyses`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
                         // Transform backend data to match frontend format
             const transformedDocs = data.analyses.map(analysis => ({
               id: analysis.id,
               filename: analysis.filename,
               summary: analysis.summary,
               type: analysis.filename.split('.').pop()?.toLowerCase() || 'txt',
               date: analysis.created_at.split('T')[0], // Extract date part
               tags: [analysis.length, analysis.module], // Use length and module as tags
               rating: 9.0, // Default rating for now
               size: `${(analysis.chars / 1024).toFixed(1)} KB`, // Convert chars to KB
               chunks: analysis.chunks,
               chars: analysis.chars,
               length: analysis.length
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
        console.log(`🔍 [LearningDocument] Navigating to document: ${resourceId}, title: "${resourceTitle}"`);
        
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
                summary: targetDoc.summary
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
                         doc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const copyToClipboard = (text) => {
    const msg = t("learningDocumentModule.copiedToClipboard");
    try {
      navigator.clipboard.writeText(text);
      alert(msg);
    } catch (error) {
      console.error('Failed to copy:', error);
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(msg);
    }
  };

  const refreshAnalyses = () => {
    // Re-fetch analyses from backend
    const fetchAnalyses = async () => {
      try {
        setLoading(true);
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/api/document-analyzer/get-saved-analyses`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
                         const transformedDocs = data.analyses.map(analysis => ({
               id: analysis.id,
               filename: analysis.filename,
               summary: analysis.summary,
               type: analysis.filename.split('.').pop()?.toLowerCase() || 'txt',
               date: analysis.created_at.split('T')[0],
               tags: [analysis.length, analysis.module],
               rating: 9.0,
               size: `${(analysis.chars / 1024).toFixed(1)} KB`,
               chunks: analysis.chunks,
               chars: analysis.chars,
               length: analysis.length
             }));
            setDocuments(transformedDocs);
          }
        }
      } catch (error) {
        console.error('Error refreshing analyses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyses();
  };

  const downloadDocument = (doc) => {
    const content = `${t("learningDocumentModule.downloadDocLabel")} ${doc.filename}\n\n${t("learningDocumentModule.downloadSummaryHeading")}\n${doc.summary}\n\n${t("learningDocumentModule.downloadTagsLabel")} ${doc.tags.join(", ")}\n${t("learningDocumentModule.downloadRatingLabel")} ${doc.rating}/10\n${t("learningDocumentModule.downloadDateLabel")} ${doc.date}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.filename}_summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Expand/Collapse functionality
  const handleExpandToggle = (docId) => {
    console.log(`🔍 [DEBUG] Toggling document ${docId}, current expanded state:`, expanded[docId]);
    setExpanded(prev => {
      const newState = {
        ...prev,
        [docId]: !prev[docId]
      };
      console.log(`🔍 [DEBUG] New expanded state:`, newState);
      return newState;
    });
  };

  // Edit functionality
  const handleEdit = (docId, filename, summary) => {
    setEditing(prev => ({
      ...prev,
      [docId]: true
    }));
    setEditContent(prev => ({
      ...prev,
      [docId]: { filename, summary }
    }));
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
                summary: editContent[docId].summary
              }
            : doc
        );
        setDocuments(newDocuments);
      }
      
      setEditing(prev => ({
        ...prev,
        [docId]: false
      }));
      setStatus(t("learningDocumentModule.statusUpdated"));
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus(t("learningDocumentModule.statusUpdateFailed"));
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
    if (window.confirm(t("learningDocumentModule.confirmDelete"))) {
      try {
        console.log(`🗑️ Attempting to delete analysis with ID: ${docId}`);
        
        // Call API to delete from MongoDB
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/api/document-analyzer/delete-analysis/${docId}`, {
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
          console.error(`❌ Delete failed: ${response.status} - ${errorText}`);
          setStatus(t("learningDocumentModule.statusDeleteFailedHttp", { status: response.status }));
          setTimeout(() => setStatus(""), 3000);
        }
      } catch (error) {
        console.error('Delete error:', error);
        setStatus(t("learningDocumentModule.statusDeleteFailed"));
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
          <p style={{ color: colors.textSecondary }}>{t("learningDocumentModule.loadingPage")}</p>
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
          {t("learningDocumentModule.title")}
        </h1>
                 <p style={{ 
           color: colors.textSecondary, 
           fontSize: "16px",
           lineHeight: "1.5"
         }}>
           {t("learningDocumentModule.subtitle")}
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

      {/* Search and Filters */}
      <div style={{ 
        background: colors.cardBackground, 
        borderRadius: "12px", 
        padding: "24px", 
        marginBottom: "24px",
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow
      }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <input
              type="text"
              placeholder={t("learningDocumentModule.searchPlaceholder")}
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

          {/* Filter by Type */}
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
              <option value="all">{t("learningDocumentModule.filterAllTypes")}</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="txt">TXT</option>
              <option value="md">Markdown</option>
            </select>
          </div>

          {/* Sort By */}
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
              <option value="date">{t("learningDocumentModule.sortDate")}</option>
              <option value="name">{t("learningDocumentModule.sortName")}</option>
              <option value="rating">{t("learningDocumentModule.sortRating")}</option>
              <option value="size">{t("learningDocumentModule.sortSize")}</option>
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
            🔄 {loading ? t("learningDocumentModule.loading") : t("learningDocumentModule.refresh")}
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
            {t("learningDocumentModule.showingCount", { filtered: filteredDocuments.length, total: documents.length })}
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
            {t("learningDocumentModule.emptyTitle")}
          </h3>
          <p style={{ 
            color: colors.textSecondary, 
            fontSize: "16px"
          }}>
            {searchTerm || filterType !== "all" 
              ? t("learningDocumentModule.emptyHintFiltered")
              : t("learningDocumentModule.emptyHintDefault")
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
                       {`${doc.filename} - ${t("learningDocumentModule.analyzedSuffix")}`}
                     </h3>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span style={{ 
                        color: colors.textSecondary, 
                        fontSize: "12px"
                      }}>
                        {doc.date}
                      </span>
                      <span style={{ 
                        color: colors.textSecondary, 
                        fontSize: "12px"
                      }}>
                        {doc.size}
                      </span>
                      <span style={{ 
                        color: colors.textSecondary, 
                        fontSize: "12px"
                      }}>
                        {t("learningDocumentModule.chunksCount", { n: doc.chunks })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  padding: "6px 12px",
                  background: colors.background,
                  borderRadius: "20px",
                  border: `1px solid ${colors.border}`
                }}>
                  <span style={{ 
                    color: getRatingColor(doc.rating),
                    fontSize: "14px",
                    fontWeight: "600"
                  }}>
                    {doc.rating}/10
                  </span>
                  <span style={{ fontSize: "16px" }}>⭐</span>
                </div>
              </div>

                                                                                         {/* Summary - REMOVED: List should be compressed by default */}

              {/* Tags */}
              <div style={{ 
                display: "flex", 
                flexWrap: "wrap", 
                gap: "8px",
                marginBottom: "16px"
              }}>
                {doc.tags.map((tag, index) => (
                  <span key={index} style={{
                    background: colors.primaryLight,
                    color: colors.primary,
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500"
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

                             {/* Actions */}
               <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                 <button
                   onClick={() => copyToClipboard(doc.summary)}
                   style={{
                     background: colors.secondary,
                     color: "white",
                     border: "none",
                     borderRadius: "6px",
                     padding: "8px 16px",
                     fontSize: "14px",
                     cursor: "pointer",
                     display: "flex",
                     alignItems: "center",
                     gap: "6px"
                   }}
                 >
                   {t("learningDocumentModule.copySummary")}
                 </button>
                 <button
                   onClick={() => downloadDocument(doc)}
                   style={{
                     background: colors.primary,
                     color: "white",
                     border: "none",
                     borderRadius: "6px",
                     padding: "8px 16px",
                     fontSize: "14px",
                     cursor: "pointer",
                     display: "flex",
                     alignItems: "center",
                     gap: "6px"
                   }}
                 >
                   {t("learningDocumentModule.download")}
                 </button>
                 <button
                   onClick={() => handleExpandToggle(doc.id)}
                   style={{
                     background: colors.background,
                     color: colors.text,
                     border: `1px solid ${colors.border}`,
                     borderRadius: "6px",
                     padding: "8px 16px",
                     fontSize: "14px",
                     cursor: "pointer",
                     display: "flex",
                     alignItems: "center",
                     gap: "6px"
                   }}
                 >
                                                                               {expanded[doc.id] ? t("learningDocumentModule.compress") : t("learningDocumentModule.expand")}
                 </button>
                 <button
                   onClick={() => handleEdit(doc.id, doc.filename, doc.summary)}
                   style={{
                     background: colors.primary,
                     color: "white",
                     border: "none",
                     borderRadius: "6px",
                     padding: "8px 16px",
                     fontSize: "14px",
                     cursor: "pointer",
                     display: "flex",
                     alignItems: "center",
                     gap: "6px"
                   }}
                 >
                   {t("learningDocumentModule.edit")}
                 </button>
                 <button
                   onClick={() => handleDelete(doc.id)}
                   style={{
                     background: "#d32f2f",
                     color: "white",
                     border: "none",
                     borderRadius: "6px",
                     padding: "8px 16px",
                     fontSize: "14px",
                     cursor: "pointer",
                     display: "flex",
                     alignItems: "center",
                     gap: "6px"
                   }}
                 >
                   {t("learningDocumentModule.delete")}
                 </button>
                              </div>

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
                     {t("learningDocumentModule.fullContent")}
                   </h4>
                   
                   {editing[doc.id] ? (
                     <div>
                       <div style={{ marginBottom: "12px" }}>
                         <label style={{ 
                           display: "block", 
                           marginBottom: "4px",
                           color: colors.text,
                           fontWeight: "500"
                         }}>
                           {t("learningDocumentModule.labelFilename")}
                         </label>
                         <input
                           type="text"
                           value={editContent[doc.id]?.filename || ""}
                           onChange={(e) => handleEditChange(doc.id, "filename", e.target.value)}
                           style={{
                             width: "100%",
                             padding: "8px",
                             borderRadius: "4px",
                             border: `1px solid ${colors.border}`,
                             background: colors.cardBackground,
                             color: colors.text
                           }}
                         />
                       </div>
                       
                       <div style={{ marginBottom: "16px" }}>
                         <label style={{ 
                           display: "block", 
                           marginBottom: "4px",
                           color: colors.text,
                           fontWeight: "500"
                         }}>
                           {t("learningDocumentModule.labelSummary")}
                         </label>
                         <textarea
                           value={editContent[doc.id]?.summary || ""}
                           onChange={(e) => handleEditChange(doc.id, "summary", e.target.value)}
                           rows={8}
                           style={{
                             width: "100%",
                             padding: "8px",
                             borderRadius: "4px",
                             border: `1px solid ${colors.border}`,
                             background: colors.cardBackground,
                             color: colors.text,
                             fontFamily: "monospace",
                             resize: "vertical"
                           }}
                         />
                       </div>
                       
                       <div style={{ display: "flex", gap: "8px" }}>
                         <button
                           onClick={() => handleEditSave(doc.id)}
                           style={{
                             background: colors.primary,
                             color: "white",
                             border: "none",
                             borderRadius: "6px",
                             padding: "8px 16px",
                             fontSize: "14px",
                             cursor: "pointer"
                           }}
                         >
                           {t("learningDocumentModule.save")}
                         </button>
                         <button
                           onClick={() => handleEditCancel(doc.id)}
                           style={{
                             background: colors.background,
                             color: colors.text,
                             border: `1px solid ${colors.border}`,
                             borderRadius: "6px",
                             padding: "8px 16px",
                             fontSize: "14px",
                             cursor: "pointer"
                           }}
                         >
                           {t("learningDocumentModule.cancel")}
                         </button>
                       </div>
                     </div>
                   ) : (
                     <div style={{ 
                       color: colors.text,
                       fontSize: "14px",
                       lineHeight: "1.6",
                       whiteSpace: "pre-wrap",
                       maxHeight: "400px",
                       overflowY: "auto"
                     }}>
                       {/* Show additional details when expanded, not duplicate summary */}
                       <div style={{ marginBottom: "16px" }}>
                         <strong>{t("learningDocumentModule.documentDetails")}</strong>
                         <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                           <li>{t("learningDocumentModule.detailOriginalFilename")} {doc.filename}</li>
                           <li>{t("learningDocumentModule.detailFileSize")} {doc.size}</li>
                           <li>{t("learningDocumentModule.detailCharCount")} {doc.chars}</li>
                           <li>{t("learningDocumentModule.detailProcessingChunks")} {doc.chunks}</li>
                           <li>{t("learningDocumentModule.detailAnalysisLength")} {doc.length}</li>
                           <li>{t("learningDocumentModule.detailCreated")} {doc.date}</li>
                         </ul>
                       </div>
                       
                       <div>
                         <strong>{t("learningDocumentModule.fullSummary")}</strong>
                         <div style={{ 
                           marginTop: "8px",
                           padding: "12px",
                           background: colors.cardBackground,
                           borderRadius: "6px",
                           border: `1px solid ${colors.border}`
                         }}>
                           {doc.summary}
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </div>
           ))}
         </div>
      )}

      {/* Quick Actions */}
      <div style={{ 
        marginTop: "32px", 
        textAlign: "center",
        padding: "24px",
        background: colors.cardBackground,
        borderRadius: "12px",
        border: `1px solid ${colors.border}`
      }}>
        <h3 style={{ 
          color: colors.text, 
          marginBottom: "16px",
          fontSize: "18px",
          fontWeight: "500"
        }}>
          {t("learningDocumentModule.quickActionTitle")}
        </h3>
        <p style={{ 
          color: colors.textSecondary, 
          marginBottom: "20px",
          fontSize: "16px"
        }}>
          {t("learningDocumentModule.quickActionBody")}
        </p>
        <button
          onClick={() => window.location.href = "/document-analyzer"}
          style={{
            background: colors.primary,
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {t("learningDocumentModule.goToDocAnalyzer")}
        </button>
      </div>
    </div>
  );
};

export default LearningDocument;
