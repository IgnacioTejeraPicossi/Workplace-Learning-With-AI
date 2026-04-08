import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "./ThemeContext";

const AgenticRAG = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [files, setFiles] = useState([]);
  const [indexedDocs, setIndexedDocs] = useState([]);
  const [question, setQuestion] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");
  const [analyses, setAnalyses] = useState([]);
  const [preloadDataset, setPreloadDataset] = useState(null);
  const [preloadName, setPreloadName] = useState('');
  const [showEmbedDemo, setShowEmbedDemo] = useState(false);
  const [vecA, setVecA] = useState('');
  const [vecB, setVecB] = useState('');
  const [cosine, setCosine] = useState(null);
  const [cosError, setCosError] = useState('');
  const [phraseA, setPhraseA] = useState('');
  const [phraseB, setPhraseB] = useState('');
  const [useRealEmb, setUseRealEmb] = useState(false);
  const [embBusy, setEmbBusy] = useState(false);

  // Agentic RAG parameters
  const [depth, setDepth] = useState(2);
  const [kInit, setKInit] = useState(8);
  const [useHybrid, setUseHybrid] = useState(true);
  const [maxParagraphs, setMaxParagraphs] = useState(12);

  // Fetch indexed documents on component mount
  useEffect(() => {
    fetchIndexedDocs();
    // Load preloaded dataset from localStorage if present
    try {
      const key = 'agenticRag_preload_dataset';
      const raw = localStorage.getItem(key);
      if (raw) {
        // mark as shown for this session
        sessionStorage.setItem('agenticRag_preload_shown', '1');
        const data = JSON.parse(raw);
        if (data && (Array.isArray(data.items) || Array.isArray(data))) {
          const name = data.name || 'dataset';
          const items = Array.isArray(data.items) ? data.items : data;
          setPreloadDataset(items);
          setPreloadName(name);
          setStatus(t("agenticRagModule.datasetLoaded", { name, count: items.length }));
        }
        // clear after loading to avoid repeated loads
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('Failed to load preloaded dataset', e);
    }
  }, [t]);

  // Helpers for cosine demo
  const parseVec = (s) => {
    if (!s) return null;
    try {
      const maybeJson = JSON.parse(s);
      if (Array.isArray(maybeJson)) return maybeJson.map(Number);
    } catch (_){/* not json */}
    return s.split(',').map(x=>Number(x.trim())).filter(v=>!Number.isNaN(v));
  };
  const toyEmbedding = (text) => {
    const s = (text || '').toString();
    let h1 = 0, h2 = 0, h3 = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h1 += c * 1.17;
      h2 += (c * (i + 1)) * 0.63;
      h3 += (c % 31) - 15;
    }
    const norm = Math.sqrt(h1*h1 + h2*h2 + h3*h3) || 1;
    const arr = [h1/norm, h2/norm, h3/norm].map(x => Math.max(-1, Math.min(1, x)));
    return arr;
  };
  const formatVec = (arr) => `[${arr.map(n => Number(n).toFixed(3)).join(', ')}]`;
  const computeCosine = () => {
    const a = parseVec(vecA);
    const b = parseVec(vecB);
    if (!a || !b || a.length !== b.length || a.length === 0) {
      setCosError(t("agenticRagModule.embeddingInvalidVectors"));
      setCosine(null);
      return;
    }
    const dot = a.reduce((acc, v, i)=> acc + v*b[i], 0);
    const norm = (v)=> Math.sqrt(v.reduce((acc, x)=> acc + x*x, 0));
    const c = dot / (norm(a)*norm(b));
    setCosine(c);
    setCosError('');
  };

  // When the demo opens, prefill examples and auto-calculate
  useEffect(() => {
    if (showEmbedDemo) {
      const defaultA = '[0.1, 0.3, -0.2]';
      const defaultB = '[0.05, 0.32, -0.18]';
      const pA = t('agenticRagModule.placeholderPhraseA');
      const pB = t('agenticRagModule.placeholderPhraseB');
      if (!vecA) setVecA(defaultA);
      if (!vecB) setVecB(defaultB);
      if (!phraseA) setPhraseA(pA);
      if (!phraseB) setPhraseB(pB);
      // compute after state update
      setTimeout(() => computeCosine(), 0);
    } else {
      // reset result/error when panel is closed
      setCosine(null);
      setCosError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEmbedDemo, t]);

  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
  const fetchEmbedding = async (text) => {
    const res = await fetch(`${API_BASE}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || 'embedding error');
    }
    const data = await res.json();
    return data.embedding;
  };

  const fetchIndexedDocs = async () => {
    try {
      // This would fetch from your MongoDB documents collection
      // For now, we'll use a placeholder
      setIndexedDocs([]);
    } catch (error) {
      console.error("Error fetching indexed documents:", error);
    }
  };



  const saveAnalysis = async (analysisData) => {
    try {
      const response = await fetch('/api/agentic-rag/save-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('Analysis saved successfully:', data.analysis_id);
        setStatus(t("agenticRagModule.statusSaveOk"));
        setTimeout(() => setStatus(''), 3000);
      } else {
        console.error('Failed to save analysis:', data.message);
        setStatus(t("agenticRagModule.statusSaveFail", { message: data.message }));
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
      setStatus(t("agenticRagModule.statusSaveError"));
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const saveCurrentAnalysis = () => {
    if (!result || !selectedDocIds.length) {
      setStatus(t("agenticRagModule.statusNoResultSave"));
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    const analysisData = {
      doc_id: selectedDocIds[0], // Use first selected document
      filename: indexedDocs.find(doc => doc.doc_id === selectedDocIds[0])?.filename || t("agenticRagModule.filenameUnknown"),
      question: question,
      answer: result.answer,
      citations: result.citations || [],
      scores: result.scores || {},
      parameters: {
        depth: depth,
        k_init: kInit,
        use_hybrid: useHybrid,
        max_paragraphs: maxParagraphs
      },
      // Store all additional analysis data for complete traceability
      metrics: result.metrics || {},
      router_selected: result.router_selected || [],
      used_paragraphs: result.used_paragraphs || [],
      run_id: result.run_id || '',
      elapsed_sec: result.elapsed_sec || 0,
      user_id: "anonymous"
    };

    saveAnalysis(analysisData);
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
        errors.push(t("agenticRagModule.errFileTooLarge", { name: file.name }));
        return;
      }

      // Check file type
      const validTypes = ['.pdf', '.docx', '.txt', '.md'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        errors.push(t("agenticRagModule.errUnsupportedType", { name: file.name }));
        return;
      }

      // Check if we already have 5 files
      if (files.length + validFiles.length >= 5) {
        errors.push(t("agenticRagModule.errMaxFiles"));
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
      setStatus(t("agenticRagModule.statusSelectFilesIndex"));
      return;
    }

    console.log("🚀 Starting indexing process...");
    setIndexing(true);
    setStatus(t("agenticRagModule.statusIndexing"));
    console.log("📝 Status set to:", "🔄 Indexing documents... This may take a few moments...");

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append("files", file);
        console.log("📁 Adding file to FormData:", file.name, file.size);
      });

      console.log("🌐 Sending request to backend...");
      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/agentic-rag/index`, {
        method: 'POST',
        body: formData,
      });

      console.log("📡 Response received:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Backend response:", data);
        setStatus(t("agenticRagModule.statusIndexedOk", { count: data.documents.length }));
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
        setStatus(t("agenticRagModule.statusIndexingFailed", { detail: error }));
      }
    } catch (error) {
      console.error('❌ Error indexing documents:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const errorMsg = t("agenticRagModule.statusBackendUnreachable", { url: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000' });
        console.log("📝 Setting error status:", errorMsg);
        setStatus(errorMsg);
      } else {
        const errorMsg = t("agenticRagModule.statusIndexingError", { message: error.message });
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
      setStatus(t("agenticRagModule.statusSelectDoc"));
      return;
    }
    if (!question.trim()) {
      setStatus(t("agenticRagModule.statusEnterQuestion"));
      return;
    }

    setLoading(true);
    setStatus(t("agenticRagModule.statusProcessingRag"));

    try {
      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/agentic-rag/ask`, {
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
        setStatus(t("agenticRagModule.statusAnswerOk", {
          seconds: data.elapsed_sec != null ? String(data.elapsed_sec) : t("agenticRagModule.unknownTime")
        }));
        

      } else {
        const error = await response.text();
        setStatus(t("agenticRagModule.statusQuestionFailed", { detail: error }));
      }
    } catch (error) {
      console.error('Error asking question:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setStatus(t("agenticRagModule.statusBackendUnreachable", { url: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000' }));
      } else {
        setStatus(t("agenticRagModule.statusAskError", { message: error.message }));
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (selectedDocIds.length === 0) {
      setStatus(t("agenticRagModule.statusSelectDoc"));
      return;
    }

    setLoading(true);
    setStatus(t("agenticRagModule.statusSummaryGenerating"));

    try {
      const formData = new FormData();
      selectedDocIds.forEach(id => formData.append("doc_ids", id));
      formData.append("length", "medium");

      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/agentic-rag/summarize`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setStatus(t("agenticRagModule.statusSummaryOk", { seconds: data.elapsed_sec }));
      } else {
        const error = await response.text();
        setStatus(t("agenticRagModule.statusSummaryFailed", { detail: error }));
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setStatus(t("agenticRagModule.statusSummaryError"));
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
    setStatus(t("agenticRagModule.statusCopied"));
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
          {t("agenticRagModule.title")}
        </h1>
        <p style={{ 
          color: colors.textSecondary, 
          fontSize: "16px",
          lineHeight: "1.5"
        }}>
          {t("agenticRagModule.intro")}
        </p>

        {preloadDataset && (
          <div style={{ 
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: colors.cardBackground
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ color: colors.text }}>{t("agenticRagModule.preloadedDatasetLabel", { name: preloadName })}</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={async()=>{
                    try{
                      const blob = JSON.stringify({ name: preloadName, items: preloadDataset }, null, 2);
                      await navigator.clipboard.writeText(blob);
                      setStatus(t('agenticRagModule.statusDatasetCopied'));
                      setTimeout(()=>setStatus(''), 1500);
                    }catch(e){ setStatus(t('agenticRagModule.statusCopyFailed')); setTimeout(()=>setStatus(''),1500);}
                  }}
                  style={{ background: colors.primary, color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
                >{t("agenticRagModule.copy")}</button>
                <button
                  onClick={()=> setShowEmbedDemo(s => !s)}
                  style={{ background: colors.primaryLight, color: colors.primary, border: `1px solid ${colors.primary}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
                >{t("agenticRagModule.embedDemo")}</button>
                <button
                  onClick={()=> setPreloadDataset(null)}
                  style={{ background: colors.cardBackground, color: colors.text, border: `1px solid ${colors.border}`, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
                >{t("agenticRagModule.clear")}</button>
              </div>
            </div>
            <div style={{ maxHeight: 140, overflowY: 'auto', fontSize: 14, color: colors.text }}>
              <ol style={{ marginLeft: 18 }}>
                {preloadDataset.map((s,i)=> <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
              </ol>
            </div>
            <div style={{ marginTop: 8, color: colors.textSecondary, fontSize: 12 }}>
              {t("agenticRagModule.tipPreload")}
            </div>

            {showEmbedDemo && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 8, border: `1px dashed ${colors.primary}` }}>
                <div style={{ marginBottom: 8, color: colors.text }}><strong>{t("agenticRagModule.embeddingDemoTitle")}</strong></div>
                <div style={{ marginBottom: 6, color: colors.textSecondary, fontSize: 12 }}>
                  {t("agenticRagModule.embeddingDemoDesc")}
                </div>
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.text }}>
                    <input type="checkbox" checked={useRealEmb} onChange={(e)=> setUseRealEmb(e.target.checked)} />
                    {t("agenticRagModule.useRealEmb")}
                  </label>
                  {useRealEmb && (
                    <button
                      disabled={embBusy}
                      onClick={async ()=>{
                        try{
                          setEmbBusy(true);
                          const [ea, eb] = await Promise.all([fetchEmbedding(phraseA), fetchEmbedding(phraseB)]);
                          setVecA(formatVec(ea));
                          setVecB(formatVec(eb));
                          setTimeout(()=>computeCosine(), 0);
                          setStatus(t('agenticRagModule.statusEmbeddingsOk'));
                          setTimeout(()=>setStatus(''), 1500);
                        }catch(err){
                          setStatus(t('agenticRagModule.statusEmbeddingFailed'));
                          setTimeout(()=>setStatus(''), 2000);
                        }finally{
                          setEmbBusy(false);
                        }
                      }}
                      style={{ background: colors.primary, color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
                    >{embBusy ? t("agenticRagModule.generating") : t("agenticRagModule.generateFromPhrases")}</button>
                  )}
                </div>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>{t("agenticRagModule.phraseA")}</div>
                    <input value={phraseA} onChange={e=>{
                      const v = e.target.value;
                      setPhraseA(v);
                      if (!useRealEmb) {
                        const tv = toyEmbedding(v);
                        setVecA(formatVec(tv));
                        setTimeout(()=>computeCosine(), 0);
                      }
                    }} placeholder={t("agenticRagModule.placeholderPhraseA")} style={{ width: '100%', borderRadius: 6, border: `1px solid ${colors.border}`, padding: 8, marginBottom: 8 }}/>
                  </div>
                  <div>
                    <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>{t("agenticRagModule.phraseB")}</div>
                    <input value={phraseB} onChange={e=>{
                      const v = e.target.value;
                      setPhraseB(v);
                      if (!useRealEmb) {
                        const tv = toyEmbedding(v);
                        setVecB(formatVec(tv));
                        setTimeout(()=>computeCosine(), 0);
                      }
                    }} placeholder={t("agenticRagModule.placeholderPhraseB")} style={{ width: '100%', borderRadius: 6, border: `1px solid ${colors.border}`, padding: 8, marginBottom: 8 }}/>
                  </div>
                  <div>
                    <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>{t("agenticRagModule.vectorA")}</div>
                    <textarea value={vecA} onChange={e=>setVecA(e.target.value)} placeholder='[0.1, 0.3, -0.2]' style={{ width: '100%', minHeight: 70, borderRadius: 6, border: `1px solid ${colors.border}`, padding: 8 }}/>
                  </div>
                  <div>
                    <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>{t("agenticRagModule.vectorB")}</div>
                    <textarea value={vecB} onChange={e=>setVecB(e.target.value)} placeholder='[0.05, 0.32, -0.18]' style={{ width: '100%', minHeight: 70, borderRadius: 6, border: `1px solid ${colors.border}`, padding: 8 }}/>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <button onClick={computeCosine} style={{ background: colors.primary, color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>{t("agenticRagModule.calculateCosine")}</button>
                  {cosError && <span style={{ color: '#b91c1c', fontSize: 13 }}>{cosError}</span>}
                  {cosine !== null && !cosError && <span style={{ color: colors.text, fontSize: 14 }}>{t("agenticRagModule.cosineEquals")} <strong>{cosine.toFixed(4)}</strong></span>}
                </div>
              </div>
            )}
          </div>
        )}
        
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
                {t("agenticRagModule.indexingBannerTitle")}
              </h3>
              <p style={{ 
                fontSize: "16px", 
                marginBottom: "16px",
                opacity: 0.9
              }}>
                {t("agenticRagModule.indexingBannerSub")}
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
                <span style={{ fontSize: "14px", opacity: 0.8 }}>{t("agenticRagModule.processing")}</span>
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
          {t("agenticRagModule.debugLine", { status, indexing: String(indexing) })}
          <button 
            onClick={() => setStatus(t("agenticRagModule.testStatusUpdate", { time: new Date().toLocaleTimeString() }))}
            style={{ marginLeft: "8px", padding: "2px 6px", fontSize: "10px" }}
          >
            {t("agenticRagModule.testStatus")}
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
          {t("agenticRagModule.sectionDocIndexing")}
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
            {t("agenticRagModule.dropFiles")}
          </p>
          <p style={{ 
            color: colors.textSecondary, 
            fontSize: "14px"
          }}>
            {t("agenticRagModule.formatsHint")}
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
              {t("agenticRagModule.selectedFiles", { count: files.length })}
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
                {t("agenticRagModule.indexingInline")}
              </span>
            </div>
            <p style={{ 
              color: "#1e40af", 
              margin: "0", 
              fontSize: "12px"
            }}>
              {t("agenticRagModule.indexingBannerSub")}
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
               <span>{t("agenticRagModule.indexingButton")}</span>
             </>
           )}
           {!indexing && (
             <>
               <span style={{ fontSize: "20px" }}>🔍</span>
               <span>{t("agenticRagModule.indexDocuments")}</span>
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
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "16px"
        }}>
          <h2 style={{ 
            color: colors.text, 
            fontSize: "20px",
            fontWeight: "600",
            margin: "0"
          }}>
            {t("agenticRagModule.askQuestions")}
          </h2>
          

        </div>

        {/* Document Selection */}
        {indexedDocs.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ 
              color: colors.text, 
              marginBottom: "12px",
              fontSize: "16px",
              fontWeight: "500"
            }}>
              {t("agenticRagModule.availableDocuments", { count: indexedDocs.length })}
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
                {t("agenticRagModule.docsIndexedSuccess")}
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
              {t("agenticRagModule.noDocsWarning")}
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
            {t("agenticRagModule.yourQuestion")}
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("agenticRagModule.placeholderQuestion")}
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
            {t("agenticRagModule.advancedParams")}
          </h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", color: colors.textSecondary, fontSize: "12px" }}>
                {t("agenticRagModule.navDepth")}
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
                <option value={1}>{t("agenticRagModule.levelBasic")}</option>
                <option value={2}>{t("agenticRagModule.levelStandard")}</option>
                <option value={3}>{t("agenticRagModule.levelDeep")}</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "4px", color: colors.textSecondary, fontSize: "12px" }}>
                {t("agenticRagModule.initialCandidates")}
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
                {t("agenticRagModule.maxParagraphs")}
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
                {t("agenticRagModule.useHybridSearch")}
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
            {t("agenticRagModule.askQuestion")}
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
            {t("agenticRagModule.generateSummary")}
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
            {t("agenticRagModule.results")}
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
                {t("agenticRagModule.qualityAssessment")}
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
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>{t("agenticRagModule.faithfulness")}</div>
                </div>
                
                <div style={{ textAlign: "center" }}>
                  <div style={{ 
                    fontSize: "24px", 
                    fontWeight: "600",
                    color: result.scores.relevance >= 8 ? "#22c55e" : result.scores.relevance >= 6 ? "#eab308" : "#ef4444"
                  }}>
                    {result.scores.relevance}/10
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>{t("agenticRagModule.relevance")}</div>
                </div>
                
                <div style={{ textAlign: "center" }}>
                  <div style={{ 
                    fontSize: "24px", 
                    fontWeight: "600",
                    color: result.scores.completeness >= 8 ? "#22c55e" : result.scores.completeness >= 6 ? "#eab308" : "#ef4444"
                  }}>
                    {result.scores.completeness}/10
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>{t("agenticRagModule.completeness")}</div>
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
                  <strong>{t("agenticRagModule.comment")}</strong> {result.scores.comment}
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
              {t("agenticRagModule.answer")}
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
            <div style={{ 
              display: "flex", 
              gap: "8px", 
              marginTop: "8px"
            }}>
              <button
                onClick={() => copyToClipboard(result.answer)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  background: colors.secondary,
                  color: "white",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                {t("agenticRagModule.copyAnswer")}
              </button>
              <button
                onClick={() => saveCurrentAnalysis()}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  background: colors.primary,
                  color: "white",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                {t("agenticRagModule.saveAnalysis")}
              </button>
            </div>
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
                {t("agenticRagModule.sourcesCitations")}
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
                      {t("agenticRagModule.idLabel")} {citation.id}
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
                {t("agenticRagModule.performanceMetrics")}
              </h4>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                <div>
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>{t("agenticRagModule.totalTokens")}</div>
                  <div style={{ color: colors.text, fontSize: "16px", fontWeight: "500" }}>
                    {result.metrics.total_in + result.metrics.total_out}
                  </div>
                </div>
                
                <div>
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>{t("agenticRagModule.costUsd")}</div>
                  <div style={{ color: colors.text, fontSize: "16px", fontWeight: "500" }}>
                    ${result.metrics.total_cost_usd.toFixed(6)}
                  </div>
                </div>
                
                <div>
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>{t("agenticRagModule.latency")}</div>
                  <div style={{ color: colors.text, fontSize: "16px", fontWeight: "500" }}>
                    {result.metrics.total_latency_ms}ms
                  </div>
                </div>
                
                <div>
                  <div style={{ color: colors.textSecondary, fontSize: "12px" }}>{t("agenticRagModule.totalTime")}</div>
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
              {t("agenticRagModule.analysisTrace")}
            </h4>
            
            <div style={{ 
              padding: "16px",
              background: colors.background,
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              fontSize: "12px",
              color: colors.textSecondary
            }}>
              <div><strong>{t("agenticRagModule.routerSelected")}</strong> {result.router_selected?.join(", ") || t("agenticRagModule.none")}</div>
              <div><strong>{t("agenticRagModule.usedParagraphs")}</strong> {result.used_paragraphs?.join(", ") || t("agenticRagModule.none")}</div>
              <div><strong>{t("agenticRagModule.runId")}</strong> {result.run_id}</div>
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
          {t("agenticRagModule.helpTitle")}
        </h3>
        <p style={{ 
          color: colors.textSecondary, 
          marginBottom: "20px",
          fontSize: "16px"
        }}>
          {t("agenticRagModule.helpBody")}
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
            {t("agenticRagModule.featureZeroEmbedding")}
          </div>
          <div style={{ 
            padding: "12px 16px",
            background: colors.background,
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
            fontSize: "14px"
          }}>
            {t("agenticRagModule.featureTwoPass")}
          </div>
          <div style={{ 
            padding: "12px 16px",
            background: colors.background,
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
            fontSize: "14px"
          }}>
            {t("agenticRagModule.featureRecursive")}
          </div>
          <div style={{ 
            padding: "12px 16px",
            background: colors.background,
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
            fontSize: "14px"
          }}>
            {t("agenticRagModule.featureAiJudge")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgenticRAG;
