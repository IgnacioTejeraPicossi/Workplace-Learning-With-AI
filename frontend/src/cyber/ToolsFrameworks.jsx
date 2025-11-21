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
  const [checklist, setChecklist] = useState({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setChecklist(saved.items || {});
      setNotes(saved.notes || '');
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

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>🧰 Tools & Frameworks</h2>
        <p style={{ color: '#6b7280', marginTop: 6 }}>
          Quick utilities for OWASP Top 10 checks and MITRE ATT&CK mapping. Use this as a lightweight companion to PenTesting/Red Team activities.
        </p>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const th = { textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '0.85em' };
const td = { padding: '8px', borderBottom: '1px solid #f3f4f6' };


