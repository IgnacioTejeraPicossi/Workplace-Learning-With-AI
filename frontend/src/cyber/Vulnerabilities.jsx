// Vulnerability Management Component
// Searchable vulnerability table with scan controls, summary cards, and detail modal
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export default function Vulnerabilities() {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [selectedVuln, setSelectedVuln] = useState(null);
  // Filters
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterFixed, setFilterFixed] = useState('all'); // all | open | fixed
  const [searchText, setSearchText] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vulnsRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/api/cyber/vulnerabilities`),
        fetch(`${API_BASE}/api/cyber/vulnerabilities/summary`),
      ]);
      if (vulnsRes.ok) setVulnerabilities(await vulnsRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } catch (err) {
      console.error('Error loading vulnerability data:', err);
    } finally {
      setLoading(false);
    }
  };

  const runScan = async (scanTypes) => {
    try {
      setScanning(true);
      setScanResults(null);
      const res = await fetch(`${API_BASE}/api/cyber/vulnerabilities/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'default', scan_types: scanTypes }),
      });
      if (res.ok) {
        const results = await res.json();
        setScanResults(results);
        // Reload data after scan
        await loadData();
      }
    } catch (err) {
      console.error('Error running scan:', err);
    } finally {
      setScanning(false);
    }
  };

  const getSeverityColor = (sev) => {
    const s = (sev || '').toUpperCase();
    if (s === 'CRITICAL') return '#dc2626';
    if (s === 'HIGH') return '#ea580c';
    if (s === 'MEDIUM') return '#d97706';
    if (s === 'LOW') return '#16a34a';
    return '#6b7280';
  };

  const getSeverityBg = (sev) => getSeverityColor(sev) + '15';

  // Apply filters
  const filtered = vulnerabilities.filter(v => {
    const sev = (v.severity?.value || v.severity || '').toUpperCase();
    if (filterSeverity && sev !== filterSeverity) return false;
    if (filterSource && v.source !== filterSource) return false;
    if (filterFixed === 'open' && v.fixed) return false;
    if (filterFixed === 'fixed' && !v.fixed) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      const haystack = `${v.title} ${v.package || ''} ${v.description || ''} ${v.cve || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  // Unique sources for filter
  const sources = [...new Set(vulnerabilities.map(v => v.source))].filter(Boolean);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.5rem' }}>{t('cyber.vulnerabilities.loading')}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            {t('cyber.vulnerabilities.title')}
          </h2>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0' }}>
            {t('cyber.vulnerabilities.subtitle')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <SummaryCard label={t('cyber.vulnerabilities.total')} value={summary.total} color="#3b82f6" />
          <SummaryCard label={t('cyber.vulnerabilities.open')} value={summary.open} color="#ef4444" />
          <SummaryCard label={t('cyber.vulnerabilities.fixed')} value={summary.fixed} color="#10b981" />
          <SummaryCard label="Critical" value={summary.by_severity?.CRITICAL || 0} color="#dc2626" />
          <SummaryCard label="High" value={summary.by_severity?.HIGH || 0} color="#ea580c" />
          <SummaryCard label="Medium" value={summary.by_severity?.MEDIUM || 0} color="#d97706" />
        </div>
      )}

      {/* Scan Controls */}
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            Run Vulnerability Scans
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <ScanButton label="All Scans" scanning={scanning} onClick={() => runScan(['npm', 'pip', 'secrets'])} primary />
            <ScanButton label="npm audit" scanning={scanning} onClick={() => runScan(['npm'])} />
            <ScanButton label="pip-audit" scanning={scanning} onClick={() => runScan(['pip'])} />
            <ScanButton label="Secrets" scanning={scanning} onClick={() => runScan(['secrets'])} />
          </div>
        </div>

        {/* Scan Results */}
        {scanResults && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {Object.entries(scanResults).map(([key, r]) => (
              <div key={key} style={{
                padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem',
                backgroundColor: r.success ? (r.vulnerabilities_found > 0 ? '#fef3c7' : '#dcfce7') : '#fee2e2',
                color: r.success ? (r.vulnerabilities_found > 0 ? '#92400e' : '#166534') : '#991b1b',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <span style={{ fontWeight: '600' }}>{r.scan_type}:</span>
                <span>{r.vulnerabilities_found} found</span>
                <span style={{ color: '#9ca3af' }}>({r.execution_time}s)</span>
                {r.error_message && <span title={r.error_message} style={{ cursor: 'help' }}>*</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1rem',
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search by title, package, CVE..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            flex: '1 1 200px', padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
            border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none',
          }}
        />
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
        >
          <option value="">All Sources</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterFixed}
          onChange={(e) => setFilterFixed(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="fixed">Fixed</option>
        </select>
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
          {filtered.length} of {vulnerabilities.length}
        </span>
      </div>

      {/* Vulnerability Table */}
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden'
      }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {vulnerabilities.length === 0 ? '!' : '!'}
            </div>
            <p style={{ fontSize: '1rem' }}>
              {vulnerabilities.length === 0 ? 'No vulnerabilities found. Run a scan to check.' : 'No vulnerabilities match the current filters.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={thStyle}>Severity</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Package</th>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>Risk</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vuln) => {
                  const sev = (vuln.severity?.value || vuln.severity || '').toUpperCase();
                  return (
                    <tr key={vuln.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                        onClick={() => setSelectedVuln(vuln)}>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem',
                          fontWeight: '600', backgroundColor: getSeverityBg(sev), color: getSeverityColor(sev),
                        }}>
                          {sev}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>{vuln.title}</div>
                        {vuln.cve && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{vuln.cve}</div>}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '0.875rem', color: '#374151' }}>
                        {vuln.package ? `${vuln.package}${vuln.version ? `@${vuln.version}` : ''}` : '\u2014'}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#6b7280' }}>{vuln.source}</td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '600', color: getSeverityColor(sev) }}>
                          {vuln.risk_score != null ? vuln.risk_score.toFixed(1) : '\u2014'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '500',
                          backgroundColor: vuln.fixed ? '#dcfce7' : '#fee2e2',
                          color: vuln.fixed ? '#166534' : '#991b1b',
                        }}>
                          {vuln.fixed ? 'Fixed' : 'Open'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedVuln(vuln); }}
                          style={{
                            padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db',
                            backgroundColor: 'white', fontSize: '0.75rem', cursor: 'pointer',
                          }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedVuln && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => setSelectedVuln(null)}
        >
          <div
            style={{
              backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem',
              maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  {selectedVuln.title}
                </h3>
                {selectedVuln.cve && (
                  <a
                    href={`https://nvd.nist.gov/vuln/detail/${selectedVuln.cve}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none' }}
                  >
                    {selectedVuln.cve}
                  </a>
                )}
              </div>
              <button
                onClick={() => setSelectedVuln(null)}
                style={{ border: 'none', background: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6b7280' }}
              >
                X
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <DetailField label="Severity" value={
                <span style={{
                  padding: '0.25rem 0.5rem', borderRadius: '0.25rem',
                  backgroundColor: getSeverityBg(selectedVuln.severity), color: getSeverityColor(selectedVuln.severity),
                  fontWeight: '600', fontSize: '0.875rem',
                }}>
                  {(selectedVuln.severity?.value || selectedVuln.severity || '').toUpperCase()}
                </span>
              } />
              <DetailField label="Risk Score" value={selectedVuln.risk_score != null ? selectedVuln.risk_score.toFixed(1) + ' / 10' : 'N/A'} />
              <DetailField label="Source" value={selectedVuln.source} />
              <DetailField label="Status" value={selectedVuln.fixed ? 'Fixed' : 'Open'} />
              <DetailField label="Package" value={selectedVuln.package ? `${selectedVuln.package}@${selectedVuln.version || '?'}` : 'N/A'} />
              <DetailField label="Project" value={selectedVuln.project || 'default'} />
            </div>

            {selectedVuln.description && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Description</div>
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: '1.5' }}>{selectedVuln.description}</p>
              </div>
            )}

            {selectedVuln.recommendation && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #d1fae5',
                backgroundColor: '#f0fdf4',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#166534', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Recommendation</div>
                <p style={{ fontSize: '0.875rem', color: '#166534', margin: 0 }}>{selectedVuln.recommendation}</p>
              </div>
            )}

            {selectedVuln.file && (
              <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                File: <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>{selectedVuln.file}{selectedVuln.line ? `:${selectedVuln.line}` : ''}</code>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components
function SummaryCard({ label, value, color }) {
  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>{label}</div>
    </div>
  );
}

function ScanButton({ label, scanning, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      disabled={scanning}
      style={{
        padding: '0.5rem 1rem', borderRadius: '0.375rem', border: primary ? 'none' : '1px solid #d1d5db',
        backgroundColor: scanning ? '#9ca3af' : primary ? '#3b82f6' : 'white',
        color: scanning ? 'white' : primary ? 'white' : '#374151',
        cursor: scanning ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: '500',
      }}
    >
      {scanning ? 'Scanning...' : label}
    </button>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>{typeof value === 'string' ? value : value}</div>
    </div>
  );
}

// Shared styles
const thStyle = { textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151', fontSize: '0.8rem' };
const tdStyle = { padding: '0.75rem' };
