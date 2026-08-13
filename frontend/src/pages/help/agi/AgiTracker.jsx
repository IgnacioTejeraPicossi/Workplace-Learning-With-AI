import React, { useEffect, useMemo, useState } from 'react';
import { fetchAGIProgress, enrichTracker } from '../../../api/agiApi';
import ScoreGauge from '../../../components/agi/ScoreGauge';
import DomainRadar from '../../../components/agi/DomainRadar';
import TrendLine from '../../../components/agi/TrendLine';
import { useTranslation } from 'react-i18next';
import AiSuggestions, { ApplyDismissActions, SourceLink } from './AiSuggestions';

/** Locale-aware release label.
 *  When the item has a numeric `month` (1–12) it renders "<month>-<year>"
 *  in the active language (es → "junio-2026", en → "june-2026", no → "juni-2026").
 *  When month is absent it falls back to just the year — keeps backwards
 *  compatibility with older entries stored without a month field. */
const formatRelease = (item, lang) => {
  if (!item || item.year == null) return '';
  if (!item.month) return String(item.year);
  try {
    const d = new Date(item.year, item.month - 1, 1);
    const monthName = new Intl.DateTimeFormat(lang || 'en', { month: 'long' }).format(d).toLowerCase();
    return `${monthName}-${item.year}`;
  } catch {
    return String(item.year);
  }
};

export default function AgiTracker() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState({ model: '', year: new Date().getFullYear(), total: 0, scores: { K:0,RW:0,M:0,R:0,WM:0,MS:0,MR:0,V:0,A:0,S:0 } });

  useEffect(() => {
    fetchAGIProgress()
      .then(data => {
        setItems(data);
        // Default selection = newest model (by year, then month, then total)
        // so the dropdown and the charts start in sync on first render.
        const source = (data || []).slice().sort((a,b)=>
          (b.year - a.year) || ((b.month||0) - (a.month||0)) || (b.total - a.total));
        if (source[0]) setSelected(source[0].model);
      })
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const latest = useMemo(() => {
    const source = (items || []).slice().sort((a,b)=>
      (b.year - a.year) || ((b.month||0) - (a.month||0)) || (b.total - a.total));
    return source.find(i => i.model === selected) || source[0];
  }, [items, selected]);

  if (loading) return <div style={{ padding: 24 }}>{t('help.agiProgress.loading', { defaultValue: 'Loading AGI progress…' })}</div>;
  if (err) return <div style={{ padding: 24, color: '#dc2626' }}>{t('help.agiProgress.error', { defaultValue: 'Error:' })} {err}</div>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{t('help.agiProgress.title', { defaultValue: 'AGI Progress Tracker' })}</h2>
        <div style={{ color: '#64748b', fontSize: 14 }}>
          {t('help.agiProgress.subtitle', { defaultValue: 'Cognitive breadth across ten domains (CHC-inspired) based on Hendrycks et al. (2025) — updated through august-2026 with Claude Opus 4.6/4.7/4.8, Gemini 3.1 Pro, Claude Fable 5, plus Kimi K2.6 & K3 (Moonshot AI), GPT-5.6 Sol and Claude Opus 5.' })}
          {' ['}
          <a href="https://www.agidefinition.ai/paper.pdf" target="_blank" rel="noreferrer">{t('help.agiProgress.paper', { defaultValue: 'paper' })}</a>
          {']'}
        </div>
      </div>

      {latest && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{latest.model} — {t('help.agiProgress.overall', { defaultValue: 'Overall' })}</div>
            <ScoreGauge value={latest.total} />
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: '#64748b' }}>{t('help.agiProgress.modelLabel', { defaultValue: 'Model:' })}</label>
              <select value={selected} onChange={(e)=>setSelected(e.target.value)} style={{ marginLeft: 8, padding: '6px 8px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                {(items||[]).slice().sort((a,b)=> (a.year - b.year) || ((a.month||0) - (b.month||0))).map(i => (
                  <option key={`${i.model}-${i.year}-${i.month||0}`} value={i.model}>{i.model} ({formatRelease(i, i18n.language)})</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{latest.model} — {t('help.agiProgress.domainProfile', { defaultValue: 'Domain Profile' })}</div>
            <DomainRadar item={latest} />
            {latest.notes && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {t('help.agiProgress.benchmarkContext', { defaultValue: 'Benchmark context' })}:{' '}
                </span>
                {latest.notes}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('help.agiProgress.modelTrend', { defaultValue: 'Model Trend' })}</div>
        <TrendLine items={items} />
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('help.agiProgress.methodology', { defaultValue: 'Methodology' })}</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#374151', lineHeight: 1.6, fontSize: 14 }}>
          <li>{t('help.agiProgress.pt1', { defaultValue: 'Ten equally weighted cognitive domains (10% each): K, RW, M, R, WM, MS, MR, V, A, S.' })}</li>
          <li>{t('help.agiProgress.pt2', { defaultValue: 'Numbers are approximations synthesized from public summaries and mappings to CHC abilities.' })}</li>
          <li>{t('help.agiProgress.pt3', { defaultValue: 'This is a directional indicator, not a certification of "AGI achieved".' })}</li>
        </ul>
        <div style={{ marginTop: 12, fontSize: 13 }}>
          {t('help.agiProgress.source', { defaultValue: 'Source paper:' })} <a href="https://www.agidefinition.ai/paper.pdf" target="_blank" rel="noreferrer">A Definition of AGI (Hendrycks et al., Oxford–MIT–Cornell, CAIS)</a>
        </div>
      </div>

      {/* AI enrichment — web + LLM suggestions */}
      <AiSuggestions
        fetchSuggestions={() => enrichTracker(items || [])}
        onApply={async (s) => {
          const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
          const payload = {
            model: s.model,
            year: s.year,
            scores: s.scores,
            total: s.total,
            notes: s.notes || '',
          };
          const res = await fetch(`${API_BASE}/api/agi/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`POST /api/agi/progress failed (${res.status})`);
          const row = await res.json();
          setItems(prev => {
            const without = (prev || []).filter(r => !(r.model === row.model && r.year === row.year));
            return [...without, row];
          });
          setSelected(row.model);
        }}
        renderSuggestion={(s, { onApply, onDismiss, applied, t: tt }) => {
          const ok = s && s.scores && typeof s.total === 'number';
          const sumCheck = ok ? Object.values(s.scores).reduce((a, b) => a + Number(b || 0), 0) : 0;
          const mismatch = ok && sumCheck !== s.total;
          const kindBadge = s.kind === 'new' ? { bg: '#dbeafe', color: '#1e40af', label: 'NEW MODEL' }
                          : s.kind === 'update' ? { bg: '#fef3c7', color: '#92400e', label: 'SCORE UPDATE' }
                          : { bg: '#e5e7eb', color: '#374151', label: (s.kind || '').toUpperCase() };
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <span style={{
                    background: kindBadge.bg, color: kindBadge.color,
                    padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    letterSpacing: 0.5,
                  }}>{kindBadge.label}</span>
                  <span style={{ marginLeft: 8, fontWeight: 700, fontSize: 14 }}>
                    {s.model} ({s.year})
                  </span>
                  <span style={{ marginLeft: 8, color: '#1d4ed8', fontWeight: 700 }}>
                    {s.total}%
                  </span>
                  {mismatch && (
                    <span style={{ marginLeft: 8, color: '#dc2626', fontSize: 11 }}>
                      ⚠ sum({sumCheck}) ≠ total({s.total})
                    </span>
                  )}
                </div>
              </div>
              {s.notes && (
                <div style={{ fontSize: 12, color: '#374151', marginTop: 6, lineHeight: 1.5 }}>
                  {s.notes}
                </div>
              )}
              {s.scores && (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)',
                  gap: 4, marginTop: 8, fontSize: 11,
                }}>
                  {['K','RW','M','R','WM','MS','MR','V','A','S'].map(k => (
                    <div key={k} style={{ textAlign: 'center' }}>
                      <div style={{ color: '#6b7280', fontSize: 10 }}>{k}</div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{s.scores[k] ?? '—'}</div>
                    </div>
                  ))}
                </div>
              )}
              {Array.isArray(s.sources) && s.sources.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {s.sources.map((u, i) => (
                    <div key={i}><SourceLink url={u} /></div>
                  ))}
                </div>
              )}
              <ApplyDismissActions
                onApply={onApply}
                onDismiss={onDismiss}
                applied={applied}
                t={tt}
                applyLabel={tt('help.agiProgress.aiEnrich.applyTracker', { defaultValue: 'Apply & save' })}
              />
            </div>
          );
        }}
      />

      {/* Admin mini-form */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('help.agiProgress.addModel', { defaultValue: 'Add Model (Admin)' })}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <input placeholder={t('help.agiProgress.phModel', { defaultValue: 'Model (e.g., GPT-6)' })} value={form.model} onChange={(e)=>setForm({ ...form, model: e.target.value })} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          <input type="number" placeholder={t('help.agiProgress.phYear', { defaultValue: 'Year' })} value={form.year} onChange={(e)=>setForm({ ...form, year: Number(e.target.value) })} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
          <input type="number" placeholder={t('help.agiProgress.phTotal', { defaultValue: 'Total %' })} value={form.total} onChange={(e)=>setForm({ ...form, total: Number(e.target.value) })} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
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
          }} style={{ background: '#3b82f6', color: 'white', padding: '8px 14px', borderRadius: 8, border: 'none' }}>{t('help.agiProgress.save', { defaultValue: 'Save' })}</button>
        </div>
      </div>
    </div>
  );
}
