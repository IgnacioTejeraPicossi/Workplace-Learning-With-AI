import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWithAuth } from '../api';
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export default function PromptPanel({ agent, nativePromptText, colors, onUseResult, promptVersion, analyzeTest }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [testing, setTesting] = useState(false);
  const [testOutput, setTestOutput] = useState('');
  const [injectionWarn, setInjectionWarn] = useState(null);

  const load = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/prompts/${agent}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {}
  };

  useEffect(() => { load(); }, [agent]);

  const save = async () => {
    if (!prompt.trim()) return;
    const res = await fetchWithAuth(`${API_BASE}/api/prompts/${agent}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || 'Untitled', prompt })
    });
    if (res.ok) { setName(''); setPrompt(''); load(); }
  };

  const update = async () => {
    if (!selectedId) return;
    const res = await fetchWithAuth(`${API_BASE}/api/prompts/${agent}/${selectedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, prompt })
    });
    if (res.ok) load();
  };

  const remove = async (id) => {
    await fetchWithAuth(`${API_BASE}/api/prompts/${agent}/${id}`, { method: 'DELETE' });
    if (selectedId === id) { setSelectedId(''); setName(''); setPrompt(''); }
    load();
  };

  const test = async () => {
    setTesting(true); setTestOutput(''); setInjectionWarn(null);
    try {
      // J-messages Analyzer: "Test" = same as "Analyze file" on selected document, with prompt from panel
      if (analyzeTest?.file) {
        const form = new FormData();
        form.append('file', analyzeTest.file);
        const effectivePrompt = (prompt || '').trim() || (nativePromptText && !/^\(/.test(nativePromptText) ? nativePromptText : '');
        if (effectivePrompt) form.append('metadata_prompt_override', effectivePrompt);
        const params = new URLSearchParams();
        if (analyzeTest.summaryLength) params.append('summary_length', analyzeTest.summaryLength);
        params.append('complexity', analyzeTest.complexity || 'low');
        if (Number.isFinite(analyzeTest.temperature)) params.append('temperature', String(analyzeTest.temperature));
        const url = `/api/j-messages/analyze${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetchWithAuth(url, { method: 'POST', body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.detail || res.statusText || 'Request failed';
          const errStr = typeof msg === 'string' ? msg : JSON.stringify(msg);
          setTestOutput(errStr);
          analyzeTest.onError?.(errStr);
        } else {
          analyzeTest.onResult?.(data);
          setTestOutput('✅ ' + (t('components.prompt.analyzeComplete', { defaultValue: 'Analysis complete. Result displayed above.' })));
        }
        return;
      }

      // Read Robomind Clinic policy sliders to include as guardrails in prompt
      let policyNote = '';
      try {
        const pol = JSON.parse(window.localStorage.getItem('clinic_policy') || '{}');
        if (pol && pol.enabled) {
          policyNote = `\n\n[POLICY]\nSampling Rate: ${pol.samplingRate}%\nBlock Threshold: ${pol.thresholdBlock}%\nReview Threshold: ${pol.thresholdReview}%\n`;
        }
      } catch {}

      const clinicHeader = (() => {
        try { return JSON.stringify(JSON.parse(window.localStorage.getItem('clinic_policy')||'{}')); } catch { return '{}'; }
      })();
      const res = await fetchWithAuth(`${API_BASE}/api/prompts/${agent}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Clinic-Policy': clinicHeader },
        body: JSON.stringify({ prompt: policyNote ? `${policyNote}\n${prompt}` : prompt })
      });
      const data = await res.json();
      if (data?.blocked) {
        setInjectionWarn('Prompt blocked by security policy (possible prompt-injection).');
        setTestOutput('');
      } else {
        setTestOutput(data.output || data.error || '');
      }
      // Heuristic client-side prompt injection flag (mirrors backend)
      const lower = (prompt || '').toLowerCase();
      const hit = [
        'ignore previous', 'disregard instructions', 'system prompt',
        'jailbreak', 'developer mode', 'roleplay as', 'override'
      ].some(p=>lower.includes(p));
      if (hit) setInjectionWarn('Potential prompt-injection pattern detected. Consider sanitizing.');
      if (onUseResult) {
        onUseResult({ raw: data.output, summary: data.summary, risks: data.risks, actions: data.actions });
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
      marginBottom: '24px'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>🧩</span> {t('components.prompt.title', { defaultValue: 'Prompt Manager' })}
      </h2>

      {/* Native prompt */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ fontWeight: 600, color: '#334155' }}>{t('components.prompt.native', { defaultValue: 'Native prompt' })}</div>
          {promptVersion && (
            <span style={{ fontSize: '0.85em', color: '#64748b', padding: '2px 8px', borderRadius: 4, background: '#e2e8f0' }}>
              v{promptVersion.replace(/^v/, '')}
            </span>
          )}
        </div>
        <textarea
          readOnly
          value={nativePromptText || t('components.prompt.undefined', { defaultValue: '(not defined in code)' })}
          style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontFamily: 'monospace', fontSize: '0.9em' }}
        />
      </div>

      {/* Editor prompt temporal */}
      <div style={{ marginBottom: 12, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder={t('components.prompt.namePlaceholder', { defaultValue: 'Prompt name' })}
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
          <button onClick={save} style={{ padding: '10px 12px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff' }}>{t('components.prompt.save', { defaultValue: 'Save' })}</button>
          <button onClick={update} disabled={!selectedId} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>{t('components.prompt.update', { defaultValue: 'Update' })}</button>
        </div>
        <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder={t('components.prompt.writeHere', { defaultValue: 'Write your prompt here...' })}
          style={{ width: '100%', minHeight: 140, padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff' }} />
        {injectionWarn && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '10px 12px', borderRadius: 8 }}>
            ⚠️ {injectionWarn}
            <button onClick={()=>{
              // simple sanitize: remove risky phrases
              const cleaned = prompt
                .replace(/ignore previous/ig,'')
                .replace(/disregard instructions/ig,'')
                .replace(/system prompt/ig,'')
                .replace(/jailbreak/ig,'')
                .replace(/developer mode/ig,'')
                .replace(/roleplay as/ig,'')
                .replace(/override/ig,'');
              setPrompt(cleaned);
              setInjectionWarn(null);
            }} style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 6, border: 'none', background: '#f59e0b', color: '#fff' }}>{t('components.prompt.sanitize', { defaultValue: 'Sanitize prompt' })}</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={test} disabled={testing || (analyzeTest ? !analyzeTest?.file : !(prompt || '').trim())} style={{ padding: '10px 12px', borderRadius: 8, border: 'none', background: testing? '#94a3b8':'#22c55e', color: '#fff' }} title={analyzeTest ? (t('components.prompt.testAnalyzeHint', { defaultValue: "Same as 'Analyze file' on the selected document, using the prompt above." })) : undefined}>{testing? t('components.prompt.testing', { defaultValue: 'Testing...' }) : t('components.prompt.test', { defaultValue: 'Test' })}</button>
        </div>
      </div>

      {/* Lista de prompts guardados */}
        <div style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: '#334155' }}>{t('components.prompt.saved', { defaultValue: 'Saved prompts' })}</div>
        {items.length === 0 ? (
          <div style={{ color: '#94a3b8' }}>{t('components.prompt.noSaved', { defaultValue: 'No saved prompts.' })}</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {items.map((it)=> (
              <div key={it._id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr auto', 
                alignItems: 'center', 
                columnGap: 8, 
                border: '1px solid #e2e8f0', 
                borderRadius: 8, 
                padding: 8,
                width: '100%'
              }}>
                <div style={{ minWidth: 0 /* allow ellipsis */ }}>
                  <div title={it.name} style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                  <div title={it.prompt} style={{ fontSize: '0.85em', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.prompt}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifySelf: 'end' }}>
                  <button onClick={()=>{ setSelectedId(it._id); setName(it.name); setPrompt(it.prompt); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff' }}>{t('components.prompt.edit', { defaultValue: 'Edit' })}</button>
                  <button onClick={()=>remove(it._id)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fee2e2', color: '#b91c1c' }}>{t('components.prompt.delete', { defaultValue: 'Delete' })}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test output */}
      {testOutput && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#334155' }}>{t('components.prompt.testResult', { defaultValue: 'Test result' })}</div>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', color: '#111827' }}>{testOutput}</pre>
        </div>
      )}
    </div>
  );
}


