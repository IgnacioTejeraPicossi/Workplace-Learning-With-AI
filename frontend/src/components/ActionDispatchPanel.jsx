import React, { useState } from 'react';

export default function ActionDispatchPanel({ title = 'Send to OutSystems Agent', endpoint, buildPayload, ready }) {
  const [dest, setDest] = useState({ jira: { enabled: true }, slack: { enabled: true }, sheets: { enabled: true } });
  const [busy, setBusy] = useState(false);
  const toggle = (k) => setDest({ ...dest, [k]: { ...(dest[k] || {}), enabled: !(dest[k]?.enabled) } });

  async function submit() {
    if (!ready) return;
    setBusy(true);
    try {
      const payload = buildPayload(dest);
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data?.error || res.statusText);
      alert(`Dispatched successfully. Run: ${data?.run_id || 'OK'}`);
    } catch (e) {
      alert('Dispatch error: ' + (e?.message || 'unknown'));
    } finally { setBusy(false); }
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>🚀 {title}</h3>
        <button onClick={submit} disabled={!ready || busy} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 600, cursor: (!ready || busy) ? 'not-allowed' : 'pointer', opacity: (!ready || busy) ? 0.6 : 1 }}>Send</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={!!dest.jira?.enabled} onChange={()=>toggle('jira')} />
          <span style={{ minWidth: 32, fontWeight: 600 }}>Jira</span>
          <input placeholder="Project Key" onChange={e=>setDest({ ...dest, jira: { ...dest.jira, projectKey: e.target.value } })} style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={!!dest.slack?.enabled} onChange={()=>toggle('slack')} />
          <span style={{ minWidth: 32, fontWeight: 600 }}>Slack</span>
          <input placeholder="#channel" onChange={e=>setDest({ ...dest, slack: { ...dest.slack, channel: e.target.value } })} style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={!!dest.sheets?.enabled} onChange={()=>toggle('sheets')} />
          <span style={{ minWidth: 32, fontWeight: 600 }}>Sheets</span>
          <input placeholder="Sheet ID" onChange={e=>setDest({ ...dest, sheets: { ...dest.sheets, sheetId: e.target.value } })} style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px' }} />
        </label>
      </div>
      {!ready && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>Complete the analysis first to enable sending.</div>
      )}
    </div>
  );
}


