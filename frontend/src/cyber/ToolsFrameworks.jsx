import React, { useEffect, useState } from 'react';

const OWASP_ITEMS = [
  { id: 'A01', name: 'Broken Access Control' },
  { id: 'A02', name: 'Cryptographic Failures' },
  { id: 'A03', name: 'Injection' },
  { id: 'A04', name: 'Insecure Design' },
  { id: 'A05', name: 'Security Misconfiguration' },
  { id: 'A06', name: 'Vulnerable and Outdated Components' },
  { id: 'A07', name: 'Identification and Authentication Failures' },
  { id: 'A08', name: 'Software and Data Integrity Failures' },
  { id: 'A09', name: 'Security Logging and Monitoring Failures' },
  { id: 'A10', name: 'Server-Side Request Forgery (SSRF)' }
];

const TACTICS = [
  { id: 'TA0043', name: 'Reconnaissance', examples: ['Subdomain enumeration', 'Tech fingerprinting'] },
  { id: 'TA0001', name: 'Initial Access', examples: ['Phishing', 'Exposed service exploit'] },
  { id: 'TA0002', name: 'Execution', examples: ['Command execution', 'Script payloads'] },
  { id: 'TA0003', name: 'Persistence', examples: ['New service', 'Startup item'] },
  { id: 'TA0004', name: 'Privilege Escalation', examples: ['Token manipulation', 'Misconfig abuse'] },
  { id: 'TA0005', name: 'Defense Evasion', examples: ['Log tampering', 'Obfuscation'] },
  { id: 'TA0006', name: 'Credential Access', examples: ['Keylogging', 'Dump creds'] },
  { id: 'TA0007', name: 'Discovery', examples: ['Network scan', 'Account discovery'] },
  { id: 'TA0008', name: 'Lateral Movement', examples: ['RDP/SSH pivot', 'Pass-the-hash'] },
  { id: 'TA0009', name: 'Collection', examples: ['File staging', 'Clipboard data'] },
  { id: 'TA0011', name: 'Command and Control', examples: ['C2 channel', 'Domain fronting'] },
  { id: 'TA0010', name: 'Exfiltration', examples: ['Protocol exfil', 'Cloud sync'] },
  { id: 'TA0040', name: 'Impact', examples: ['Encrypt data', 'Service stop'] }
];

export default function ToolsFrameworks() {
  const storageKey = 'owasp_checklist_v1';
  const presetsKey = 'owasp_checklist_presets_v1';
  const settingsKey = 'owasp_tools_settings_v1';
  const [checklist, setChecklist] = useState({});
  const [notes, setNotes] = useState('');
  const [project, setProject] = useState('default');
  const [presets, setPresets] = useState({});
  const [settings, setSettings] = useState({ jiraUrl: '', projectKey: '' });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setChecklist(saved.items || {});
      setNotes(saved.notes || '');
    } catch {}
    try {
      const p = JSON.parse(localStorage.getItem(presetsKey) || '{}');
      setPresets(p);
    } catch {}
    try {
      const s = JSON.parse(localStorage.getItem(settingsKey) || '{}');
      setSettings({ jiraUrl: s.jiraUrl || '', projectKey: s.projectKey || '' });
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem(storageKey, JSON.stringify({ items: checklist, notes }));
    alert('Saved locally.');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ items: checklist, notes, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'owasp-checklist.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const setItem = (id, field, value) => {
    setChecklist((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  };

  const savePreset = () => {
    const p = { ...(presets || {}) };
    p[project || 'default'] = { items: checklist, notes, ts: new Date().toISOString() };
    setPresets(p);
    localStorage.setItem(presetsKey, JSON.stringify(p));
    alert('Preset saved.');
  };

  const loadPreset = () => {
    const p = (presets || {})[project || 'default'];
    if (!p) return alert('No preset found for this project.');
    setChecklist(p.items || {});
    setNotes(p.notes || '');
  };

  const deletePreset = () => {
    const p = { ...(presets || {}) };
    delete p[project || 'default'];
    setPresets(p);
    localStorage.setItem(presetsKey, JSON.stringify(p));
  };

  const copyJiraMarkdown = () => {
    const lines = [];
    lines.push(`# OWASP Top 10 Checklist — Project: ${project || 'default'}`);
    lines.push('');
    OWASP_ITEMS.forEach((i) => {
      const r = checklist[i.id] || {};
      lines.push(`- **${i.id} ${i.name}** — Status: ${r.status || '—'}, Severity: ${r.severity || '—'}${r.comment ? ` — ${r.comment}` : ''}`);
    });
    if (notes) {
      lines.push('');
      lines.push('## General Notes');
      lines.push(notes);
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => alert('Copied Jira Markdown.'));
  };

  const saveSettings = () => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    alert('Settings saved.');
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>🧰 Tools & Frameworks</h2>
        <p style={{ color: '#6b7280', marginTop: 6 }}>
          Quick utilities for OWASP Top 10 checks and MITRE ATT&CK mapping. Use this as a lightweight companion to PenTesting/Red Team activities.
        </p>
      </div>

      {/* Project Presets + Jira Settings */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: '#111827' }}>Project Presets & Jira Export</h3>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', color: '#6b7280' }}>Project</label>
            <input value={project} onChange={(e)=>setProject(e.target.value)} placeholder="my-service" />
          </div>
          <div>
            <label style={{ display: 'block', color: '#6b7280' }}>Jira Base URL</label>
            <input value={settings.jiraUrl} onChange={(e)=>setSettings(s=>({ ...s, jiraUrl: e.target.value }))} placeholder="https://jira.example.com" />
          </div>
          <div>
            <label style={{ display: 'block', color: '#6b7280' }}>Jira Project Key</label>
            <input value={settings.projectKey} onChange={(e)=>setSettings(s=>({ ...s, projectKey: e.target.value }))} placeholder="SEC" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={savePreset} style={btn}>💾 Save Preset</button>
          <button onClick={loadPreset} style={btn}>📥 Load Preset</button>
          <button onClick={deletePreset} style={btn}>🗑️ Delete Preset</button>
          <button onClick={saveSettings} style={btn}>⚙️ Save Settings</button>
          <button onClick={copyJiraMarkdown} style={btn}>📋 Copy Jira Markdown</button>
        </div>
      </div>

      {/* OWASP Checklist */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: '#111827' }}>OWASP Top 10 Checklist</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="https://www.intruder.io/product/owasp-top-10-vulnerability-scanner" target="_blank" rel="noreferrer"
               style={{ background: '#3b82f6', color: 'white', padding: '6px 10px', borderRadius: 6, textDecoration: 'none' }}>
              ⛏️ Intruder OWASP Scanner
            </a>
            <button onClick={save} style={{ background: '#f3f4f6', padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}>💾 Save</button>
            <button onClick={exportJson} style={{ background: '#f3f4f6', padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}>⬇ Export</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Name</th>
                <th style={th}>Status</th>
                <th style={th}>Severity</th>
                <th style={th}>Comment</th>
              </tr>
            </thead>
            <tbody>
              {OWASP_ITEMS.map((item) => {
                const row = checklist[item.id] || {};
                return (
                  <tr key={item.id}>
                    <td style={td}><strong>{item.id}</strong></td>
                    <td style={td}>{item.name}</td>
                    <td style={td}>
                      <select value={row.status || ''} onChange={(e)=>setItem(item.id, 'status', e.target.value)}>
                        <option value="">—</option>
                        <option value="ok">OK</option>
                        <option value="issue">Issue</option>
                        <option value="n/a">N/A</option>
                      </select>
                    </td>
                    <td style={td}>
                      <select value={row.severity || ''} onChange={(e)=>setItem(item.id, 'severity', e.target.value)}>
                        <option value="">—</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </td>
                    <td style={td}>
                      <input value={row.comment || ''} onChange={(e)=>setItem(item.id, 'comment', e.target.value)} placeholder="Note…" style={{ width: '100%' }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', color: '#6b7280', marginBottom: 6 }}>General Notes</label>
          <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3} style={{ width: '100%' }} />
        </div>
      </div>

      {/* MITRE ATT&CK Mapper */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: '#111827' }}>MITRE ATT&CK Mapper</h3>
          <a href="https://www.microsoft.com/en-us/security/business/security-101/what-is-mitre-attack-framework" target="_blank" rel="noreferrer"
             style={{ background: '#3b82f6', color: 'white', padding: '6px 10px', borderRadius: 6, textDecoration: 'none' }}>
            📚 Microsoft ATT&CK Guide
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {TACTICS.map(t => (
            <div key={t.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.name}</div>
              <div style={{ fontSize: '0.9em', color: '#6b7280' }}>
                Examples: {t.examples.join(', ')}
              </div>
              <div style={{ marginTop: 8, fontSize: '0.85em' }}>
                <div style={{ color: '#111827', fontWeight: 600, marginBottom: 4 }}>Signals & Controls (our platform)</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Agent Security: Zero‑Trust compliance & DLP findings</li>
                  <li>Threat Library: Add detection ideas per tactic</li>
                  <li>Dashboard KPIs: risk score, patch latency, vuln counts</li>
                </ul>
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', color: '#6b7280', marginBottom: 4 }}>SIEM Detection idea</label>
                <textarea rows={3} style={{ width: '100%' }} defaultValue={`rule: ${t.name} suspected\nwhen:\n  - abnormal_auth\n  - rare_process_tree\nnotes: Map to ATT&CK ${t.id}\n`} />
              </div>
              <div style={{ marginTop: 6 }}>
                <button onClick={(e)=>navigator.clipboard.writeText(e.currentTarget.parentElement.querySelector('textarea').value)} style={btn}>📋 Copy snippet</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ZAP/DAST Mini Lab */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>ZAP/DAST Mini‑Lab</h3>
        <ol style={{ marginTop: 6 }}>
          <li>Run a local ZAP/DAST scan against a test endpoint (never production without approval).</li>
          <li>Export the report as JSON.</li>
          <li>Paste the JSON below and press “Parse into OWASP checklist”.</li>
        </ol>
        <textarea id="zap-json" rows={6} placeholder="Paste ZAP/DAST JSON report..." style={{ width: '100%', marginTop: 8 }} />
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button onClick={()=>{
            try {
              const raw = document.getElementById('zap-json').value || '';
              const txt = raw.toLowerCase();
              const touch = (id, sev='medium') => setChecklist(prev => ({ ...prev, [id]: { ...(prev[id]||{}), status: 'issue', severity: sev } }));
              if (txt.includes('sql') || txt.includes('injection') || txt.includes('xss')) touch('A03','high');
              if (txt.includes('misconfig') || txt.includes('configuration')) touch('A05','medium');
              if (txt.includes('outdated') || txt.includes('vulnerable component')) touch('A06','high');
              if (txt.includes('authentication') || txt.includes('session')) touch('A07','high');
              if (txt.includes('integrity') || txt.includes('tamper')) touch('A08','high');
              if (txt.includes('ssrf')) touch('A10','critical');
              alert('Checklist updated from report.');
            } catch {
              alert('Could not parse report.');
            }
          }} style={btn}>🧪 Parse into OWASP checklist</button>
        </div>
      </div>
    </div>
  );
}

const th = { textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '0.85em' };
const td = { padding: '8px', borderBottom: '1px solid #f3f4f6' };
const btn = { background: '#f3f4f6', padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' };


