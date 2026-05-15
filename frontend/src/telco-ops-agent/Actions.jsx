import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0',
};

const STATUS_CONFIG = {
  DONE:    { bg: '#dcfce7', color: '#166534', border: '#86efac', icon: '✅' },
  RUNNING: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', icon: '⏳' },
  FAILED:  { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', icon: '❌' },
};

const Actions = () => {
  const { t, i18n } = useTranslation();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState(null);

  const loc = i18n.language === 'no' ? 'nb-NO' : 'en-US';

  useEffect(() => { loadActions(); }, []);

  const loadActions = async () => {
    try {
      const response = await fetch('/api/agent-runs');
      const data = await response.json();
      const allRuns = data.items || [];
      const opsRuns = allRuns.filter((run) => run.module === 'ops');
      const allActions = [];
      opsRuns.forEach((run) => {
        if (run.bundle?.actions) {
          run.bundle.actions.forEach((action) => {
            allActions.push({
              ...action,
              run_id: run.run_id,
              status: run.status,
              created_at: run.started_at,
              artifacts: run.artifacts,
            });
          });
        }
      });
      setActions(allActions);
    } catch (error) {
      console.error('Failed to load actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type) => ({
    'tmf622.order.create': '📦',
    'tmf622.order.change': '🔄',
    'subscription.change': '📋',
    'appointment.schedule': '📅',
    'comm.send': '📧',
    'crm.case.create': '🎫',
  }[type] || '🔧');

  const getArtifactInfo = (artifacts) => {
    if (!artifacts) return t('telcoOpsAgentModule.artifactsNone');
    const types = Object.keys(artifacts);
    if (types.length === 0) return t('telcoOpsAgentModule.artifactsNone');
    return types.map((type) => {
      const items = artifacts[type];
      if (Array.isArray(items) && items.length > 0)
        return t('telcoOpsAgentModule.artifactsSummary', { type, count: items.length });
      return t('telcoOpsAgentModule.artifactsSummaryOne', { type });
    }).join(', ');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem', backgroundColor: '#f8fafc' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'grid', gap: '24px' }}>

        {/* Hero banner */}
        <div style={{
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          background: 'linear-gradient(90deg, #ea580c 0%, #7c3aed 100%)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '40px' }}>⚡</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{t('telcoOpsAgentModule.actionsTitle')}</h2>
              <p style={{ margin: '4px 0 0', opacity: 0.9 }}>{t('telcoOpsAgentModule.actionsSubtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadActions}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            🔄 {t('telcoOpsAgentModule.refresh')}
          </button>
        </div>

        {/* Actions list */}
        {actions.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '56px' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>⚡</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#0f172a' }}>{t('telcoOpsAgentModule.actionsEmptyTitle')}</h3>
            <p style={{ margin: 0, color: '#64748b' }}>{t('telcoOpsAgentModule.actionsEmptyBody')}</p>
          </div>
        ) : (
          <div style={cardStyle}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.4fr 100px 1.2fr 120px 90px',
              gap: '8px',
              padding: '10px 16px',
              background: 'linear-gradient(90deg, #eff6ff 0%, #f5f3ff 100%)',
              borderRadius: '10px',
              marginBottom: '8px',
            }}>
              {[
                t('telcoOpsAgentModule.thAction'),
                t('telcoOpsAgentModule.thRunId'),
                t('telcoOpsAgentModule.thStatus'),
                t('telcoOpsAgentModule.thArtifacts'),
                t('telcoOpsAgentModule.thCreated'),
                t('telcoOpsAgentModule.thActions'),
              ].map((h, i) => (
                <span key={i} style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div style={{ display: 'grid', gap: '6px' }}>
              {actions.map((action, index) => {
                const sc = STATUS_CONFIG[action.status] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', icon: '•' };
                return (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.4fr 100px 1.2fr 120px 90px',
                      gap: '8px',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    {/* Action type */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '20px',
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(147,51,234,0.15))',
                        padding: '6px',
                        borderRadius: '8px',
                      }}>
                        {getActionIcon(action.type)}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{action.type}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{action.payload?.customerId || t('telcoOpsAgentModule.notAvailable')}</div>
                      </div>
                    </div>

                    {/* Run ID */}
                    <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                      {action.run_id?.substring(0, 14)}...
                    </div>

                    {/* Status pill */}
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: sc.bg,
                      color: sc.color,
                      border: `1px solid ${sc.border}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      {sc.icon} {action.status}
                    </span>

                    {/* Artifacts */}
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{getArtifactInfo(action.artifacts)}</div>

                    {/* Date */}
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {action.created_at ? new Date(action.created_at).toLocaleDateString(loc) : t('telcoOpsAgentModule.notAvailable')}
                    </div>

                    {/* View */}
                    <button
                      type="button"
                      onClick={() => setSelectedAction(action)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #bfdbfe',
                        background: '#eff6ff',
                        color: '#2563eb',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {t('telcoOpsAgentModule.recViewDetails')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedAction && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{
            ...cardStyle,
            maxWidth: '640px',
            width: '100%',
            margin: '0 16px',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{getActionIcon(selectedAction.type)}</span>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{t('telcoOpsAgentModule.modalActionDetails')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {[
              { label: t('telcoOpsAgentModule.labelActionType'), value: selectedAction.type },
              { label: t('telcoOpsAgentModule.thRunId'), value: selectedAction.run_id },
              { label: t('telcoOpsAgentModule.thStatus'), value: selectedAction.status },
            ].map((item, i) => (
              <div key={i} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>{item.value}</div>
              </div>
            ))}

            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('telcoOpsAgentModule.labelPayload')}</div>
              <pre style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: '10px', padding: '14px', fontSize: '12px', overflowX: 'auto', margin: 0 }}>
                {JSON.stringify(selectedAction.payload, null, 2)}
              </pre>
            </div>

            {selectedAction.artifacts && Object.keys(selectedAction.artifacts).length > 0 && (
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('telcoOpsAgentModule.thArtifacts')}</div>
                <pre style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: '10px', padding: '14px', fontSize: '12px', overflowX: 'auto', margin: 0 }}>
                  {JSON.stringify(selectedAction.artifacts, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Actions;
