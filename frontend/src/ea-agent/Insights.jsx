import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const Insights = () => {
  const { t } = useTranslation();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genContext, setGenContext] = useState('');

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterCategory) params.set('category', filterCategory);
      if (filterUrgency) params.set('urgency', filterUrgency);
      params.set('limit', '50');
      const res = await fetch(`${API}/api/ea-brain/insights?${params}`);
      if (res.ok) setInsights(await res.json());
    } catch (err) {
      console.error('Fetch insights error:', err);
    }
    setLoading(false);
  }, [filterStatus, filterCategory, filterUrgency]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  const updateStatus = async (insightId, newStatus) => {
    try {
      const res = await fetch(`${API}/api/ea-brain/insights/${insightId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchInsights();
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const generateInsight = async () => {
    if (!genTopic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API}/api/ea-brain/insights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: genTopic, context: genContext || undefined }),
      });
      if (res.ok) {
        setGenTopic('');
        setGenContext('');
        fetchInsights();
      }
    } catch (err) {
      console.error('Generate insight error:', err);
    }
    setGenerating(false);
  };

  const urgencyColor = (u) => ({
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
  }[u] || 'bg-gray-100 text-gray-800');

  const statusColor = (s) => ({
    pending: 'bg-yellow-50 text-yellow-700',
    acknowledged: 'bg-blue-50 text-blue-700',
    in_progress: 'bg-purple-50 text-purple-700',
    resolved: 'bg-green-50 text-green-700',
    dismissed: 'bg-gray-50 text-gray-500',
  }[s] || 'bg-gray-50 text-gray-700');

  const categoryIcon = (c) => ({
    deprecation: '📦', security: '🔒', license: '📜', performance: '⚡',
    vendor: '🏢', compliance: '✅', architecture: '🏗️', cost: '💰',
  }[c] || '📄');

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('eaSecondBrainModule.insightsTitle')}</h2>
        <p className="text-gray-500 mt-1">{t('eaSecondBrainModule.insightsSubtitle')}</p>
      </div>

      {/* Generate Insight Panel */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-3">
          🤖 {t('eaSecondBrainModule.generateInsightTitle')}
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            value={genTopic}
            onChange={(e) => setGenTopic(e.target.value)}
            placeholder={t('eaSecondBrainModule.generateTopicPlaceholder')}
            className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
          />
          <input
            type="text"
            value={genContext}
            onChange={(e) => setGenContext(e.target.value)}
            placeholder={t('eaSecondBrainModule.generateContextPlaceholder')}
            className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
          />
          <button
            onClick={generateInsight}
            disabled={generating || !genTopic.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {generating ? t('eaSecondBrainModule.generating') : t('eaSecondBrainModule.generateBtn')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-gray-600">{t('eaSecondBrainModule.filterBy')}:</span>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border rounded-lg text-sm">
          <option value="">{t('eaSecondBrainModule.allStatuses')}</option>
          {['pending', 'acknowledged', 'in_progress', 'resolved', 'dismissed'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 border rounded-lg text-sm">
          <option value="">{t('eaSecondBrainModule.allCategories')}</option>
          {['deprecation', 'security', 'license', 'performance', 'vendor', 'compliance', 'architecture', 'cost'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={filterUrgency} onChange={(e) => setFilterUrgency(e.target.value)}
          className="px-3 py-1.5 border rounded-lg text-sm">
          <option value="">{t('eaSecondBrainModule.allUrgencies')}</option>
          {['critical', 'high', 'medium', 'low', 'info'].map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400 ml-auto">
          {insights.length} {t('eaSecondBrainModule.insightsCount')}
        </span>
      </div>

      {/* Insights List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : insights.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">💡</p>
          <p>{t('eaSecondBrainModule.noInsights')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((ins) => {
            const expanded = expandedId === ins.insight_id;
            return (
              <div key={ins.insight_id || ins.id}
                className="bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md">
                {/* Card Header */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : ins.insight_id)}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{categoryIcon(ins.category)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${urgencyColor(ins.urgency)}`}>
                          {ins.urgency}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(ins.status)}`}>
                          {ins.status}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                          {ins.category}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-gray-900">{ins.topic}</h4>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {ins.impact_score?.total != null && (
                          <span className="flex items-center gap-1">
                            📊 {t('eaSecondBrainModule.impactLabel')}: <strong>{(ins.impact_score.total * 100).toFixed(0)}%</strong>
                          </span>
                        )}
                        {ins.affected_technologies?.length > 0 && (
                          <span>🔧 {ins.affected_technologies.join(', ')}</span>
                        )}
                        {ins.created_at && (
                          <span>🕐 {new Date(ins.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded Detail */}
                {expanded && (
                  <div className="border-t px-5 pb-5 pt-4 space-y-4 bg-gray-50">
                    {/* Impact Breakdown */}
                    {ins.impact_score && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">{t('eaSecondBrainModule.impactBreakdown')}</h5>
                        <div className="grid grid-cols-4 gap-3">
                          {['relevance', 'criticality', 'freshness', 'risk'].map(dim => (
                            <div key={dim} className="text-center">
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(ins.impact_score[dim] || 0) * 100}%` }}></div>
                              </div>
                              <span className="text-xs text-gray-500 capitalize">{dim}</span>
                              <span className="text-xs text-gray-700 ml-1">{((ins.impact_score[dim] || 0) * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {ins.summary_md && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-1">{t('eaSecondBrainModule.summaryLabel')}</h5>
                        <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-white rounded-lg p-3 border">
                          {ins.summary_md}
                        </div>
                      </div>
                    )}

                    {/* Portfolio Matches */}
                    {ins.portfolio_matches?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">{t('eaSecondBrainModule.portfolioMatchesLabel')}</h5>
                        <div className="flex flex-wrap gap-2">
                          {ins.portfolio_matches.map((pm, j) => (
                            <div key={j} className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                              <span className="font-medium text-blue-800">{pm.name}</span>
                              <span className="text-blue-500 ml-2 text-xs">({(pm.score * 100).toFixed(0)}%)</span>
                              {pm.reason && <span className="text-blue-600 text-xs block">{pm.reason}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evidence */}
                    {ins.evidence?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">{t('eaSecondBrainModule.evidenceLabel')}</h5>
                        <div className="space-y-2">
                          {ins.evidence.map((ev, j) => (
                            <div key={j} className="text-sm bg-white rounded-lg p-3 border">
                              <p className="font-medium text-gray-800">{ev.source}</p>
                              {ev.snippet && <p className="text-gray-500 text-xs mt-1">{ev.snippet}</p>}
                              {ev.url && <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs hover:underline">{ev.url}</a>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Actions */}
                    {ins.recommended_actions?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">{t('eaSecondBrainModule.recommendedActionsLabel')}</h5>
                        <div className="space-y-2">
                          {ins.recommended_actions.map((action, j) => (
                            <div key={j} className="flex items-start gap-3 bg-white rounded-lg p-3 border">
                              <span className="text-lg">📋</span>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{action.title}</p>
                                {action.detail && <p className="text-xs text-gray-500 mt-0.5">{action.detail}</p>}
                                {action.assignee && <p className="text-xs text-blue-600 mt-0.5">→ {action.assignee}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Actions */}
                    <div className="flex gap-2 pt-2">
                      {ins.status !== 'acknowledged' && ins.status !== 'resolved' && ins.status !== 'dismissed' && (
                        <button onClick={() => updateStatus(ins.insight_id, 'acknowledged')}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">
                          {t('eaSecondBrainModule.acknowledge')}
                        </button>
                      )}
                      {ins.status !== 'in_progress' && ins.status !== 'resolved' && ins.status !== 'dismissed' && (
                        <button onClick={() => updateStatus(ins.insight_id, 'in_progress')}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200">
                          {t('eaSecondBrainModule.startProgress')}
                        </button>
                      )}
                      {ins.status !== 'resolved' && (
                        <button onClick={() => updateStatus(ins.insight_id, 'resolved')}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200">
                          {t('eaSecondBrainModule.resolve')}
                        </button>
                      )}
                      {ins.status !== 'dismissed' && (
                        <button onClick={() => updateStatus(ins.insight_id, 'dismissed')}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                          {t('eaSecondBrainModule.dismiss')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Insights;
