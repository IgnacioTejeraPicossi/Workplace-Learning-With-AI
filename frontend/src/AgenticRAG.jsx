import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";

const AgenticRAG = () => {
  const { colors } = useTheme();
  const [files, setFiles] = useState([]);
  const [indexedDocs, setIndexedDocs] = useState([]);
  const [question, setQuestion] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");

  // Agentic RAG parameters
  const [depth, setDepth] = useState(2);
  const [kInit, setKInit] = useState(8);
  const [useHybrid, setUseHybrid] = useState(true);
  const [maxParagraphs, setMaxParagraphs] = useState(12);

  // Fetch indexed documents on component mount
  useEffect(() => {
    fetchIndexedDocs();
  }, []);

  const fetchIndexedDocs = async () => {
    try {
      // This would fetch from your MongoDB documents collection
      // For now, we'll use a placeholder
      setIndexedDocs([]);
    } catch (error) {
      console.error("Error fetching indexed documents:", error);
    }
  };

  const handleFileUpload = (event) => {
    const newFiles = Array.from(event.target.files);
    validateAndAddFiles(newFiles);
  };

  const validateAndAddFiles = (newFiles) => {
    const validFiles = [];
    const errors = [];

    newFiles.forEach(file => {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name} is too large (max 5MB)`);
        return;
      }

      // Check file type
      const validTypes = ['.pdf', '.docx', '.txt', '.md'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        errors.push(`${file.name} is not a supported file type`);
        return;
      }

      // Check if we already have 5 files
      if (files.length + validFiles.length >= 5) {
        errors.push(`Maximum 5 files allowed`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setStatus(`❌ ${errors.join(', ')}`);
      setTimeout(() => setStatus(''), 5000);
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = colors.primary;
    e.currentTarget.style.background = colors.primaryLight;
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = colors.primary;
    e.currentTarget.style.background = colors.primaryLight;
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = colors.border;
    e.currentTarget.style.background = colors.background;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = colors.border;
    e.currentTarget.style.background = colors.background;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles);
  };

  const indexDocuments = async () => {
    if (files.length === 0) {
      setStatus("❌ Please select files to index");
      return;
    }

    console.log("🚀 Starting indexing process...");
    setIndexing(true);
    setStatus("🔄 Indexing documents... This may take a few moments...");
    console.log("📝 Status set to:", "🔄 Indexing documents... This may take a few moments...");

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append("files", file);
        console.log("📁 Adding file to FormData:", file.name, file.size);
      });

      console.log("🌐 Sending request to backend...");
      const response = await fetch('http://localhost:8000/api/agentic-rag/index', {
        method: 'POST',
        body: formData,
      });

      console.log("📡 Response received:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Backend response:", data);
        setStatus(`✅ Successfully indexed ${data.documents.length} document(s)! You can now ask questions.`);
        setIndexedDocs(prev => [...prev, ...data.documents]);
        setFiles([]);
        // Reset file input
        document.getElementById('file-input').value = '';
        
        // Auto-select the newly indexed documents
        if (data.documents && data.documents.length > 0) {
          const newDocIds = data.documents.map(doc => doc.doc_id);
          setSelectedDocIds(prev => [...new Set([...prev, ...newDocIds])]);
        }
      } else {
        const error = await response.text();
        console.error("❌ Backend error:", error);
        setStatus(`❌ Indexing failed: ${error}`);
      }
    } catch (error) {
      console.error('❌ Error indexing documents:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const errorMsg = '❌ Cannot connect to backend. Please ensure the server is running on http://localhost:8000';
        console.log("📝 Setting error status:", errorMsg);
        setStatus(errorMsg);
      } else {
        const errorMsg = '❌ Error indexing documents: ' + error.message;
        console.log("📝 Setting error status:", errorMsg);
        setStatus(errorMsg);
      }
    } finally {
      console.log("🏁 Indexing process finished, setting indexing to false");
      setIndexing(false);
    }
  };

  const askQuestion = async () => {
    if (selectedDocIds.length === 0) {
      setStatus("❌ Please select at least one document");
      return;
    }
    if (!question.trim()) {
      setStatus("❌ Please enter a question");
      return;
    }

    setLoading(true);
    setStatus("🤖 Processing with Agentic RAG... This may take 10-30 seconds...");

    try {
      const response = await fetch('http://localhost:8000/api/agentic-rag/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doc_ids: selectedDocIds,
          question: question.trim(),
          depth,
          k_init: kInit,
          use_hybrid: useHybrid,
          max_paragraphs: maxParagraphs,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setStatus(`✅ Answer generated successfully in ${data.elapsed_sec || 'unknown'} seconds!`);
      } else {
        const error = await response.text();
        setStatus(`❌ Question failed: ${error}`);
      }
    } catch (error) {
      console.error('Error asking question:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setStatus('❌ Cannot connect to backend. Please ensure the server is running on http://localhost:8000');
      } else {
        setStatus('❌ Error processing question: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (selectedDocIds.length === 0) {
      setStatus("❌ Please select at least one document");
      return;
    }

    setLoading(true);
    setStatus("📝 Generating executive summary...");

    try {
      const formData = new FormData();
      selectedDocIds.forEach(id => formData.append("doc_ids", id));
      formData.append("length", "medium");

      const response = await fetch('http://localhost:8000/api/agentic-rag/summarize', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setStatus(`✅ Summary generated in ${data.elapsed_sec}s`);
      } else {
        const error = await response.text();
        setStatus(`❌ Summary failed: ${error}`);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setStatus('❌ Error generating summary');
    } finally {
      setLoading(false);
    }
  };

  const toggleDocumentSelection = (docId) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setStatus("📋 Copied to clipboard!");
    setTimeout(() => setStatus(""), 2000);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ 
          color: colors.primary, 
          marginBottom: "8px",
          fontSize: "28px",
          fontWeight: "600"
        }}>
          🚀 Agentic RAG (Beta)
        </h1>
        <p style={{ 
          color: colors.textSecondary, 
          fontSize: "16px",
          lineHeight: "1.5"
        }}>
          Advanced document analysis using intelligent agents for deep reasoning and grounded answers.
        </p>
        
        {/* Status Messages */}
        {status && (
          <div style={{
            marginTop: "12px",
            padding: "20px 24px",
            borderRadius: "12px",
            background: status.includes("✅") ? "#dcfce7" : status.includes("🔄") ? "#dbeafe" : "#fef2f2",
            color: status.includes("✅") ? "#166534" : status.includes("🔄") ? "#1e40af" : "#dc2626",
            border: `2px solid ${status.includes("✅") ? "#bbf7d0" : status.includes("🔄") ? "#bfdbfe" : "#fecaca"}`,
            fontSize: "18px",
            fontWeight: "700",
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Background pattern for indexing */}
            {status.includes("🔄") && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.1) 50%, transparent 70%)",
                animation: "slide 2s linear infinite"
              }}></div>
            )}
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", position: "relative", zIndex: 1 }}>
              {status.includes("🔄") && (
                <div style={{ 
                  width: "24px", 
                  height: "24px", 
                  border: "3px solid #3b82f6",
                  borderTop: "3px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></div>
              )}
              <span style={{ fontSize: "20px" }}>{status}</span>
            </div>
          </div>
        )}

        {/* Special Indexing Banner */}
        {indexing && (
          <div style={{
            marginTop: "16px",
            padding: "24px",
            background: "linear-gradient(135deg, #1e40af, #3b82f6)",
            color: "white",
            borderRadius: "16px",
            textAlign: "center",
            boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
            border: "2px solid #60a5fa",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Animated background */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
              animation: "slide 3s linear infinite"
            }}></div>
            
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔄</div>
              <h3 style={{ 
                fontSize: "24px", 
                fontWeight: "700", 
                marginBottom: "12px",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)"
              }}>
                Indexing in Progress
              </h3>
              <p style={{ 
                fontSize: "16px", 
                marginBottom: "16px",
                opacity: 0.9
              }}>
                Please wait while we process your documents. This may take a few moments.
              </p>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></div>
                <span style={{ fontSize: "14px", opacity: 0.8 }}>Processing...</span>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info - Remove in production */}
        <div style={{
          marginTop: "8px",
          padding: "8px 12px",
          background: "#f3f4f6",
          borderRadius: "4px",
          fontSize: "12px",
          color: "#6b7280",
          fontFamily: "monospace"
        }}>
          Debug: status="{status}", indexing={String(indexing)}
          <button 
            onClick={() => setStatus("🧪 Test status update: " + new Date().toLocaleTimeString())}
            style={{ marginLeft: "8px", padding: "2px 6px", fontSize: "10px" }}
          >
            Test Status
          </button>
        </div>
      </div>

      {/* Document Indexing Section */}
      <div style={{ 
        background: colors.cardBackground, 
        borderRadius: "12px", 
        padding: "24px", 
        marginBottom: "24px",
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow
      }}>
        <h2 style={{ 
          color: colors.text, 
          marginBottom: "16px",
          fontSize: "20px",
          fontWeight: "600"
        }}>
          📚 Document Indexing
        </h2>
        
        {/* Drag & Drop Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input').click()}
          style={{
            border: `2px dashed ${colors.border}`,
            borderRadius: "12px",
            padding: "40px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: colors.background,
            transition: "all 0.2s ease",
            marginBottom: "16px",
            position: "relative"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = colors.primary;
            e.currentTarget.style.background = colors.primaryLight;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = colors.border;
            e.currentTarget.style.background = colors.background;
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📁</div>
          <p style={{ 
            color: colors.text, 
            fontSize: "16px", 
            marginBottom: "8px",
            fontWeight: "500"
          }}>
            Drag & drop files here or click to browse
          </p>
          <p style={{ 
            color: colors.textSecondary, 
            fontSize: "14px"
          }}>
            Supports PDF, DOCX, TXT, MD (max 5 files, 5MB each)
          </p>
          
          {/* Hidden file input */}
          <input
            type="file"
            id="file-input"
            multiple
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </div>
        
        {/* Selected Files Display */}
        {files.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <p style={{ color: colors.textSecondary, marginBottom: "8px" }}>
              Selected files ({files.length}):
            </p>
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: "8px" 
            }}>
              {files.map((file, index) => (
                <div
                  key={index}
                  style={{
                    background: colors.primaryLight,
                    color: colors.primary,
                    padding: "8px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span>{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: colors.primary,
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "0",
                      marginLeft: "4px"
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indexing Progress Indicator */}
        {indexing && (
          <div style={{ 
            marginBottom: "16px",
            padding: "16px",
            background: "#dbeafe",
            borderRadius: "8px",
            border: "1px solid #bfdbfe"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px",
              marginBottom: "8px"
            }}>
              <div style={{ 
                width: "20px", 
                height: "20px", 
                border: "2px solid #3b82f6",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
              <span style={{ 
                color: "#1e40af", 
                fontWeight: "500",
                fontSize: "14px"
              }}>
                Indexing in progress...
              </span>
            </div>
            <p style={{ 
              color: "#1e40af", 
              margin: "0", 
              fontSize: "12px"
            }}>
              Please wait while we process your documents. This may take a few moments.
            </p>
          </div>
        )}
        
                 <button
           onClick={indexDocuments}
           disabled={indexing || files.length === 0}
           style={{
             padding: "16px 32px",
             borderRadius: "12px",
             border: "none",
             background: indexing ? "#1e40af" : colors.primary,
             color: "white",
             fontSize: "16px",
             fontWeight: "600",
             cursor: indexing || files.length === 0 ? "not-allowed" : "pointer",
             opacity: indexing || files.length === 0 ? 0.6 : 1,
             display: "flex",
             alignItems: "center",
             gap: "12px",
             transition: "all 0.3s ease",
             position: "relative",
             overflow: "hidden"
           }}
           onMouseEnter={(e) => {
             if (!indexing && files.length > 0) {
               e.currentTarget.style.transform = "translateY(-2px)";
               e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
             }
           }}
           onMouseLeave={(e) => {
             if (!indexing && files.length > 0) {
               e.currentTarget.style.transform = "translateY(0)";
               e.currentTarget.style.boxShadow = "none";
             }
           }}
         >
           {indexing && (
             <>
               <div style={{
                 width: "20px",
                 height: "20px",
                 border: "2px solid rgba(255,255,255,0.3)",
                 borderTop: "2px solid white",
                 borderRadius: "50%",
                 animation: "spin 1s linear infinite"
               }}></div>
               <span>Indexing in Progress...</span>
             </>
           )}
           {!indexing && (
             <>
               <span style={{ fontSize: "20px" }}>🔍</span>
               <span>Index Documents</span>
             </>
           )}
         </button>
      </div>

      {/* Question & Analysis Section */}
      <div style={{ 
        background: colors.cardBackground, 
        borderRadius: "12px", 
        padding: "24px", 
        marginBottom: "24px",
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow
      }}>
        <h2 style={{ 
          color: colors.text, 
          marginBottom: "16px",
          fontSize: "20px",
          fontWeight: "600"
        }}>
          🤖 Ask Questions
        </h2>

        {/* Document Selection */}
        {indexedDocs.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ 
              color: colors.text, 
              marginBottom: "12px",
              fontSize: "16px",
              fontWeight: "500"
            }}>
              📚 Available Documents ({indexedDocs.length}):
            </h3>
            <div style={{ 
              padding: "12px", 
              background: "#dcfce7", 
              borderRadius: "8px", 
              marginBottom: "16px",
              border: "1px solid #bbf7d0"
            }}>
              <p style={{ 
                color: "#166534", 
                margin: "0", 
                fontSize: "14px",
                fontWeight: "500"
              }}>
                ✅ Documents indexed successfully! Select one or more to analyze.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {indexedDocs.map((doc) => (
                <button
                  key={doc.doc_id}
                  onClick={() => toggleDocumentSelection(doc.doc_id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: `2px solid ${selectedDocIds.includes(doc.doc_id) ? colors.primary : colors.border}`,
                    background: selectedDocIds.includes(doc.doc_id) ? colors.primary : colors.background,
                    color: selectedDocIds.includes(doc.doc_id) ? "white" : colors.text,
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {doc.filename}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Documents Warning */}
        {indexedDocs.length === 0 && (
          <div style={{ 
            padding: "16px", 
            background: "#fef3c7", 
            borderRadius: "8px", 
            marginBottom: "20px",
            border: "1px solid #fde68a"
          }}>
            <p style={{ 
              color: "#92400e", 
              margin: "0", 
              fontSize: "14px",
              fontWeight: "500"
            }}>
              ⚠️ No documents indexed yet. Please index documents first to ask questions.
            </p>
          </div>
        )}

        {/* Question Input */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ 
            display: "block", 
            marginBottom: "8px",
            color: colors.text,
            fontWeight: "500"
          }}>
            Your Question:
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a specific question about the selected documents..."
            rows={4}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              background: colors.background,
              color: colors.text,
              fontSize: "14px",
              resize: "vertical"
            }}
          />
        </div>

        {/* Agentic RAG Parameters */}
        <div style={{ 
          marginBottom: "20px",
          padding: "16px",
          background: colors.background,
          borderRadius: "8px",
          border: `1px solid ${colors.border}`
        }}>
          <h4 style={{ 
            color: colors.primary, 
            marginBottom: "12px",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            🔧 Advanced Parameters
          </h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", color: colors.textSecondary, fontSize: "12px" }}>
                Navigation Depth
              </label>
              <select
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  fontSize: "12px"
                }}
              >
                <option value={1}>Level 1 (Basic)</option>
                <option value={2}>Level 2 (Standard)</option>
                <option value={3}>Level 3 (Deep)</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "4px", color: colors.textSecondary, fontSize: "12px" }}>
                Initial Candidates
              </label>
              <input
                type="number"
                value={kInit}
                onChange={(e) => setKInit(parseInt(e.target.value))}
                min="4"
                max="20"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  fontSize: "12px"
                }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "4px", color: colors.textSecondary, fontSize: "12px" }}>
                Max Paragraphs
              </label>
              <input
                type="number"
                value={maxParagraphs}
                onChange={(e) => setMaxParagraphs(parseInt(e.target.value))}
                min="6"
                max="30"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: `1px solid ${colors.border}`,
                  background: colors.cardBackground,
                  color: colors.text,
                  fontSize: "12px"
                }}
              />
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="use-hybrid"
                checked={useHybrid}
                onChange={(e) => setUseHybrid(e.target.checked)}
                style={{ margin: 0 }}
              />
              <label htmlFor="use-hybrid" style={{ color: colors.textSecondary, fontSize: "12px" }}>
                Use Hybrid Search (BM25 + Embeddings)
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={askQuestion}
            disabled={loading || selectedDocIds.length === 0 || !question.trim()}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              background: colors.primary,
              color: "white",
              fontSize: "14px",
              fontWeight: "500",
              cursor: loading || selectedDocIds.length === 0 || !question.trim() ? "not-allowed" : "pointer",
              opacity: loading || selectedDocIds.length === 0 || !question.trim() ? 0.6 : 1
            }}
          >
            🤖 Ask Question
          </button>
          
          <button
            onClick={generateSummary}
            disabled={loading || selectedDocIds.length === 0}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: `1px solid ${colors.primary}`,
              background: colors.background,
              color: colors.primary,
              fontSize: "14px",
              fontWeight: "500",
              cursor: loading || selectedDocIds.length === 0 ? "not-allowed" : "pointer",
              opacity: loading || selectedDocIds.length === 0 ? 0.6 : 1
            }}
          >
            📝 Generate Summary
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div style={{ 
          background: colors.cardBackground, 
          borderRadius: "12px", 
          padding: "24px",
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow
        }}>
          <h2 style={{ 
            color: colors.text, 
            marginBottom: "20px",
            fontSize: "20px",
            fontWeight: "600"
          }}>
            🎯 Results
          </h2>

          {/* Quality Scores */}
          {result.scores && (
            <div style={{ 
              marginBottom: "20px",
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
                📊 Quality Assessment
              </h4>
              
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ 
                    fontSize: "24px", 
                    fontWeight: "600",
                    color: result.scores.faithfulness >= 8 ? "#22c55e" : result.scores.faithfulness >= 6 ? "#eab308" : "#ef4444"
                  }}>
                    {result.scores.faithfulness}/10
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>Faithfulness</div>
                </div>
                
                <div style={{ textAlign: "center" }}>
                  <div style={{ 
                    fontSize: "24px", 
                    fontWeight: "600",
                    color: result.scores.relevance >= 8 ? "#22c55e" : result.scores.relevance >= 6 ? "#eab308" : "#ef4444"
                  }}>
                    {result.scores.relevance}/10
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>Relevance</div>
                </div>
                
                <div style={{ textAlign: "center" }}>
                  <div style={{ 
                    fontSize: "24px", 
                    fontWeight: "600",
                    color: result.scores.completeness >= 8 ? "#22c55e" : result.scores.completeness >= 6 ? "#eab308" : "#ef4444"
                  }}>
                    {result.scores.completeness}/10
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>Completeness</div>
                </div>
              </div>
              
              {result.scores.comment && (
                <div style={{ 
                  marginTop: "12px",
                  padding: "12px",
                  background: colors.cardBackground,
                  borderRadius: "6px",
                  border: `1px solid ${colors.border}`,
                  color: colors.textSecondary,
                  fontSize: "14px"
                }}>
                  <strong>Comment:</strong> {result.scores.comment}
                </div>
              )}
            </div>
          )}

          {/* Answer */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ 
              color: colors.primary, 
              marginBottom: "12px",
              fontSize: "16px",
              fontWeight: "500"
            }}>
              💡 Answer
            </h4>
            <div style={{ 
              padding: "16px",
              background: colors.background,
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              color: colors.text,
              fontSize: "14px",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap"
            }}>
              {result.answer}
            </div>
            <button
              onClick={() => copyToClipboard(result.answer)}
              style={{
                marginTop: "8px",
                padding: "6px 12px",
                borderRadius: "4px",
                border: "none",
                background: colors.secondary,
                color: "white",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              📋 Copy Answer
            </button>
          </div>

          {/* Citations */}
          {result.citations && result.citations.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ 
                color: colors.primary, 
                marginBottom: "12px",
                fontSize: "16px",
                fontWeight: "500"
              }}>
                📚 Sources & Citations
              </h4>
              <div style={{ display: "grid", gap: "12px" }}>
                {result.citations.map((citation, index) => (
                  <div key={index} style={{
                    padding: "12px",
                    background: colors.background,
                    borderRadius: "6px",
                    border: `1px solid ${colors.border}`
                  }}>
                    <div style={{ 
                      color: colors.primary, 
                      fontSize: "12px", 
                      fontWeight: "500",
                      marginBottom: "4px"
                    }}>
                      ID: {citation.id}
                    </div>
                    <div style={{ 
                      color: colors.text,
                      fontSize: "14px",
                      fontStyle: "italic"
                    }}>
                      {citation.snippet}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          {result.metrics && (
            <div style={{ 
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
                📈 Performance Metrics
              </h4>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                <div>
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>Total Tokens</div>
                  <div style={{ color: colors.text, fontSize: "16px", fontWeight: "500" }}>
                    {result.metrics.total_in + result.metrics.total_out}
                  </div>
                </div>
                
                <div>
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>Cost (USD)</div>
                  <div style={{ color: colors.text, fontSize: "16px", fontWeight: "500" }}>
                    ${result.metrics.total_cost_usd.toFixed(6)}
                  </div>
                </div>
                
                <div>
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>Latency</div>
                  <div style={{ color: colors.text, fontSize: "16px", fontWeight: "500" }}>
                    {result.metrics.total_latency_ms}ms
                  </div>
                </div>
                
                <div>
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>Total Time</div>
                  <div style={{ color: colors.text, fontSize: "16px", fontWeight: "500" }}>
                    {result.elapsed_sec}s
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trace Information */}
          <div style={{ marginTop: "20px" }}>
            <h4 style={{ 
              color: colors.primary, 
              marginBottom: "12px",
              fontSize: "16px",
              fontWeight: "500"
            }}>
              🔍 Analysis Trace
            </h4>
            
            <div style={{ 
              padding: "16px",
              background: colors.background,
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              fontSize: "12px",
              color: colors.textSecondary
            }}>
              <div><strong>Router Selected:</strong> {result.router_selected?.join(", ") || "None"}</div>
              <div><strong>Used Paragraphs:</strong> {result.used_paragraphs?.join(", ") || "None"}</div>
              <div><strong>Run ID:</strong> {result.run_id}</div>
            </div>
          </div>
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
          Need help with Agentic RAG?
        </h3>
        <p style={{ 
          color: colors.textSecondary, 
          marginBottom: "20px",
          fontSize: "16px"
        }}>
          This advanced system uses intelligent agents to navigate documents, reason about content, and provide grounded answers with citations.
        </p>
        <div style={{ 
          display: "flex", 
          gap: "12px", 
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          <div style={{ 
            padding: "12px 16px",
            background: colors.background,
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
            fontSize: "14px"
          }}>
            🚀 <strong>Zero-embedding</strong> chunking
          </div>
          <div style={{ 
            padding: "12px 16px",
            background: colors.background,
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
            fontSize: "14px"
          }}>
            🧠 <strong>Two-pass</strong> routing
          </div>
          <div style={{ 
            padding: "12px 16px",
            background: colors.background,
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
            fontSize: "14px"
          }}>
            🔍 <strong>Recursive</strong> navigation
          </div>
          <div style={{ 
            padding: "12px 16px",
            background: colors.background,
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
            fontSize: "14px"
          }}>
            ⚖️ <strong>AI Judge</strong> evaluation
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgenticRAG;
