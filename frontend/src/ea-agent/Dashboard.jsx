import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
        if (statsRes.status === 'fulfilled' && statsRes.value.ok)
          setStats(await statsRes.value.json());
        if (heatmapRes.status === 'fulfilled' && heatmapRes.value.ok)
          setHeatmap(await heatmapRes.value.json());
        if (depRes.status === 'fulfilled' && depRes.value.ok)
          setDeprecations(await depRes.value.json());
        if (insightsRes.status === 'fulfilled' && insightsRes.value.ok)
          setRecentInsights(await insightsRes.value.json());
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const urgencyColor = (u) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[u] || colors.info;
  };

  const riskBg = (level) => {
    const colors = { critical: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-yellow-400', low: 'bg-green-400' };
    return colors[level] || 'bg-gray-300';
  };

  const statusIcon = (s) => {
    return { expired: '🔴', warning: '🟡', approaching: '🟢' }[s] || '⚪';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600">{t('eaSecondBrainModule.loadingDashboard')}</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{t('eaSecondBrainModule.dashboardHero')}</h2>
        <p className="text-blue-100">{t('eaSecondBrainModule.description')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: t('eaSecondBrainModule.statPortfolio'), value: stats?.total_portfolio_items || 0, icon: '🏗️', color: 'blue', onClick: () => onNavigate?.('portfolio') },
          { label: t('eaSecondBrainModule.statInsights'), value: stats?.total_insights || 0, icon: '💡', color: 'purple', onClick: () => onNavigate?.('insights') },
          { label: t('eaSecondBrainModule.statPending'), value: stats?.pending_insights || 0, icon: '⏳', color: 'yellow' },
          { label: t('eaSecondBrainModule.statCritical'), value: stats?.critical_insights || 0, icon: '🚨', color: 'red' },
          { label: t('eaSecondBrainModule.statTechnologies'), value: stats?.technologies_tracked || 0, icon: '🔧', color: 'green' },
          { label: t('eaSecondBrainModule.statRuns'), value: stats?.total_runs || 0, icon: '▶️', color: 'indigo', onClick: () => onNavigate?.('runs') },
        ].map((card, i) => (
          <div
            key={i}
            onClick={card.onClick}
            className={`bg-white rounded-xl shadow-sm border p-4 ${card.onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300 transition-all' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-3xl font-bold text-${card.color}-600`}>{card.value}</span>
            </div>
            <p className="text-xs text-gray-500 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Two-column: Today's Insights + Deprecation Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Insights */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              💡 {t('eaSecondBrainModule.todayInsights')}
            </h3>
            <button
              onClick={() => onNavigate?.('insights')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {t('eaSecondBrainModule.viewAll')} →
            </button>
          </div>
          <div className="p-4 space-y-3">
            {recentInsights.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">{t('eaSecondBrainModule.noInsightsToday')}</p>
            ) : (
              recentInsights.map((ins, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${urgencyColor(ins.urgency)}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase">
                        {ins.urgency}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        {ins.category}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{ins.topic}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{t('eaSecondBrainModule.impactLabel')}: {(ins.impact_score?.total * 100 || 0).toFixed(0)}%</span>
                      <span>•</span>
                      <span>{ins.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deprecation Radar */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              ⚠️ {t('eaSecondBrainModule.deprecationRadar')}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {deprecations.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">{t('eaSecondBrainModule.noDeprecations')}</p>
            ) : (
              deprecations.map((dep, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                  <span className="text-xl">{statusIcon(dep.status)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {dep.technology} {dep.version && `v${dep.version}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      EOL: {dep.eol_date} •{' '}
                      {dep.days_remaining < 0
                        ? t('eaSecondBrainModule.daysOverdue', { count: Math.abs(dep.days_remaining) })
                        : t('eaSecondBrainModule.daysRemaining', { count: dep.days_remaining })}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-bold bg-gray-200 text-gray-700">
                    {dep.affected_count} {t('eaSecondBrainModule.apps')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Technology Heatmap */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            🔥 {t('eaSecondBrainModule.technologyHeatmap')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{t('eaSecondBrainModule.heatmapSubtitle')}</p>
        </div>
        <div className="p-4">
          {heatmap.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">{t('eaSecondBrainModule.noTechData')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {heatmap.map((tech, i) => (
                <div
                  key={i}
                  className="relative group"
                >
                  <div className={`px-3 py-2 rounded-lg border-2 text-sm font-medium cursor-default
                    ${tech.risk_level === 'critical' ? 'border-red-400 bg-red-50 text-red-800' :
                      tech.risk_level === 'high' ? 'border-orange-400 bg-orange-50 text-orange-800' :
                      tech.risk_level === 'medium' ? 'border-yellow-400 bg-yellow-50 text-yellow-800' :
                      'border-gray-200 bg-white text-gray-700'}`}
                  >
                    <span>{tech.name}</span>
                    {tech.version !== 'unknown' && <span className="text-xs ml-1 opacity-60">v{tech.version}</span>}
                    <span className="ml-2 text-xs opacity-50">×{tech.count}</span>
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${riskBg(tech.risk_level)}`} title={tech.risk_level}></div>
                  </div>
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute z-10 bottom-full left-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg w-48">
                    <p className="font-bold mb-1">{tech.name} {tech.version !== 'unknown' ? `v${tech.version}` : ''}</p>
                    <p>{t('eaSecondBrainModule.usedBy')}: {tech.apps?.join(', ')}</p>
                    {tech.eol_date && <p className="mt-1 text-yellow-300">EOL: {tech.eol_date}</p>}
                    <p className="mt-1">{t('eaSecondBrainModule.riskLevel')}: {tech.risk_level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Lifecycle Distribution */}
      {stats?.portfolio_by_lifecycle && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              📦 {t('eaSecondBrainModule.portfolioDistribution')}
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats.portfolio_by_lifecycle).map(([status, count]) => {
                const colors = {
                  production: 'bg-green-100 text-green-800 border-green-300',
                  sunset: 'bg-orange-100 text-orange-800 border-orange-300',
                  pilot: 'bg-blue-100 text-blue-800 border-blue-300',
                  planned: 'bg-purple-100 text-purple-800 border-purple-300',
                  decommissioned: 'bg-gray-100 text-gray-800 border-gray-300',
                };
                return (
                  <div key={status} className={`p-4 rounded-lg border text-center ${colors[status] || 'bg-gray-50'}`}>
                    <p className="text-3xl font-bold">{count}</p>
                    <p className="text-sm font-medium capitalize mt-1">{status}</p>
                  </div>
                );
              })}
            </div>
            {stats.avg_criticality > 0 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                {t('eaSecondBrainModule.avgCriticality')}: <strong>{stats.avg_criticality.toFixed(1)}/5</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('eaSecondBrainModule.qaBrowsePortfolio'), icon: '🏗️', tab: 'portfolio' },
          { label: t('eaSecondBrainModule.qaReviewInsights'), icon: '💡', tab: 'insights' },
          { label: t('eaSecondBrainModule.qaAskQuestion'), icon: '🔍', tab: 'ask' },
          { label: t('eaSecondBrainModule.qaManageWatchlist'), icon: '👁️', tab: 'settings' },
        ].map((qa, i) => (
          <button
            key={i}
            onClick={() => onNavigate?.(qa.tab)}
            className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md hover:border-blue-300 transition-all text-left"
          >
            <span className="text-2xl">{qa.icon}</span>
            <p className="text-sm font-medium text-gray-700 mt-2">{qa.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
