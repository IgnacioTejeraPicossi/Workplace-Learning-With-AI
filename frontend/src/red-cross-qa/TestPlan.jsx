import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = 'http://localhost:8000/api/red-cross-qa';

const TestPlan = ({ environment }) => {
  const { t, i18n } = useTranslation();
  const [jiraEpic, setJiraEpic] = useState('');
  const [acceptance, setAcceptance] = useState('');
  const [designLink, setDesignLink] = useState('');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null);

  const handleGenerate = async () => {
    if (!jiraEpic.trim() && !acceptance.trim()) return;
    setGenerating(true); setPlan(null);
    try {
      const res = await fetch(`${API}/generate-test-plan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jira_epic: jiraEpic, acceptance_criteria: acceptance,
          design_link: designLink, risk_level: riskLevel,
          environment, lang: i18n.language,
        }),
      });
      setPlan(await res.json());
    } catch { setPlan({ status: 'error', message: 'Network error' }); }
    finally { setGenerating(false); }
  };

  const sections = [
    { key: 'manual_tests',           title: t('redCrossWebQaModule.testPlan.outputManualTests'),           color: '#dc2626' },
    { key: 'automated_candidates',   title: t('redCrossWebQaModule.testPlan.outputAutomatedCandidates'),   color: '#3b82f6' },
    { key: 'accessibility_checklist',title: t('redCrossWebQaModule.testPlan.outputAccessibilityChecklist'),color: '#06b6d4' },
    { key: 'api_checks',             title: t('redCrossWebQaModule.testPlan.outputApiChecks'),             color: '#8b5cf6' },
    { key: 'regression_scope',       title: t('redCrossWebQaModule.testPlan.outputRegressionScope'),       color: '#f59e0b' },
    { key: 'jira_subtasks',          title: t('redCrossWebQaModule.testPlan.outputJiraSubtasks'),          color: '#10b981' },
  ];

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="📋"
          title={t('redCrossWebQaModule.testPlan.header')}
          subtitle={t('redCrossWebQaModule.testPlan.subheader')}
          environment={environment}
          gradient="linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #831843 100%)"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
          {/* Inputs */}
          <div style={panel}>
            <h3 style={panelTitle}>📥 Inputs</h3>
            <div style={{ display: 'grid', gap: 14 }}>
              <Field label={t('redCrossWebQaModule.testPlan.inputJiraEpic')}>
                <textarea value={jiraEpic} onChange={e => setJiraEpic(e.target.value)} rows={3}
                  placeholder="ITEM-1234 — As a donor I want to choose a one-time amount and continue to payment"
                  style={input} />
              </Field>
              <Field label={t('redCrossWebQaModule.testPlan.inputAcceptance')}>
                <textarea value={acceptance} onChange={e => setAcceptance(e.target.value)} rows={4} style={input} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label={t('redCrossWebQaModule.testPlan.inputDesignLink')}>
                  <input value={designLink} onChange={e => setDesignLink(e.target.value)} style={input} />
                </Field>
                <Field label={t('redCrossWebQaModule.testPlan.inputRiskLevel')}>
                  <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)} style={input}>
                    <option value="low">{t('redCrossWebQaModule.common.low')}</option>
                    <option value="medium">{t('redCrossWebQaModule.common.medium')}</option>
                    <option value="high">{t('redCrossWebQaModule.common.high')}</option>
                  </select>
                </Field>
              </div>
              <button onClick={handleGenerate} disabled={generating} style={primaryBtn(generating)}>
                {generating ? t('redCrossWebQaModule.common.generating') : t('redCrossWebQaModule.testPlan.btnGenerate')}
              </button>
            </div>
          </div>

          {/* Output */}
          <div style={panel}>
            <h3 style={panelTitle}>📤 Output</h3>
            {!plan && <p style={empty}>{t('redCrossWebQaModule.common.noData')}</p>}
            {plan?.status === 'error' && <p style={{ color: '#b91c1c', fontSize: 14 }}>{plan.message}</p>}
            {plan?.plan && (
              <div style={{ display: 'grid', gap: 14 }}>
                {sections.map(s => {
                  const items = plan.plan[s.key] || [];
                  return (
                    <div key={s.key} style={{
                      borderLeft: `3px solid ${s.color}`,
                      backgroundColor: `${s.color}08`,
                      padding: '10px 14px', borderRadius: 8,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <strong style={{ fontSize: 13, color: '#1e293b' }}>{s.title}</strong>
                        <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{items.length}</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#475569' }}>
                        {items.map((it, i) => (
                          <li key={i}>{typeof it === 'string' ? it : it.title || JSON.stringify(it)}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const input = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid #cbd5e1', fontSize: 14, color: '#1e293b',
  fontFamily: 'inherit',
};
const primaryBtn = (disabled) => ({
  width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#fca5a5' : '#dc2626', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
  transition: 'background-color 0.2s',
});
const empty = { fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '36px 0' };

export default TestPlan;
