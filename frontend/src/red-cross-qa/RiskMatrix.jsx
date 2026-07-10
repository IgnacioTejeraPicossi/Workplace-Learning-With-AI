import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';
import AiUsagePolicy from './_AiUsagePolicy';

const API = `${process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/red-cross-qa`;

/**
 * Risikomatrise-input — Trine §10:
 * Risikomatrisen ligger utenfor strategi-dokumentet, men teststrategien
 * skal kunne konsumere den. Lim inn CSV/JSON, agenten scorer hver risiko
 * (sannsynlighet × konsekvens) og foreslår test-suite-prioritet.
 */
const SAMPLE_CSV = `id,description,probability,impact,area
R-100,Fundy Vipps handoff feiler,4,5,donation
R-101,Helse-data lekkasje,2,5,personvern
R-102,Lasttest under TV-aksjonen,5,4,ytelse
R-103,Politiattest skjema feiler,3,4,frivillig`;

const LEVEL_COLOR = {
  critical: { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' },
  high:     { bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
  medium:   { bg: '#dbeafe', fg: '#1d4ed8', border: '#93c5fd' },
  low:      { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
};

const RiskMatrix = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [csvText, setCsvText] = useState('');
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);

  const handleRun = async () => {
    setRunning(true);
    setReport(null);
    try {
      const res = await fetch(`${API}/analyze-risk-matrix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matrix_csv: csvText.trim() || null,
          matrix_json: null,
          environment,
          lang: i18n.language,
        }),
      });
      setReport(await res.json());
    } catch {
      setReport({ status: 'error', message: 'Network error' });
    } finally {
      setRunning(false);
    }
  };

  const counts = report?.level_counts || {};

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="🎲"
          title={t('redCrossWebQaModule.riskMatrix.header')}
          subtitle={t('redCrossWebQaModule.riskMatrix.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #b45309 100%)"
        />

        <AiUsagePolicy variant="compact" />

        <div style={panel}>
          <h3 style={panelTitle}>📥 {t('redCrossWebQaModule.riskMatrix.input')}</h3>
          <p style={hint}>{t('redCrossWebQaModule.riskMatrix.inputHint')}</p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={SAMPLE_CSV}
            rows={8}
            style={{
              width: '100%', padding: 12, borderRadius: 8,
              border: '1px solid #e2e8f0', fontFamily: 'ui-monospace, monospace',
              fontSize: 12, resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={handleRun} disabled={running} style={primaryBtn(running)}>
              {running ? t('redCrossWebQaModule.common.running')
                       : t('redCrossWebQaModule.riskMatrix.btnAnalyze')}
            </button>
            <button onClick={() => setCsvText(SAMPLE_CSV)} style={ghostBtn}>
              {t('redCrossWebQaModule.riskMatrix.btnLoadSample')}
            </button>
            <button onClick={() => { setCsvText(''); setReport(null); }} style={ghostBtn}>
              {t('redCrossWebQaModule.riskMatrix.btnClear')}
            </button>
          </div>
        </div>

        {report?.status === 'ok' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <StatCard label={t('redCrossWebQaModule.riskMatrix.totalRisks')} value={report.risk_count ?? 0} color="#1e293b" />
              <StatCard label={t('redCrossWebQaModule.riskMatrix.critical')}  value={counts.critical || 0} color="#b91c1c" />
              <StatCard label={t('redCrossWebQaModule.riskMatrix.high')}      value={counts.high || 0}     color="#dc2626" />
              <StatCard label={t('redCrossWebQaModule.riskMatrix.medium')}    value={counts.medium || 0}   color="#f59e0b" />
              <StatCard label={t('redCrossWebQaModule.riskMatrix.low')}       value={counts.low || 0}      color="#10b981" />
            </div>

            {Array.isArray(report.suite_priority) && report.suite_priority.length > 0 && (
              <div style={panel}>
                <h3 style={panelTitle}>🎯 {t('redCrossWebQaModule.riskMatrix.suitePriority')}</h3>
                <p style={hint}>{t('redCrossWebQaModule.riskMatrix.suitePriorityHint')}</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                      <th style={th}>{t('redCrossWebQaModule.riskMatrix.priority')}</th>
                      <th style={th}>{t('redCrossWebQaModule.riskMatrix.suite')}</th>
                      <th style={th}>{t('redCrossWebQaModule.riskMatrix.maxScore')}</th>
                      <th style={th}>{t('redCrossWebQaModule.riskMatrix.riskCount')}</th>
                      <th style={th}>{t('redCrossWebQaModule.riskMatrix.areas')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.suite_priority.map((sp, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={td}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                            backgroundColor: i === 0 ? '#fee2e2' : '#f1f5f9',
                            color: i === 0 ? '#b91c1c' : '#475569',
                          }}>#{sp.priority}</span>
                        </td>
                        <td style={td}><strong>{sp.suite}</strong></td>
                        <td style={td}>{sp.max_score}</td>
                        <td style={td}>{sp.risk_count}</td>
                        <td style={td}>
                          {Array.isArray(sp.areas) && sp.areas.map((a, j) => (
                            <span key={j} style={areaPill}>{a}</span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {Array.isArray(report.risks) && report.risks.length > 0 && (
              <div style={panel}>
                <h3 style={panelTitle}>📋 {t('redCrossWebQaModule.riskMatrix.risks')} ({report.risks.length})</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                      <th style={th}>ID</th>
                      <th style={th}>{t('redCrossWebQaModule.riskMatrix.description')}</th>
                      <th style={th}>P</th>
                      <th style={th}>I</th>
                      <th style={th}>{t('redCrossWebQaModule.riskMatrix.score')}</th>
                      <th style={th}>{t('redCrossWebQaModule.riskMatrix.level')}</th>
                      <th style={th}>{t('redCrossWebQaModule.riskMatrix.suite')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.risks.map((r, i) => {
                      const c = LEVEL_COLOR[(r.level || 'low').toLowerCase()] || LEVEL_COLOR.low;
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={td}><code style={{ fontSize: 11 }}>{r.id}</code></td>
                          <td style={td}>{r.description}</td>
                          <td style={tdNum}>{r.probability}</td>
                          <td style={tdNum}>{r.impact}</td>
                          <td style={{ ...tdNum, fontWeight: 700 }}>{r.score}</td>
                          <td style={td}>
                            <span style={{
                              padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                              backgroundColor: c.bg, color: c.fg, border: `1px solid ${c.border}`,
                              textTransform: 'uppercase',
                            }}>{r.level}</span>
                          </td>
                          <td style={td}><span style={areaPill}>{r.suite}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {Array.isArray(report.coverage_gaps) && report.coverage_gaps.length > 0 && (
              <div style={panel}>
                <h3 style={panelTitle}>⚠️ {t('redCrossWebQaModule.riskMatrix.coverageGaps')}</h3>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#475569' }}>
                  {report.coverage_gaps.map((g, i) => <li key={i} style={{ marginBottom: 4 }}>{g}</li>)}
                </ul>
              </div>
            )}

            {report.summary_narrative && (
              <div style={panel}>
                <h3 style={panelTitle}>📝 {t('redCrossWebQaModule.riskMatrix.summary')}</h3>
                <div style={{
                  padding: 16, borderRadius: 10,
                  backgroundColor: '#fff7ed', border: '1px solid #fed7aa',
                  fontSize: 13, lineHeight: 1.6, color: '#7c2d12',
                  whiteSpace: 'pre-wrap',
                }}>
                  {report.summary_narrative}
                </div>
              </div>
            )}
          </>
        )}

        {report?.status === 'error' && <div style={errorBox}>{report.message}</div>}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div style={{
    backgroundColor: 'white', borderRadius: 12, padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
  }}>
    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color, marginTop: 4, lineHeight: 1 }}>{value}</div>
  </div>
);

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const hint = { fontSize: 12, color: '#64748b', margin: '0 0 10px' };
const primaryBtn = (disabled) => ({
  padding: '10px 18px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#fdba74' : '#9a3412', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const ghostBtn = {
  padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc', color: '#475569', fontWeight: 500, fontSize: 13, cursor: 'pointer',
};
const th = { padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase' };
const td = { padding: '8px 12px', color: '#334155' };
const tdNum = { padding: '8px 12px', color: '#334155', textAlign: 'center', fontVariantNumeric: 'tabular-nums' };
const areaPill = {
  display: 'inline-block', padding: '2px 8px', borderRadius: 999,
  fontSize: 10, fontWeight: 600, marginRight: 4,
  backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
  textTransform: 'uppercase',
};
const errorBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
  borderRadius: 8, padding: 14, fontSize: 13,
};

export default RiskMatrix;
