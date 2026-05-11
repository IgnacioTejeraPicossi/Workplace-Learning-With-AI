import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AttentionPage,
  AttentionHero,
  attentionCardStyle,
  attentionPanelStyle,
  AttentionSectionHeader,
} from './sharedUi';

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
    if (!insightId) return;
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

  const categoryIcon = (c) => ({
    deprecation: '📦', security: '🔒', license: '📜', performance: '⚡',
    vendor: '🏢', compliance: '✅', architecture: '🏗️', cost: '💰',
  }[c] || '📄');

  const urgencyPillStyle = (u) => {
    const map = {
      critical: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
      high: { bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' },
      medium: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
      low: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
      info: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
    };
    return map[u] || map.info;
  };

  const statusPillStyle = (s) => {
    const map = {
      pending: { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
      acknowledged: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
      in_progress: { bg: '#f3e8ff', color: '#6b21a8', border: '#d8b4fe' },
      resolved: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
      dismissed: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },
    };
    return map[s] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  };

  const humanizeToken = (x) => (x == null || x === '' ? '—' : String(x).replace(/_/g, ' '));

  const insightKey = (ins) => ins.insight_id ?? ins.id;

  return (
    <AttentionPage>
      <AttentionHero
        icon="💡"
        title={t('eaSecondBrainModule.insightsTitle')}
        subtitle={t('eaSecondBrainModule.insightsSubtitle')}
      />

      <div
        style={{
          ...attentionCardStyle,
          background: 'linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%)',
          border: '1px solid #e9d5ff',
        }}
      >
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

      <div style={attentionPanelStyle}>
        <AttentionSectionHeader icon="🔎" title={t('eaSecondBrainModule.filtersPanelHeading')} />
        <div
          style={{
            padding: '18px 24px 22px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            background: '#fafafa',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>{t('eaSecondBrainModule.filterBy')}:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              background: 'white',
              minWidth: '140px',
            }}
          >
            <option value="">{t('eaSecondBrainModule.allStatuses')}</option>
            {['pending', 'acknowledged', 'in_progress', 'resolved', 'dismissed'].map((s) => (
              <option key={s} value={s}>
                {humanizeToken(s)}
              </option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              background: 'white',
              minWidth: '140px',
            }}
          >
            <option value="">{t('eaSecondBrainModule.allCategories')}</option>
            {['deprecation', 'security', 'license', 'performance', 'vendor', 'compliance', 'architecture', 'cost'].map((c) => (
              <option key={c} value={c}>
                {humanizeToken(c)}
              </option>
            ))}
          </select>
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              background: 'white',
              minWidth: '120px',
            }}
          >
            <option value="">{t('eaSecondBrainModule.allUrgencies')}</option>
            {['critical', 'high', 'medium', 'low', 'info'].map((u) => (
              <option key={u} value={u}>
                {humanizeToken(u)}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '14px', color: '#94a3b8', marginLeft: 'auto', fontWeight: 500 }}>
            {insights.length} {t('eaSecondBrainModule.insightsCount')}
          </span>
        </div>
      </div>

      {/* Insights List */}
      {loading ? (
        <div style={{ ...attentionCardStyle, display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : insights.length === 0 ? (
        <div style={{ ...attentionCardStyle, textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
          <p style={{ margin: '0 0 8px', fontSize: '32px' }}>💡</p>
          <p style={{ margin: 0 }}>{t('eaSecondBrainModule.noInsights')}</p>
        </div>
      ) : (
        <div style={attentionPanelStyle}>
          <AttentionSectionHeader icon="📋" title={t('eaSecondBrainModule.insightsLibraryHeading')} />
          <div style={{ padding: '20px 22px 24px', display: 'grid', gap: '16px', background: '#f8fafc' }}>
            {insights.map((ins) => {
              const rowId = insightKey(ins);
              const expanded = expandedId === rowId;
              const urg = ins.urgency || 'info';
              const stat = ins.status || 'pending';
              const cat = ins.category || 'architecture';
              const stPill = statusPillStyle(stat);
              const us = urgencyPillStyle(urg);
              return (
                <div
                  key={rowId}
                  style={{
                    borderRadius: '14px',
                    border: `1px solid ${us.border}`,
                    background: 'white',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    borderLeft: `5px solid ${us.border}`,
                  }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    className="p-5 cursor-pointer"
                    style={{
                      background: `linear-gradient(90deg, ${us.bg} 0%, #ffffff 52%)`,
                    }}
                    onClick={() => setExpandedId(expanded ? null : rowId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedId(expanded ? null : rowId);
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl shrink-0">{categoryIcon(cat)}</span>
                      <div className="flex-1 min-w-0">
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '10px',
                          }}
                        >
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                              background: us.bg,
                              color: us.color,
                              border: `1px solid ${us.border}`,
                            }}
                          >
                            {humanizeToken(urg)}
                          </span>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: stPill.bg,
                              color: stPill.color,
                              border: `1px solid ${stPill.border}`,
                            }}
                          >
                            {humanizeToken(stat)}
                          </span>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {humanizeToken(cat)}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 leading-snug">{ins.topic}</h4>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
                          {ins.impact_score?.total != null && (
                            <span className="flex items-center gap-1">
                              📊 {t('eaSecondBrainModule.impactLabel')}: <strong>{(ins.impact_score.total * 100).toFixed(0)}%</strong>
                            </span>
                          )}
                          {ins.affected_technologies?.length > 0 && (
                            <span>🔧 {ins.affected_technologies.join(', ')}</span>
                          )}
                          {ins.created_at && <span>🕐 {new Date(ins.created_at).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <span className="text-gray-400 shrink-0">{expanded ? '▲' : '▼'}</span>
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
                        <button
                          type="button"
                          onClick={() => updateStatus(rowId, 'acknowledged')}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                        >
                          {t('eaSecondBrainModule.acknowledge')}
                        </button>
                      )}
                      {ins.status !== 'in_progress' && ins.status !== 'resolved' && ins.status !== 'dismissed' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(rowId, 'in_progress')}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200"
                        >
                          {t('eaSecondBrainModule.startProgress')}
                        </button>
                      )}
                      {ins.status !== 'resolved' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(rowId, 'resolved')}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                        >
                          {t('eaSecondBrainModule.resolve')}
                        </button>
                      )}
                      {ins.status !== 'dismissed' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(rowId, 'dismissed')}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                        >
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
        </div>
      )}
    </AttentionPage>
  );
};

export default Insights;
