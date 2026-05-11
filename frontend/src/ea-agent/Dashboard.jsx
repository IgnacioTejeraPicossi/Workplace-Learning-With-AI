import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AttentionPage,
  AttentionHero,
  AttentionSectionHeader,
  StatCard,
  attentionCardStyle,
  attentionPanelStyle,
} from './sharedUi';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const Dashboard = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [deprecations, setDeprecations] = useState([]);
  const [recentInsights, setRecentInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, heatmapRes, depRes, insightsRes] = await Promise.allSettled([
          fetch(`${API}/api/ea-brain/stats`),
          fetch(`${API}/api/ea-brain/portfolio/heatmap`),
          fetch(`${API}/api/ea-brain/portfolio/deprecations`),
          fetch(`${API}/api/ea-brain/insights?limit=5`),
        ]);
        if (statsRes.status === 'fulfilled' && statsRes.value.ok) setStats(await statsRes.value.json());
        if (heatmapRes.status === 'fulfilled' && heatmapRes.value.ok) setHeatmap(await heatmapRes.value.json());
        if (depRes.status === 'fulfilled' && depRes.value.ok) setDeprecations(await depRes.value.json());
        if (insightsRes.status === 'fulfilled' && insightsRes.value.ok) setRecentInsights(await insightsRes.value.json());
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const urgencyStyle = (u) => {
    const map = {
      critical: { bg: '#fee2e2', border: '#fecaca', color: '#991b1b' },
      high: { bg: '#ffedd5', border: '#fed7aa', color: '#9a3412' },
      medium: { bg: '#fef9c3', border: '#fde047', color: '#854d0e' },
      low: { bg: '#dcfce7', border: '#bbf7d0', color: '#166534' },
      info: { bg: '#dbeafe', border: '#bfdbfe', color: '#1e40af' },
    };
    return map[u] || map.info;
  };

  const riskBg = (level) => {
    const colors = { critical: '#ef4444', high: '#fb923c', medium: '#facc15', low: '#4ade80' };
    return colors[level] || '#cbd5e1';
  };

  const statusIcon = (s) => ({ expired: '🔴', warning: '🟡', approaching: '🟢' }[s] || '⚪');

  if (loading) {
    return (
      <AttentionPage>
        <div
          style={{
            ...attentionCardStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '48px',
          }}
        >
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          <span style={{ color: '#64748b', fontSize: '15px' }}>{t('eaSecondBrainModule.loadingDashboard')}</span>
        </div>
      </AttentionPage>
    );
  }

  const statCards = [
    {
      label: t('eaSecondBrainModule.statPortfolio'),
      value: stats?.total_portfolio_items || 0,
      icon: '🏗️',
      onClick: () => onNavigate?.('portfolio'),
    },
    {
      label: t('eaSecondBrainModule.statInsights'),
      value: stats?.total_insights || 0,
      icon: '💡',
      onClick: () => onNavigate?.('insights'),
    },
    {
      label: t('eaSecondBrainModule.statPending'),
      value: stats?.pending_insights || 0,
      icon: '⏳',
      onClick: null,
    },
    {
      label: t('eaSecondBrainModule.statCritical'),
      value: stats?.critical_insights || 0,
      icon: '🚨',
      onClick: null,
    },
    {
      label: t('eaSecondBrainModule.statTechnologies'),
      value: stats?.technologies_tracked || 0,
      icon: '🔧',
      onClick: null,
    },
    {
      label: t('eaSecondBrainModule.statRuns'),
      value: stats?.total_runs || 0,
      icon: '▶️',
      onClick: () => onNavigate?.('runs'),
    },
  ];

  return (
    <AttentionPage>
      <AttentionHero
        icon="🧠"
        title={t('eaSecondBrainModule.dashboardHero')}
        description={t('eaSecondBrainModule.description')}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        {statCards.map((card, i) => (
          <div
            key={i}
            role={card.onClick ? 'button' : undefined}
            tabIndex={card.onClick ? 0 : undefined}
            onClick={card.onClick || undefined}
            onKeyDown={
              card.onClick
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      card.onClick();
                    }
                  }
                : undefined
            }
            style={{
              cursor: card.onClick ? 'pointer' : 'default',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            className={card.onClick ? 'ea-stat-card-hover' : undefined}
          >
            <StatCard label={card.label} value={card.value} icon={card.icon} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div style={attentionPanelStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>💡</span>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>{t('eaSecondBrainModule.todayInsights')}</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('insights')}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {t('eaSecondBrainModule.viewAll')} →
            </button>
          </div>
          <div style={{ padding: '16px 20px 20px', display: 'grid', gap: '12px' }}>
            {recentInsights.length === 0 ? (
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '16px' }}>
                {t('eaSecondBrainModule.noInsightsToday')}
              </p>
            ) : (
              recentInsights.map((ins, i) => {
                const us = urgencyStyle(ins.urgency);
                return (
                  <div
                    key={i}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: `1px solid ${us.border}`,
                      background: us.bg,
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: us.color }}>{ins.urgency}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.7)',
                          color: '#475569',
                        }}
                      >
                        {ins.category}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>{ins.topic}</p>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                      {t('eaSecondBrainModule.impactLabel')}: {(ins.impact_score?.total * 100 || 0).toFixed(0)}% • {ins.status}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={attentionPanelStyle}>
          <AttentionSectionHeader icon="⚠️" title={t('eaSecondBrainModule.deprecationRadar')} />
          <div style={{ padding: '16px 20px 20px', display: 'grid', gap: '12px' }}>
            {deprecations.length === 0 ? (
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '16px' }}>
                {t('eaSecondBrainModule.noDeprecations')}
              </p>
            ) : (
              deprecations.map((dep, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{statusIcon(dep.status)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                      {dep.technology} {dep.version && `v${dep.version}`}
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748b' }}>
                      EOL: {dep.eol_date} •{' '}
                      {dep.days_remaining < 0
                        ? t('eaSecondBrainModule.daysOverdue', { count: Math.abs(dep.days_remaining) })
                        : t('eaSecondBrainModule.daysRemaining', { count: dep.days_remaining })}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: '#e2e8f0',
                      color: '#334155',
                      flexShrink: 0,
                    }}
                  >
                    {dep.affected_count} {t('eaSecondBrainModule.apps')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={attentionPanelStyle}>
        <AttentionSectionHeader icon="🔥" title={t('eaSecondBrainModule.technologyHeatmap')} />
        <p style={{ margin: 0, padding: '0 24px', fontSize: '14px', color: '#64748b' }}>{t('eaSecondBrainModule.heatmapSubtitle')}</p>
        <div style={{ padding: '20px 24px 24px' }}>
          {heatmap.length === 0 ? (
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>{t('eaSecondBrainModule.noTechData')}</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {heatmap.map((tech, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border:
                        tech.risk_level === 'critical'
                          ? '2px solid #f87171'
                          : tech.risk_level === 'high'
                            ? '2px solid #fb923c'
                            : tech.risk_level === 'medium'
                              ? '2px solid #facc15'
                              : '2px solid #e2e8f0',
                      background:
                        tech.risk_level === 'critical'
                          ? '#fef2f2'
                          : tech.risk_level === 'high'
                            ? '#fff7ed'
                            : tech.risk_level === 'medium'
                              ? '#fefce8'
                              : '#ffffff',
                      color:
                        tech.risk_level === 'critical'
                          ? '#991b1b'
                          : tech.risk_level === 'high'
                            ? '#9a3412'
                            : tech.risk_level === 'medium'
                              ? '#854d0e'
                              : '#334155',
                    }}
                  >
                    <span>{tech.name}</span>
                    {tech.version !== 'unknown' && <span style={{ opacity: 0.65, marginLeft: '6px' }}>v{tech.version}</span>}
                    <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.55 }}>×{tech.count}</span>
                    <span
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        width: 10,
                        height: 10,
                        borderRadius: '999px',
                        background: riskBg(tech.risk_level),
                      }}
                      title={tech.risk_level}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats?.portfolio_by_lifecycle && (
        <div style={attentionPanelStyle}>
          <AttentionSectionHeader icon="📦" title={t('eaSecondBrainModule.portfolioDistribution')} />
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
              {Object.entries(stats.portfolio_by_lifecycle).map(([status, count]) => {
                const palette = {
                  production: { bg: '#dcfce7', border: '#86efac', color: '#166534' },
                  sunset: { bg: '#ffedd5', border: '#fdba74', color: '#9a3412' },
                  pilot: { bg: '#dbeafe', border: '#93c5fd', color: '#1e40af' },
                  planned: { bg: '#f3e8ff', border: '#d8b4fe', color: '#6b21a8' },
                  decommissioned: { bg: '#f1f5f9', border: '#cbd5e1', color: '#475569' },
                };
                const pal = palette[status] || { bg: '#f8fafc', border: '#e2e8f0', color: '#334155' };
                return (
                  <div
                    key={status}
                    style={{
                      padding: '20px 16px',
                      borderRadius: '12px',
                      border: `1px solid ${pal.border}`,
                      background: pal.bg,
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: pal.color }}>{count}</p>
                    <p style={{ margin: '8px 0 0', fontSize: '13px', fontWeight: 600, color: pal.color, textTransform: 'capitalize' }}>{status}</p>
                  </div>
                );
              })}
            </div>
            {stats.avg_criticality > 0 && (
              <p style={{ margin: '20px 0 0', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                {t('eaSecondBrainModule.avgCriticality')}: <strong>{stats.avg_criticality.toFixed(1)}/5</strong>
              </p>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: t('eaSecondBrainModule.qaBrowsePortfolio'), icon: '🏗️', tab: 'portfolio' },
          { label: t('eaSecondBrainModule.qaReviewInsights'), icon: '💡', tab: 'insights' },
          { label: t('eaSecondBrainModule.qaAskQuestion'), icon: '🔍', tab: 'ask' },
          { label: t('eaSecondBrainModule.qaManageWatchlist'), icon: '👁️', tab: 'settings' },
        ].map((qa, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onNavigate?.(qa.tab)}
            style={{
              ...attentionCardStyle,
              textAlign: 'left',
              cursor: 'pointer',
              border: '1px solid #e2e8f0',
              transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
            }}
            className="ea-quick-action-hover"
          >
            <span style={{ fontSize: '28px' }}>{qa.icon}</span>
            <p style={{ margin: '12px 0 0', fontSize: '14px', fontWeight: 600, color: '#334155' }}>{qa.label}</p>
          </button>
        ))}
      </div>

      <style>{`
        .ea-stat-card-hover:hover { transform: translateY(-2px); }
        .ea-stat-card-hover:hover > div { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) !important; }
        .ea-quick-action-hover:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08) !important; border-color: #93c5fd !important; }
      `}</style>
    </AttentionPage>
  );
};

export default Dashboard;
