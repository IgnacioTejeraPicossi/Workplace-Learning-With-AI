import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";

const AgenticRAGDocument = () => {
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
        const response = await fetch('http://localhost:8000/api/agentic-rag/get-analyses');
        
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
              elapsed_sec: analysis.elapsed_sec || 0,
              // Create a more descriptive display name
              displayName: `${analysis.filename} - Agentic Analysis`
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
                answer: editContent[docId].answer,
                displayName: `${editContent[docId].filename} - Agentic Analysis`
              }
            : doc
        );
        setDocuments(newDocuments);
      }
      
      setEditing(prev => ({
        ...prev,
        [docId]: false
      }));
      setStatus("✅ Document updated successfully");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("❌ Failed to update document");
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
    if (window.confirm("Are you sure you want to delete this analysis?")) {
      try {
        console.log(`🗑️ Attempting to delete analysis with ID: ${docId}`);
        
        const response = await fetch(`http://localhost:8000/api/agentic-rag/delete-analysis/${docId}`, {
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
          setStatus(`❌ Failed to delete document (${response.status})`);
          setTimeout(() => setStatus(""), 3000);
        }
      } catch (error) {
        console.error('❌ Error deleting analysis:', error);
        setStatus(`❌ Error deleting document: ${error.message}`);
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
          <p style={{ color: colors.textSecondary }}>Loading Agentic RAG documents...</p>
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
          📋 Agentic RAG Documents
        </h1>
        <p style={{ 
          color: colors.textSecondary, 
          fontSize: "16px",
          lineHeight: "1.5"
        }}>
          Browse, search, and manage your saved Agentic RAG analyses with quality metrics and citations.
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
              placeholder="Search documents, questions, or answers..."
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
              <option value="all">All Types</option>
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
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="rating">Sort by Rating</option>
              <option value="size">Sort by Size</option>
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
            🔄 {loading ? "Loading..." : "Refresh"}
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
            Showing {filteredDocuments.length} of {documents.length} documents
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
            No documents found
          </h3>
          <p style={{ 
            color: colors.textSecondary, 
            fontSize: "16px"
          }}>
            {searchTerm || filterType !== "all" 
              ? "Try adjusting your search or filters"
              : "Start by analyzing some documents in the Agentic RAG module"
            }
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {sortedDocuments.map(doc => (
            <div key={doc.id} style={{
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
                        doc.displayName
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
                        💾 Save
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
                        ❌ Cancel
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
                        {expanded[doc.id] ? "📖 Compress" : "📖 Expand"}
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
                        ✏️ Edit
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
                        🗑️ Delete
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
                <strong style={{ color: colors.text }}>Question:</strong>
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
                          {key.charAt(0).toUpperCase() + key.slice(1)}
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
                        Comment:
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
                    Full Content
                  </h4>
                  
                  {/* Answer */}
                  <div style={{ marginBottom: "16px" }}>
                    <strong style={{ color: colors.text }}>Answer:</strong>
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
                        />
                      ) : (
                        doc.answer
                      )}
                    </div>
                  </div>

                                     {/* Parameters Used */}
                   {doc.parameters && Object.keys(doc.parameters).length > 0 && (
                     <div style={{ marginBottom: "16px" }}>
                       <strong style={{ color: colors.text }}>Parameters Used:</strong>
                       <div style={{ 
                         marginTop: "8px",
                         padding: "12px",
                         background: colors.cardBackground,
                         borderRadius: "6px",
                         border: `1px solid ${colors.border}`,
                         fontSize: "12px",
                         color: colors.textSecondary
                       }}>
                         <div>Depth: {doc.parameters.depth}</div>
                         <div>K: {doc.parameters.k_init}</div>
                         <div>Hybrid: {doc.parameters.use_hybrid ? "Yes" : "No"}</div>
                         <div>Max Paragraphs: {doc.parameters.max_paragraphs}</div>
                       </div>
                     </div>
                   )}

                   {/* Performance Metrics */}
                   {doc.metrics && Object.keys(doc.metrics).length > 0 && (
                     <div style={{ marginBottom: "16px" }}>
                       <strong style={{ color: colors.text }}>Performance Metrics:</strong>
                       <div style={{ 
                         marginTop: "8px",
                         padding: "12px",
                         background: colors.cardBackground,
                         borderRadius: "6px",
                         border: `1px solid ${colors.border}`,
                         fontSize: "12px",
                         color: colors.textSecondary
                       }}>
                         <div>Total Tokens: {doc.metrics.total_in + doc.metrics.total_out}</div>
                         <div>Cost (USD): ${doc.metrics.total_cost_usd?.toFixed(6) || '0.000000'}</div>
                         <div>Latency: {doc.metrics.total_latency_ms}ms</div>
                         <div>Total Time: {doc.elapsed_sec}s</div>
                       </div>
                     </div>
                   )}

                   {/* Analysis Trace */}
                   <div style={{ marginBottom: "16px" }}>
                     <strong style={{ color: colors.text }}>Analysis Trace:</strong>
                     <div style={{ 
                       marginTop: "8px",
                       padding: "12px",
                       background: colors.cardBackground,
                       borderRadius: "6px",
                       border: `1px solid ${colors.border}`,
                       fontSize: "12px",
                       color: colors.textSecondary
                     }}>
                       <div>Router Selected: {doc.router_selected?.join(", ") || "None"}</div>
                       <div>Used Paragraphs: {doc.used_paragraphs?.join(", ") || "None"}</div>
                       <div>Run ID: {doc.run_id || "None"}</div>
                     </div>
                   </div>

                  {/* Citations */}
                  {doc.citations && doc.citations.length > 0 && (
                    <div>
                      <strong style={{ color: colors.text }}>Citations:</strong>
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
                              ID: {citation.id}
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
