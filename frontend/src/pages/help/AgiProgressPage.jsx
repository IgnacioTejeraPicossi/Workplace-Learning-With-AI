import React, { useEffect, useMemo, useState } from 'react';
import { fetchAGIProgress } from '../../api/agiApi';
import ScoreGauge from '../../components/agi/ScoreGauge';
import DomainRadar from '../../components/agi/DomainRadar';
import TrendLine from '../../components/agi/TrendLine';

export default function AgiProgressPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState({ model: '', year: new Date().getFullYear(), total: 0, scores: { K:0,RW:0,M:0,R:0,WM:0,MS:0,MR:0,V:0,A:0,S:0 } });

  useEffect(() => {
    fetchAGIProgress()
      .then(setItems)
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const latest = useMemo(() => {
    const source = (items || []).slice().sort((a,b)=> (b.year - a.year) || b.total - a.total);
    return source.find(i => i.model === selected) || source[0];
  }, [items, selected]);

  if (loading) return <div style={{ padding: 24 }}>Loading AGI progress…</div>;
  if (err) return <div style={{ padding: 24, color: '#dc2626' }}>Error: {err}</div>;

  return (
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>AGI Progress Tracker</h2>
        <div style={{ color: '#64748b', fontSize: 14 }}>Cognitive breadth across ten domains (CHC-inspired) based on Hendrycks et al. [<a href="https://www.agidefinition.ai/paper.pdf" target="_blank" rel="noreferrer">paper</a>]</div>
      </div>

      {latest && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{latest.model} — Overall</div>
            <ScoreGauge value={latest.total} />
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: '#64748b' }}>Model:</label>
              <select value={selected} onChange={(e)=>setSelected(e.target.value)} style={{ marginLeft: 8, padding: '6px 8px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                {(items||[]).slice().sort((a,b)=>a.year-b.year).map(i => (
                  <option key={`${i.model}-${i.year}`} value={i.model}>{i.model} ({i.year})</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{latest.model} — Domain Profile</div>
            <DomainRadar item={latest} />
          </div>
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Model Trend</div>
        <TrendLine items={items} />
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Methodology</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#374151', lineHeight: 1.6, fontSize: 14 }}>
          <li>Ten equally weighted cognitive domains (10% each): K, RW, M, R, WM, MS, MR, V, A, S.</li>
          <li>Numbers are approximations synthesized from public summaries and mappings to CHC abilities.</li>
          <li>This is a directional indicator, not a certification of “AGI achieved”.</li>
        </ul>
        <div style={{ marginTop: 12, fontSize: 13 }}>
          Source paper: <a href="https://www.agidefinition.ai/paper.pdf" target="_blank" rel="noreferrer">A Definition of AGI (Hendrycks et al., Oxford–MIT–Cornell, CAIS)</a>
        </div>
      </div>

      {/* Admin mini-form */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Add Model (Admin)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <input placeholder="Model (e.g., GPT-6)" value={form.model} onChange={(e)=>setForm({ ...form, model: e.target.value })} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          <input type="number" placeholder="Year" value={form.year} onChange={(e)=>setForm({ ...form, year: Number(e.target.value) })} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          <input type="number" placeholder="Total %" value={form.total} onChange={(e)=>setForm({ ...form, total: Number(e.target.value) })} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8, marginTop: 12, fontSize: 12 }}>
          {['K','RW','M','R','WM','MS','MR','V','A','S'].map(k => (
            <div key={k}>
              <div style={{ color: '#64748b' }}>{k}</div>
              <input type="number" min={0} max={10} value={form.scores[k]} onChange={(e)=>setForm({ ...form, scores: { ...form.scores, [k]: Number(e.target.value) } })} style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={async ()=>{
            try {
              const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
              const res = await fetch(`${API_BASE}/api/agi/progress`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(form) });
              if (res.ok) {
                const row = await res.json();
                setItems(prev => [...prev, row]);
                setSelected(row.model);
              }
            } catch {}
          }} style={{ background: '#3b82f6', color: 'white', padding: '8px 14px', borderRadius: 8, border: 'none' }}>Save</button>
        </div>
      </div>
    </div>
  );
}


