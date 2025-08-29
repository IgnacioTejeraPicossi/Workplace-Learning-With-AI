import React, { useState, useCallback } from "react";
import { useTheme } from "./ThemeContext";

const DocumentsAnalyzer = () => {
  const { colors } = useTheme();
  const [files, setFiles] = useState([]);
  const [summaryLength, setSummaryLength] = useState("medium");
  const [combineFiles, setCombineFiles] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({
    currentFile: 0,
    totalFiles: 0,
    currentStep: "preparing"
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError(null);
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    setError(null);
  }, []);

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const analyzeDocuments = async () => {
    if (files.length === 0) {
      setError("Please select at least one file to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    setAnalysisProgress({
      currentFile: 0,
      totalFiles: files.length,
      currentStep: "preparing"
    });

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append("files", file);
      });
      formData.append("length", summaryLength);
      formData.append("combine_across_files", combineFiles);

      const response = await fetch("/api/document-analyzer/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to analyze documents");
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || "An error occurred while analyzing documents");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadSummary = (content, filename, format = "md") => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (filename) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf": return "📄";
      case "docx": return "📝";
      case "txt": return "📃";
      case "md": return "📋";
      default: return "📎";
    }
  };

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
          📄 Document Analyzer
        </h1>
        <p style={{ 
          color: colors.textSecondary, 
          fontSize: "16px",
          lineHeight: "1.5"
        }}>
          Upload documents and get AI-powered summaries. Supports PDF, DOCX, TXT, and Markdown files.
        </p>
      </div>

      {/* Upload Section */}
      <div style={{ 
        background: colors.cardBackground, 
        borderRadius: "12px", 
        padding: "24px", 
        marginBottom: "24px",
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow
      }}>
        <h3 style={{ 
          color: colors.text, 
          marginBottom: "16px",
          fontSize: "18px",
          fontWeight: "500"
        }}>
          Upload Documents
        </h3>

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? colors.primary : colors.border}`,
            borderRadius: "8px",
            padding: "40px 20px",
            textAlign: "center",
            background: dragActive ? colors.primaryLight : "transparent",
            transition: "all 0.2s ease",
            cursor: "pointer"
          }}
          onClick={() => document.getElementById("file-input").click()}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📁</div>
          <p style={{ 
            color: colors.text, 
            marginBottom: "8px",
            fontSize: "16px",
            fontWeight: "500"
          }}>
            {dragActive ? "Drop files here" : "Drag & drop files here or click to browse"}
          </p>
          <p style={{ 
            color: colors.textSecondary, 
            fontSize: "14px"
          }}>
            Supports PDF, DOCX, TXT, MD (max 5 files, 50MB each)
          </p>
        </div>

        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,.markdown"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {/* File List */}
        {files.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h4 style={{ 
              color: colors.text, 
              marginBottom: "12px",
              fontSize: "16px",
              fontWeight: "500"
            }}>
              Selected Files ({files.length}/5)
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {files.map((file, index) => (
                <div key={index} style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px",
                  background: colors.background,
                  borderRadius: "6px",
                  border: `1px solid ${colors.border}`
                }}>
                  <span style={{ fontSize: "20px", marginRight: "12px" }}>
                    {getFileIcon(file.name)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      color: colors.text, 
                      margin: "0 0 4px 0",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}>
                      {file.name}
                    </p>
                    <p style={{ 
                      color: colors.textSecondary, 
                      margin: 0,
                      fontSize: "12px"
                    }}>
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    style={{
                      background: "none",
                      border: "none",
                      color: colors.error,
                      cursor: "pointer",
                      fontSize: "18px",
                      padding: "4px"
                    }}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Options */}
        <div style={{ marginTop: "20px" }}>
          <h4 style={{ 
            color: colors.text, 
            marginBottom: "12px",
            fontSize: "16px",
            fontWeight: "500"
          }}>
            Analysis Options
          </h4>
          
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {/* Summary Length */}
            <div>
              <label style={{ 
                display: "block", 
                color: colors.text, 
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                Summary Length
              </label>
              <select
                value={summaryLength}
                onChange={(e) => setSummaryLength(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${colors.border}`,
                  background: colors.background,
                  color: colors.text,
                  fontSize: "14px"
                }}
              >
                <option value="short">Short (3-5 bullet points)</option>
                <option value="medium">Medium (executive summary)</option>
                <option value="long">Long (detailed outline)</option>
              </select>
            </div>

            {/* Combine Files */}
            <div>
              <label style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                color: colors.text, 
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer"
              }}>
                <input
                  type="checkbox"
                  checked={combineFiles}
                  onChange={(e) => setCombineFiles(e.target.checked)}
                  style={{ margin: 0 }}
                />
                Combine summaries across files
              </label>
            </div>
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={analyzeDocuments}
          disabled={isAnalyzing || files.length === 0}
          style={{
            background: isAnalyzing || files.length === 0 ? colors.disabled : colors.primary,
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: isAnalyzing || files.length === 0 ? "not-allowed" : "pointer",
            marginTop: "20px",
            transition: "all 0.2s ease"
          }}
        >
          {isAnalyzing ? "🔄 Analyzing..." : "🚀 Analyze Documents"}
        </button>

        {/* Progress Bar */}
        {isAnalyzing && (
          <div style={{ marginTop: "20px" }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "8px"
            }}>
              <span style={{ 
                color: colors.text, 
                fontSize: "14px",
                fontWeight: "500"
              }}>
                {analysisProgress.currentStep === "preparing" && "Preparing analysis..."}
                {analysisProgress.currentStep === "processing" && `Processing file ${analysisProgress.currentFile + 1} of ${analysisProgress.totalFiles}`}
                {analysisProgress.currentStep === "analyzing" && "AI analysis in progress..."}
                {analysisProgress.currentStep === "finalizing" && "Finalizing results..."}
              </span>
              <span style={{ 
                color: colors.textSecondary, 
                fontSize: "12px"
              }}>
                {analysisProgress.currentFile + 1} / {analysisProgress.totalFiles} files
              </span>
            </div>
            <div style={{ 
              height: "8px", 
              background: colors.background, 
              borderRadius: "4px", 
              overflow: "hidden",
              border: `1px solid ${colors.border}`
            }}>
              <div style={{ 
                width: `${Math.max(10, (analysisProgress.currentFile / analysisProgress.totalFiles) * 100)}%`, 
                height: '100%', 
                background: colors.primary, 
                transition: 'width 0.5s ease',
                borderRadius: "4px"
              }} />
            </div>
            <style>{`
              @keyframes documentProgressBar { 
                0% { width: 10%; opacity: 0.8; } 
                50% { width: 60%; opacity: 1; }
                100% { width: 90%; opacity: 0.8; } 
              }
            `}</style>
            
            {/* Processing Steps */}
            <div style={{ 
              marginTop: "16px",
              padding: "16px",
              background: colors.background,
              borderRadius: "8px",
              border: `1px solid ${colors.border}`
            }}>
              <h5 style={{ 
                color: colors.text, 
                margin: "0 0 12px 0",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                Analysis Progress
              </h5>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  color: analysisProgress.currentStep === "preparing" ? colors.primary : colors.textSecondary,
                  fontSize: "12px",
                  fontWeight: analysisProgress.currentStep === "preparing" ? "500" : "400"
                }}>
                  <span style={{ fontSize: "16px" }}>📁</span>
                  <span>Preparing files for analysis</span>
                  {analysisProgress.currentStep === "preparing" && <span style={{ fontSize: "12px" }}>✓</span>}
                </div>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  color: analysisProgress.currentStep === "processing" ? colors.primary : colors.textSecondary,
                  fontSize: "12px",
                  fontWeight: analysisProgress.currentStep === "processing" ? "500" : "400"
                }}>
                  <span style={{ fontSize: "16px" }}>🔄</span>
                  <span>Processing documents ({analysisProgress.currentFile + 1}/{analysisProgress.totalFiles})</span>
                  {analysisProgress.currentStep === "processing" && <span style={{ fontSize: "12px" }}>🔄</span>}
                </div>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  color: analysisProgress.currentStep === "analyzing" ? colors.primary : colors.textSecondary,
                  fontSize: "12px",
                  fontWeight: analysisProgress.currentStep === "analyzing" ? "500" : "400"
                }}>
                  <span style={{ fontSize: "16px" }}>🤖</span>
                  <span>AI analysis and summarization</span>
                  {analysisProgress.currentStep === "analyzing" && <span style={{ fontSize: "12px" }}>🔄</span>}
                </div>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  color: analysisProgress.currentStep === "finalizing" ? colors.primary : colors.textSecondary,
                  fontSize: "12px",
                  fontWeight: analysisProgress.currentStep === "finalizing" ? "500" : "400"
                }}>
                  <span style={{ fontSize: "16px" }}>📊</span>
                  <span>Finalizing results</span>
                  {analysisProgress.currentStep === "finalizing" && <span style={{ fontSize: "12px" }}>🔄</span>}
                </div>
              </div>
              <p style={{ 
                margin: "12px 0 0 0",
                color: colors.textSecondary,
                fontSize: "11px",
                fontStyle: "italic"
              }}>
                ⏱️ Estimated time: {files.length === 1 ? "30 seconds - 2 minutes" : `${Math.ceil(files.length * 1.5)} - ${Math.ceil(files.length * 3)} minutes`} depending on document size and complexity
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: colors.errorBackground,
          border: `1px solid ${colors.error}`,
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
          color: colors.error
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Section */}
      {results && (
        <div style={{ 
          background: colors.cardBackground, 
          borderRadius: "12px", 
          padding: "24px",
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow
        }}>
          <h3 style={{ 
            color: colors.text, 
            marginBottom: "20px",
            fontSize: "20px",
            fontWeight: "600"
          }}>
            Analysis Results
          </h3>

          {/* Individual File Summaries */}
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ 
              color: colors.text, 
              marginBottom: "16px",
              fontSize: "18px",
              fontWeight: "500"
            }}>
              File Summaries
            </h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {results.summaries.map((summary, index) => (
                <div key={index} style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  padding: "16px",
                  background: colors.background
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "12px"
                  }}>
                    <h5 style={{ 
                      color: colors.primary, 
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: "600"
                    }}>
                      {summary.filename}
                    </h5>
                    <div style={{ 
                      display: "flex", 
                      gap: "8px",
                      fontSize: "12px",
                      color: colors.textSecondary
                    }}>
                      <span>{summary.chars.toLocaleString()} chars</span>
                      <span>•</span>
                      <span>{summary.chunks} chunks</span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: colors.cardBackground, 
                    padding: "12px", 
                    borderRadius: "6px",
                    marginBottom: "12px"
                  }}>
                    <p style={{ 
                      color: colors.text, 
                      margin: 0,
                      fontSize: "14px",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap"
                    }}>
                      {summary.summary}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => copyToClipboard(summary.summary)}
                      style={{
                        background: colors.secondary,
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => downloadSummary(summary.summary, summary.filename)}
                      style={{
                        background: colors.secondary,
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      💾 Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Combined Summary */}
          {results.combined_summary && (
            <div style={{
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              padding: "16px",
              background: colors.background
            }}>
              <h4 style={{ 
                color: colors.primary, 
                marginBottom: "12px",
                fontSize: "18px",
                fontWeight: "500"
              }}>
                Combined Summary
              </h4>
              
              <div style={{ 
                background: colors.cardBackground, 
                padding: "12px", 
                borderRadius: "6px",
                marginBottom: "12px"
              }}>
                <p style={{ 
                  color: colors.text, 
                  margin: 0,
                  fontSize: "14px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap"
                }}>
                  {results.combined_summary}
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => copyToClipboard(results.combined_summary)}
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
                  📋 Copy Combined Summary
                </button>
                <button
                  onClick={() => downloadSummary(results.combined_summary, "combined_summary")}
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
                  💾 Download Combined Summary
                </button>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div style={{ 
            marginTop: "20px", 
            padding: "16px", 
            background: colors.background,
            borderRadius: "8px",
            border: `1px solid ${colors.border}`
          }}>
            <h5 style={{ 
              color: colors.textSecondary, 
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500"
            }}>
              Analysis Metadata
            </h5>
            <div style={{ 
              display: "flex", 
              gap: "16px",
              fontSize: "12px",
              color: colors.textSecondary
            }}>
              <span>Files processed: {results.meta.files_processed}</span>
              <span>Summary length: {results.meta.length}</span>
              <span>Combined: {results.meta.combine_across_files ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsAnalyzer;
