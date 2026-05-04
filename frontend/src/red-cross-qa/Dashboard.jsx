import React from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/red-cross-qa';

/**
 * Quality status overview for Red Cross Web QA Agent.
 * Phase 1: mock data + quality-gate cards. Wired to real /stats endpoint when backend is reachable.
 */
const Dashboard = ({ environment, executionMode, onNavigate }) => {
  const { t } = useTranslation();
  const [stats, setStats] = React.useState({
    totalRuns: 12, passRate: 78, openFindings: 9, criticalBlockers: 1
  });

  React.useEffect(() => {
    fetch(`${API}/stats`).then(r => r.json()).then(d => {
      if (d && typeof d === 'object') setStats(s => ({ ...s, ...d }));
    }).catch(() => {});
  }, []);

  const gates = [
    { id: 'gateAccessibility', status: 'WARN'  },
    { id: 'gatePerformance',   status: 'PASS'  },
    { id: 'gateApi',           status: 'PASS'  },
    { id: 'gateSecurity',      status: 'WARN'  },
    { id: 'gateSeo',           status: 'PASS'  },
    { id: 'gateForms',         status: 'PASS'  },
    { id: 'gateCms',           status: 'PASS'  },
    { id: 'gateStress',        status: 'IDLE'  },
  ];

  const recentRuns = [
    { id: 'redcross-qa-2026-05-04-001', suite: 'donationFlow',     status: 'WARN', when: '2h ago' },
    { id: 'redcross-qa-2026-05-04-002', suite: 'accessibilityCore',status: 'PASS', when: '5h ago' },
    { id: 'redcross-qa-2026-05-03-014', suite: 'graphqlApi',       status: 'PASS', when: '1d ago' },
    { id: 'redcross-qa-2026-05-03-013', suite: 'releaseReadiness', status: 'FAIL', when: '1d ago' },
  ];

  const topRisks = [
    { title: 'Donation amount field has insufficient screen reader description', severity: 'high',     category: 'accessibility' },
    { title: 'Search page TTFB above 800ms target on /sok',                       severity: 'medium',   category: 'performance' },
    { title: 'Missing Content-Security-Policy header on staging',                 severity: 'medium',   category: 'security' },
  ];

  const gateColor = (s) => ({
    PASS: 'bg-green-100 text-green-700 border-green-200',
    WARN: 'bg-amber-100 text-amber-700 border-amber-200',
    FAIL: 'bg-red-100 text-red-700 border-red-200',
    IDLE: 'bg-gray-100 text-gray-500 border-gray-200',
  }[s] || 'bg-gray-100 text-gray-500 border-gray-200');

  const sevColor = (s) => ({
    critical: '#b91c1c', high: '#dc2626', medium: '#f59e0b', low: '#10b981'
  }[s] || '#64748b');

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('redCrossWebQaModule.dashboard.header')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('redCrossWebQaModule.dashboard.subheader')}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('redCrossWebQaModule.dashboard.totalRuns'),        value: stats.totalRuns,        icon: '📜' },
          { label: t('redCrossWebQaModule.dashboard.passRate'),         value: `${stats.passRate}%`,   icon: '✅' },
          { label: t('redCrossWebQaModule.dashboard.openFindings'),     value: stats.openFindings,     icon: '🐞' },
          { label: t('redCrossWebQaModule.dashboard.criticalBlockers'), value: stats.criticalBlockers, icon: '🚨' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{kpi.label}</span>
              <span className="text-2xl">{kpi.icon}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Quality gates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('redCrossWebQaModule.dashboard.qualityGates')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {gates.map(g => (
            <div key={g.id} className={`px-4 py-3 rounded-lg border ${gateColor(g.status)} flex items-center justify-between`}>
              <span className="text-sm font-medium">{t(`redCrossWebQaModule.dashboard.${g.id}`)}</span>
              <span className="text-xs font-bold">{g.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two columns: Recent runs + Top risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('redCrossWebQaModule.dashboard.recentRuns')}</h3>
          <div className="space-y-2">
            {recentRuns.map(r => (
              <div key={r.id}
                onClick={() => onNavigate && onNavigate('runs')}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                <div>
                  <div className="text-xs text-gray-500">{r.id}</div>
                  <div className="text-sm font-medium text-gray-800">{t(`redCrossWebQaModule.suites.${r.suite}`)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full border ${gateColor(r.status)}`}>{r.status}</span>
                  <span className="text-xs text-gray-400">{r.when}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('redCrossWebQaModule.dashboard.topRisks')}</h3>
          <div className="space-y-2">
            {topRisks.map((r, i) => (
              <div key={i} className="p-3 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ backgroundColor: sevColor(r.severity) }}>
                    {t(`redCrossWebQaModule.common.${r.severity}`)}
                  </span>
                  <span className="text-xs text-gray-500">{r.category}</span>
                </div>
                <div className="text-sm text-gray-800">{r.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
