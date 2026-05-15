import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0',
};

const Recommendations = () => {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => { loadRecommendations(); }, []);

  const loadRecommendations = async () => {
    try {
      const response = await fetch('/agents/ops/recommendations');
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveRecommendation = async (recommendation) => {
    setSending(true);
    try {
      const runId = `ops-${Date.now()}`;
      const bundle = {
        run_id: runId,
        customer_id: recommendation.customer_id,
        topic: recommendation.title,
        summary_md: recommendation.reason,
        recommendations: [{ title: recommendation.title, detail: recommendation.reason }],
        actions: [
          {
            type: 'tmf622.order.create',
            payload: { externalId: runId, customerId: recommendation.customer_id, offeringId: recommendation.offering_id },
          },
          {
            type: 'comm.send',
            payload: {
              channel: 'email',
              to: `${recommendation.customer_id}@example.com`,
              subject: `Order Confirmation: ${recommendation.title}`,
              html: `<p>Your order for ${recommendation.title} has been processed.</p>`,
            },
          },
        ],
        callback_url: 'http://localhost:8000/api/agent-runs/callback',
      };

      const response = await fetch('/agents/ops/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Signature': 'mock-signature' },
        body: JSON.stringify(bundle),
      });

      if (response.ok) {
        window.alert(t('telcoOpsAgentModule.recApprovedOk'));
        loadRecommendations();
      } else {
        window.alert(t('telcoOpsAgentModule.recApproveFail'));
      }
    } catch (error) {
      console.error('Failed to approve recommendation:', error);
      window.alert(t('telcoOpsAgentModule.recApproveError'));
    } finally {
      setSending(false);
    }
  };

  const getConfidenceLevel = (conf) => {
    if (conf >= 0.8) return { color: '#16a34a', bg: '#dcfce7', border: '#86efac', label: 'Alta' };
    if (conf >= 0.6) return { color: '#ca8a04', bg: '#fef9c3', border: '#fde047', label: 'Media' };
    return { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', label: 'Baja' };
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
          background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '40px' }}>💡</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{t('telcoOpsAgentModule.recTitle')}</h2>
              <p style={{ margin: '4px 0 0', opacity: 0.9 }}>{t('telcoOpsAgentModule.recSubtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadRecommendations}
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

        {/* Recommendations list */}
        {recommendations.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '56px' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>💡</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#0f172a' }}>{t('telcoOpsAgentModule.recEmptyTitle')}</h3>
            <p style={{ margin: 0, color: '#64748b' }}>{t('telcoOpsAgentModule.recEmptyBody')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {recommendations.map((rec, index) => {
              const conf = getConfidenceLevel(rec.confidence);
              const isAuto = rec.mode === 'auto';
              return (
                <div
                  key={index}
                  style={{
                    ...cardStyle,
                    borderLeft: `5px solid ${conf.border}`,
                    background: `linear-gradient(90deg, ${conf.bg}55 0%, white 40%)`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title + mode pill */}
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{rec.title}</h3>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          background: isAuto ? '#dcfce7' : '#dbeafe',
                          color: isAuto ? '#166534' : '#1e40af',
                          border: `1px solid ${isAuto ? '#86efac' : '#93c5fd'}`,
                        }}>
                          {isAuto ? `🤖 ${t('telcoOpsAgentModule.modeAuto')}` : `👆 ${t('telcoOpsAgentModule.modeOneClick')}`}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 14px', color: '#475569', fontSize: '14px', lineHeight: 1.5 }}>{rec.reason}</p>

                      {/* Metrics row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                        {[
                          { label: t('telcoOpsAgentModule.recCustomer'), value: rec.customer_id, icon: '👤', color: '#475569' },
                          {
                            label: t('telcoOpsAgentModule.recConfidence'),
                            value: `${(rec.confidence * 100).toFixed(1)}%`,
                            icon: '🎯',
                            color: conf.color,
                          },
                          { label: t('telcoOpsAgentModule.recExpectedValue'), value: `€${rec.expected_value?.toFixed(2) || '—'}`, icon: '📈', color: '#16a34a' },
                          { label: t('telcoOpsAgentModule.recPriceImpact'), value: `€${rec.price_impact?.toFixed(2) || '—'}`, icon: '💶', color: '#2563eb' },
                        ].map((m, i) => (
                          <div key={i} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{m.icon} {m.label}</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: m.color }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                      <button
                        type="button"
                        onClick={() => approveRecommendation(rec)}
                        disabled={sending}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '10px',
                          border: 'none',
                          cursor: sending ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
                          background: sending ? '#e2e8f0' : 'linear-gradient(90deg, #16a34a 0%, #2563eb 100%)',
                          color: sending ? '#94a3b8' : 'white',
                          opacity: sending ? 0.7 : 1,
                        }}
                      >
                        {sending ? `⏳ ${t('telcoOpsAgentModule.recDispatching')}` : `✅ ${t('telcoOpsAgentModule.recApproveDispatch')}`}
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '10px 16px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
                          background: 'white',
                          color: '#475569',
                        }}
                      >
                        📋 {t('telcoOpsAgentModule.recViewDetails')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Test panel */}
        <div style={{
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          background: 'linear-gradient(90deg, #16a34a 0%, #2563eb 100%)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '22px' }}>🧪</span>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{t('telcoOpsAgentModule.testRecTitle')}</h3>
          </div>
          <p style={{ margin: '0 0 16px', opacity: 0.9 }}>{t('telcoOpsAgentModule.testRecBody')}</p>
          <button
            type="button"
            onClick={() => approveRecommendation({
              customer_id: 'TELIA-123',
              title: 'Upgrade to 5G Unlimited',
              reason: 'High usage detected, customer is eligible for 5G upgrade',
              offering_id: '5G-UNLTD',
              price_impact: 8.0,
              expected_value: 15.0,
              confidence: 0.85,
              mode: 'one_click',
            })}
            disabled={sending}
            style={{
              padding: '10px 22px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '10px',
              cursor: sending ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              opacity: sending ? 0.6 : 1,
            }}
          >
            {sending ? `⏳ ${t('telcoOpsAgentModule.testRecCreating')}` : `🧪 ${t('telcoOpsAgentModule.testRecButton')}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
