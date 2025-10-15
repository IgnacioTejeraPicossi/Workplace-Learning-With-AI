import React, { useEffect, useState } from 'react';

export default function PromptPanel({ agent, nativePromptText, colors, onUseResult }) {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [testing, setTesting] = useState(false);
  const [testOutput, setTestOutput] = useState('');

  const load = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/prompts/${agent}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {}
  };

  useEffect(() => { load(); }, [agent]);

  const save = async () => {
    if (!prompt.trim()) return;
    const res = await fetch(`http://localhost:8000/api/prompts/${agent}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || 'Untitled', prompt })
    });
    if (res.ok) { setName(''); setPrompt(''); load(); }
  };

  const update = async () => {
    if (!selectedId) return;
    const res = await fetch(`http://localhost:8000/api/prompts/${agent}/${selectedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, prompt })
    });
    if (res.ok) load();
  };

  const remove = async (id) => {
    await fetch(`http://localhost:8000/api/prompts/${agent}/${id}`, { method: 'DELETE' });
    if (selectedId === id) { setSelectedId(''); setName(''); setPrompt(''); }
    load();
  };

  const test = async () => {
    setTesting(true); setTestOutput('');
    try {
      const res = await fetch(`http://localhost:8000/api/prompts/${agent}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setTestOutput(data.output || data.error || '');
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
        <span>🧩</span> Prompt Manager
      </h2>

      {/* Native prompt */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: '#334155' }}>Native prompt</div>
        <textarea
          readOnly
          value={nativePromptText || '(no definido en código)'}
          style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b' }}
        />
      </div>

      {/* Editor prompt temporal */}
      <div style={{ marginBottom: 12, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Prompt name"
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
          <button onClick={save} style={{ padding: '10px 12px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff' }}>Save</button>
          <button onClick={update} disabled={!selectedId} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>Update</button>
        </div>
        <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="Write your prompt here..."
          style={{ width: '100%', minHeight: 140, padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={test} disabled={testing || !prompt.trim()} style={{ padding: '10px 12px', borderRadius: 8, border: 'none', background: testing? '#94a3b8':'#22c55e', color: '#fff' }}>{testing? 'Testing...' : 'Test'}</button>
        </div>
      </div>

      {/* Lista de prompts guardados */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: '#334155' }}>Saved prompts</div>
        {items.length === 0 ? (
          <div style={{ color: '#94a3b8' }}>No saved prompts.</div>
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
                  <button onClick={()=>{ setSelectedId(it._id); setName(it.name); setPrompt(it.prompt); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff' }}>Edit</button>
                  <button onClick={()=>remove(it._id)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fee2e2', color: '#b91c1c' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test output */}
      {testOutput && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#334155' }}>Test result</div>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', color: '#111827' }}>{testOutput}</pre>
        </div>
      )}
    </div>
  );
}


