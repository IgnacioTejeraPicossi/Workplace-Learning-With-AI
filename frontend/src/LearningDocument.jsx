import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";

const LearningDocument = () => {
  const { colors } = useTheme();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Mock data for demonstration - in real app this would come from backend
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setDocuments([
        {
          id: 1,
          filename: "Annual_Report_2024.pdf",
          summary: "Comprehensive analysis of company performance, revenue growth of 15%, new market expansion, and strategic initiatives for Q1 2025.",
          type: "pdf",
          date: "2024-12-15",
          tags: ["business", "finance", "strategy"],
          rating: 9.2,
          size: "2.4 MB",
          chunks: 8
        },
        {
          id: 2,
          filename: "Technical_Specifications.docx",
          summary: "Detailed technical specifications for the new AI-powered learning platform, including architecture, APIs, and deployment requirements.",
          type: "docx",
          date: "2024-12-14",
          tags: ["technical", "AI", "development"],
          rating: 8.8,
          size: "1.8 MB",
          chunks: 5
        },
        {
          id: 3,
          filename: "Market_Research.txt",
          summary: "Market analysis of AI learning platforms, competitive landscape, user preferences, and growth opportunities in the education sector.",
          type: "txt",
          date: "2024-12-13",
          tags: ["market", "research", "AI"],
          rating: 9.0,
          size: "0.9 MB",
          chunks: 3
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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
    navigator.clipboard.writeText(text);
  };

  const downloadDocument = (doc) => {
    // In real app, this would download the actual document
    const content = `Document: ${doc.filename}\n\nSummary:\n${doc.summary}\n\nTags: ${doc.tags.join(", ")}\nRating: ${doc.rating}/10\nDate: ${doc.date}`;
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
          <p style={{ color: colors.textSecondary }}>Loading learning documents...</p>
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
          📚 Learning Document Library
        </h1>
        <p style={{ 
          color: colors.textSecondary, 
          fontSize: "16px",
          lineHeight: "1.5"
        }}>
          Access and manage your previously analyzed documents. Search, filter, and organize your learning materials.
        </p>
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
              placeholder="Search documents, summaries, or tags..."
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
              <option value="all">All Types</option>
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
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="rating">Sort by Rating</option>
              <option value="size">Sort by Size</option>
            </select>
          </div>
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
              : "Start by analyzing some documents in the Document Analyzer"
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
                      {doc.filename}
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
                        {doc.chunks} chunks
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

              {/* Summary */}
              <div style={{ 
                background: colors.background, 
                padding: "16px", 
                borderRadius: "8px",
                marginBottom: "16px"
              }}>
                <p style={{ 
                  color: colors.text, 
                  margin: 0,
                  fontSize: "14px",
                  lineHeight: "1.6"
                }}>
                  {doc.summary}
                </p>
              </div>

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
              <div style={{ display: "flex", gap: "8px" }}>
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
                  📋 Copy Summary
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
                  💾 Download
                </button>
                <button
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
                  🔍 View Details
                </button>
              </div>
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
          Need to analyze new documents?
        </h3>
        <p style={{ 
          color: colors.textSecondary, 
          marginBottom: "20px",
          fontSize: "16px"
        }}>
          Use the Document Analyzer to process new files and add them to your learning library.
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
          📄 Go to Document Analyzer
        </button>
      </div>
    </div>
  );
};

export default LearningDocument;
