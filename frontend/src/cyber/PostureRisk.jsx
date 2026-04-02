// Posture & Risk Assessment Component
// Visualizes NIST CSF domain scores, risk factors, and KPI trends
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export default function PostureRisk() {
  const { t } = useTranslation();
  const [riskScore, setRiskScore] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [nistDomains, setNistDomains] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [riskRes, kpisRes, nistRes] = await Promise.all([
        fetch(`${API_BASE}/api/cyber/risk/score`),
        fetch(`${API_BASE}/api/cyber/posture/kpis`),
        fetch(`${API_BASE}/api/cyber/posture/nist-domains`),
      ]);
      if (riskRes.ok) setRiskScore(await riskRes.json());
      if (kpisRes.ok) setKpis(await kpisRes.json());
      if (nistRes.ok) setNistDomains(await nistRes.json());
    } catch (err) {
      console.error('Error loading posture data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getRiskLabel = (score) => {
    if (score >= 80) return { text: t('cyber.postureRisk.lowRisk'), bg: '#dcfce7', color: '#166534' };
    if (score >= 60) return { text: t('cyber.postureRisk.moderateRisk'), bg: '#fef3c7', color: '#92400e' };
    if (score >= 40) return { text: t('cyber.postureRisk.highRisk'), bg: '#fed7aa', color: '#9a3412' };
    return { text: t('cyber.postureRisk.criticalRisk'), bg: '#fee2e2', color: '#991b1b' };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.5rem' }}>{t('cyber.postureRisk.loading')}</div>
      </div>
    );
  }

  const riskLabel = riskScore ? getRiskLabel(riskScore.overall) : null;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          {t('cyber.postureRisk.title')}
        </h2>
        <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0' }}>
          {t('cyber.postureRisk.subtitle')}
        </p>
      </div>

      {/* Top row: Risk Score gauge + Risk Level */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Risk Score Gauge */}
        <div style={{
          backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('cyber.postureRisk.overallScore')}
          </h3>
          {riskScore && (
            <>
              <div style={{
                width: '140px', height: '140px', borderRadius: '50%', margin: '0 auto 1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `conic-gradient(${getScoreColor(riskScore.overall)} ${riskScore.overall * 3.6}deg, #e5e7eb ${riskScore.overall * 3.6}deg)`,
              }}>
                <div style={{
                  width: '110px', height: '110px', borderRadius: '50%', backgroundColor: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
                }}>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: getScoreColor(riskScore.overall) }}>
                    {Math.round(riskScore.overall)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{t('cyber.postureRisk.outOf100')}</span>
                </div>
              </div>
              <span style={{
                display: 'inline-block', padding: '0.375rem 0.75rem', borderRadius: '1rem',
                fontSize: '0.875rem', fontWeight: '600',
                backgroundColor: riskLabel.bg, color: riskLabel.color,
              }}>
                {riskLabel.text}
              </span>
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{
                  padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem',
                  backgroundColor: riskScore.trend === 'improving' ? '#dcfce7' : riskScore.trend === 'degrading' ? '#fee2e2' : '#f3f4f6',
                  color: riskScore.trend === 'improving' ? '#166534' : riskScore.trend === 'degrading' ? '#991b1b' : '#374151',
                }}>
                  {riskScore.trend === 'improving' ? t('cyber.postureRisk.improving') : riskScore.trend === 'degrading' ? t('cyber.postureRisk.degrading') : t('cyber.postureRisk.stable')}
                </span>
              </div>
            </>
          )}
        </div>

        {/* NIST CSF Domain Scores */}
        <div style={{
          backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('cyber.postureRisk.nistDomainScores')}
          </h3>
          {nistDomains && (
            <div>
              {Object.entries(nistDomains.domains).map(([domain, score]) => {
                const icons = { Govern: 'GV', Identify: 'ID', Protect: 'PR', Detect: 'DE', Respond: 'RS', Recover: 'RC' };
                return (
                  <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '36px', height: '36px', borderRadius: '0.375rem',
                      backgroundColor: getScoreColor(score) + '20', color: getScoreColor(score),
                      fontSize: '0.75rem', fontWeight: '700', flexShrink: 0,
                    }}>
                      {icons[domain] || domain.slice(0, 2).toUpperCase()}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>{domain}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: getScoreColor(score) }}>{score}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${score}%`, backgroundColor: getScoreColor(score),
                          borderRadius: '4px', transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{t('cyber.postureRisk.overallPosture')} </span>
                <span style={{ fontSize: '1rem', fontWeight: '700', color: getScoreColor(nistDomains.overall) }}>
                  {nistDomains.overall}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards with target progress */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
          Security KPIs
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {kpis.map((kpi, i) => {
            const hasTarget = kpi.target != null;
            const isLowerBetter = kpi.kpi.includes('latency') || kpi.kpi.includes('vuln');
            const progress = hasTarget
              ? isLowerBetter
                ? Math.max(0, Math.min(100, ((kpi.target > 0 ? kpi.target : 1) / Math.max(kpi.value, 0.01)) * 100))
                : Math.max(0, Math.min(100, (kpi.value / kpi.target) * 100))
              : 0;
            const onTrack = hasTarget
              ? isLowerBetter ? kpi.value <= kpi.target : kpi.value >= kpi.target
              : true;
            return (
              <div key={i} style={{
                backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${onTrack ? '#10b981' : '#f59e0b'}`,
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  {kpi.kpi.replace(/_/g, ' ')}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937' }}>{kpi.value}</span>
                  {kpi.meta?.unit && <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{kpi.meta.unit}</span>}
                </div>
                {hasTarget && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.375rem' }}>
                      <span>Target: {kpi.target} {kpi.meta?.unit || ''}</span>
                      <span style={{ color: onTrack ? '#10b981' : '#f59e0b', fontWeight: '600' }}>
                        {onTrack ? 'On track' : 'Needs attention'}
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${Math.min(progress, 100)}%`,
                        backgroundColor: onTrack ? '#10b981' : '#f59e0b',
                        borderRadius: '3px', transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </>
                )}
                {kpi.meta?.description && (
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>{kpi.meta.description}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Factors Breakdown */}
      {riskScore && Object.keys(riskScore.factors).length > 0 && (
        <div style={{
          backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
            Risk Factor Analysis
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Factor</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Value</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Impact</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(riskScore.factors).map(([factor, value]) => {
                const isHighImpact = (factor.includes('vuln') && value > 0) || (factor.includes('latency') && value > 5);
                const impactLabel = factor.includes('coverage')
                  ? (value >= 80 ? 'Positive' : 'Needs improvement')
                  : (value <= 2 ? 'Low' : value <= 5 ? 'Medium' : 'High');
                const impactColor = factor.includes('coverage')
                  ? (value >= 80 ? '#10b981' : '#f59e0b')
                  : (value <= 2 ? '#10b981' : value <= 5 ? '#f59e0b' : '#ef4444');
                return (
                  <tr key={factor} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                      {factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#1f2937', fontWeight: '600' }}>
                      {value}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem',
                        fontWeight: '500', backgroundColor: impactColor + '20', color: impactColor,
                      }}>
                        {impactLabel}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '1rem' }}>
                      {isHighImpact ? '!' : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* NIST CSF 2.0 Framework Reference */}
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
          NIST CSF 2.0 Framework
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
          {[
            { code: 'GV', name: 'Govern', desc: 'Establish cybersecurity risk management strategy', color: '#6366f1' },
            { code: 'ID', name: 'Identify', desc: 'Understand assets, risks, and capabilities', color: '#3b82f6' },
            { code: 'PR', name: 'Protect', desc: 'Implement safeguards for critical services', color: '#10b981' },
            { code: 'DE', name: 'Detect', desc: 'Identify cybersecurity events timely', color: '#f59e0b' },
            { code: 'RS', name: 'Respond', desc: 'Take action on detected incidents', color: '#f97316' },
            { code: 'RC', name: 'Recover', desc: 'Restore capabilities after incidents', color: '#ef4444' },
          ].map(d => (
            <div key={d.code} style={{
              padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${d.color}30`,
              backgroundColor: `${d.color}08`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '28px', height: '28px', borderRadius: '0.25rem',
                  backgroundColor: d.color, color: 'white', fontSize: '0.7rem', fontWeight: '700',
                }}>{d.code}</span>
                <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>{d.name}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{d.desc}</p>
              {nistDomains && nistDomains.domains[d.name] != null && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: getScoreColor(nistDomains.domains[d.name]) }}>
                  {nistDomains.domains[d.name]}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
