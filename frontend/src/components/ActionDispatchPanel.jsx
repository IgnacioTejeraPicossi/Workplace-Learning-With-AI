import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ActionDispatchPanel({ title = 'Send to OutSystems Agent', endpoint, buildPayload, ready }) {
  const { t } = useTranslation();
  const [dest, setDest] = useState({ jira: { enabled: true }, slack: { enabled: true }, sheets: { enabled: true } });
  const [busy, setBusy] = useState(false);
  const toggle = (k) => setDest({ ...dest, [k]: { ...(dest[k] || {}), enabled: !(dest[k]?.enabled) } });

  // Load defaults from localStorage or env on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dispatch.defaults');
      const envDefaults = {
        jira: {
          enabled: true,
          projectKey: process.env.REACT_APP_DEFAULT_JIRA_PROJECT_KEY || undefined,
        },
        slack: {
          enabled: true,
          channel: process.env.REACT_APP_DEFAULT_SLACK_CHANNEL || undefined,
        },
        sheets: {
          enabled: true,
          sheetId: process.env.REACT_APP_DEFAULT_SHEETS_ID || undefined,
        },
      };
      if (saved) {
        const parsed = JSON.parse(saved);
        setDest((d) => ({
          jira: { enabled: parsed?.jira?.enabled ?? true, projectKey: parsed?.jira?.projectKey || envDefaults.jira.projectKey },
          slack: { enabled: parsed?.slack?.enabled ?? true, channel: parsed?.slack?.channel || envDefaults.slack.channel },
          sheets: { enabled: parsed?.sheets?.enabled ?? true, sheetId: parsed?.sheets?.sheetId || envDefaults.sheets.sheetId },
        }));
      } else {
        setDest((d) => ({ ...d, ...envDefaults }));
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on change
  useEffect(() => {
    try { localStorage.setItem('dispatch.defaults', JSON.stringify(dest)); } catch (_) {}
  }, [dest]);

  async function submit() {
    if (!ready) return;
    setBusy(true);
    try {
      // Normalize inputs before building payload
      const normalized = { ...dest };
      // Slack: allow either #channel or full webhook URL
      const slackInput = dest?.slack?.channel;
      if (slackInput && typeof slackInput === 'string') {
        if (/^https?:\/\//i.test(slackInput)) {
          normalized.slack = { ...dest.slack, webhookUrl: slackInput };
        } else {
          normalized.slack = { ...dest.slack, channel: slackInput };
        }
      }
      // Sheets: accept full URL and extract spreadsheet id
      const sheetInput = dest?.sheets?.sheetId;
      if (sheetInput && typeof sheetInput === 'string') {
        const match = sheetInput.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        const onlyId = match ? match[1] : sheetInput.trim();
        normalized.sheets = { ...dest.sheets, sheetId: onlyId };
      }

      const payload = buildPayload(normalized);
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      // Try to extract meaningful error details from JSON or text
      let data = {};
      try { data = await res.json(); } catch (_) {
        try { const t = await res.text(); data = { error: t }; } catch (_) { data = {}; }
      }
      if (!res.ok) {
        const detail = data?.detail || data?.error || data?.message || res.statusText;
        throw new Error(detail);
      }
      alert(`Dispatched successfully. Run: ${data?.run_id || 'OK'}`);
    } catch (e) {
      alert('Dispatch error: ' + (e?.message || 'unknown'));
    } finally { setBusy(false); }
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>🚀 {title}</h3>
        <button onClick={submit} disabled={!ready || busy} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 600, cursor: (!ready || busy) ? 'not-allowed' : 'pointer', opacity: (!ready || busy) ? 0.6 : 1 }}>{t('components.dispatch.send', { defaultValue: 'Send' })}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={!!dest.jira?.enabled} onChange={()=>toggle('jira')} />
          <span style={{ minWidth: 32, fontWeight: 600 }}>Jira</span>
          <input placeholder={t('components.dispatch.jira.placeholder', { defaultValue: 'Project Key (e.g. TEST)' })} onChange={e=>setDest({ ...dest, jira: { ...dest.jira, projectKey: e.target.value } })} style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={!!dest.slack?.enabled} onChange={()=>toggle('slack')} />
          <span style={{ minWidth: 32, fontWeight: 600 }}>Slack</span>
          <input placeholder={t('components.dispatch.slack.placeholder', { defaultValue: '#channel or webhook URL' })} onChange={e=>setDest({ ...dest, slack: { ...dest.slack, channel: e.target.value } })} style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={!!dest.sheets?.enabled} onChange={()=>toggle('sheets')} />
          <span style={{ minWidth: 32, fontWeight: 600 }}>Sheets</span>
          <input placeholder={t('components.dispatch.sheets.placeholder', { defaultValue: 'Spreadsheet ID or full URL' })} onChange={e=>setDest({ ...dest, sheets: { ...dest.sheets, sheetId: e.target.value } })} style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px' }} />
        </label>
      </div>
      {!ready && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>{t('components.dispatch.completeAnalysis', { defaultValue: 'Complete the analysis first to enable sending.' })}</div>
      )}
    </div>
  );
}


