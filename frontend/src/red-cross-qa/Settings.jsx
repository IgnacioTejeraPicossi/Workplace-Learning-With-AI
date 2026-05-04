import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHero from './_PageHero';

const API = 'http://localhost:8000/api/red-cross-qa';

const PAYMENT_OPTIONS = [
  { val: 'handoff',  key: 'paymentHandoff',  icon: '🤝', color: '#2563eb' },
  { val: 'sandbox',  key: 'paymentSandbox',  icon: '🧪', color: '#f59e0b' },
  { val: 'disabled', key: 'paymentDisabled', icon: '🚫', color: '#64748b' },
];

const Settings = ({ environment, setEnvironment, executionMode, setExecutionMode }) => {
  const { t } = useTranslation();
  const [envLocalUrl, setEnvLocalUrl] = useState('http://localhost:3000');
  const [envTestUrl, setEnvTestUrl] = useState('https://test.rodekors.no');
  const [jiraProject, setJiraProject] = useState('ITEM');
  const [jiraComponent, setJiraComponent] = useState('Web QA');
  const [jiraLabels, setJiraLabels] = useState('red-cross-qa, ai-generated');
  const [paymentFlow, setPaymentFlow] = useState('handoff');
  const [thresholdPerf, setThresholdPerf] = useState(85);
  const [thresholdSeo, setThresholdSeo] = useState(90);
  const [thresholdAxeCritical, setThresholdAxeCritical] = useState(0);
  const [outsystemsUrl, setOutsystemsUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/settings`);
        const data = await res.json();
        if (data.status === 'ok' && data.settings) {
          const s = data.settings;
          if (s.env_local_url) setEnvLocalUrl(s.env_local_url);
          if (s.env_test_url) setEnvTestUrl(s.env_test_url);
          if (s.jira_project) setJiraProject(s.jira_project);
          if (s.jira_component) setJiraComponent(s.jira_component);
          if (s.jira_labels) setJiraLabels((s.jira_labels || []).join(', '));
          if (s.payment_flow) setPaymentFlow(s.payment_flow);
          if (s.threshold_perf != null) setThresholdPerf(s.threshold_perf);
          if (s.threshold_seo != null) setThresholdSeo(s.threshold_seo);
          if (s.threshold_axe_critical != null) setThresholdAxeCritical(s.threshold_axe_critical);
          if (s.outsystems_url) setOutsystemsUrl(s.outsystems_url);
        }
      } catch { /* offline */ }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        env_local_url: envLocalUrl,
        env_test_url: envTestUrl,
        env_default: environment,
        execution_mode: executionMode,
        jira_project: jiraProject,
        jira_component: jiraComponent,
        jira_labels: jiraLabels.split(',').map(s => s.trim()).filter(Boolean),
        payment_flow: paymentFlow,
        threshold_perf: Number(thresholdPerf),
        threshold_seo: Number(thresholdSeo),
        threshold_axe_critical: Number(thresholdAxeCritical),
        outsystems_url: outsystemsUrl,
      };
      const res = await fetch(`${API}/settings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === 'ok') setSavedAt(new Date().toLocaleTimeString());
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f8fafc', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: 24 }}>
        <PageHero
          icon="⚙️"
          title={t('redCrossWebQaModule.settings.header')}
          subtitle={t('redCrossWebQaModule.settings.subheader')}
          environment={environment}
          mode={executionMode}
          gradient="linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #9d174d 100%)"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* Environments */}
          <div style={{ ...panel, borderTop: '4px solid #dc2626' }}>
            <h3 style={panelTitle}>🌍 {t('redCrossWebQaModule.common.environment')}</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <Field label={t('redCrossWebQaModule.settings.envLocalUrl')}>
                <input value={envLocalUrl} onChange={e => setEnvLocalUrl(e.target.value)} style={input} />
              </Field>
              <Field label={t('redCrossWebQaModule.settings.envTestUrl')}>
                <input value={envTestUrl} onChange={e => setEnvTestUrl(e.target.value)} style={input} />
              </Field>
              <Field label={t('redCrossWebQaModule.settings.envDefault')}>
                <select value={environment} onChange={e => setEnvironment && setEnvironment(e.target.value)} style={input}>
                  <option value="local">{t('redCrossWebQaModule.common.envLocal')}</option>
                  <option value="test">{t('redCrossWebQaModule.common.envTest')}</option>
                </select>
              </Field>
              <Field label={t('redCrossWebQaModule.modes.title')}>
                <select value={executionMode} onChange={e => setExecutionMode && setExecutionMode(e.target.value)} style={input}>
                  <option value="generate">{t('redCrossWebQaModule.modes.generateOnly')}</option>
                  <option value="execute">{t('redCrossWebQaModule.modes.executeDirectly')}</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Jira */}
          <div style={{ ...panel, borderTop: '4px solid #2563eb' }}>
            <h3 style={panelTitle}>🎯 {t('redCrossWebQaModule.settings.jiraSection')}</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <Field label={t('redCrossWebQaModule.settings.jiraProject')}>
                <input value={jiraProject} onChange={e => setJiraProject(e.target.value)} style={{ ...input, fontFamily: 'ui-monospace, monospace' }} />
              </Field>
              <Field label={t('redCrossWebQaModule.settings.jiraComponent')}>
                <input value={jiraComponent} onChange={e => setJiraComponent(e.target.value)} style={input} />
              </Field>
              <Field label={t('redCrossWebQaModule.settings.jiraLabels')}>
                <input value={jiraLabels} onChange={e => setJiraLabels(e.target.value)} style={input} placeholder="comma, separated" />
              </Field>
              <Field label="OutSystems URL">
                <input value={outsystemsUrl} onChange={e => setOutsystemsUrl(e.target.value)} style={input} placeholder="https://..." />
              </Field>
            </div>
          </div>

          {/* Payment flow */}
          <div style={{ ...panel, borderTop: '4px solid #f59e0b' }}>
            <h3 style={panelTitle}>💳 {t('redCrossWebQaModule.settings.paymentFlow')}</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {PAYMENT_OPTIONS.map(opt => {
                const active = paymentFlow === opt.val;
                return (
                  <label key={opt.val} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    backgroundColor: active ? `${opt.color}15` : '#f8fafc',
                    border: `1px solid ${active ? `${opt.color}80` : '#e2e8f0'}`,
                    transition: 'all 0.2s',
                  }}>
                    <input type="radio" name="paymentFlow" value={opt.val}
                      checked={active} onChange={() => setPaymentFlow(opt.val)}
                      style={{ accentColor: opt.color }} />
                    <span style={{ fontSize: 20 }}>{opt.icon}</span>
                    <span style={{
                      fontSize: 13, fontWeight: active ? 600 : 500,
                      color: active ? opt.color : '#475569',
                    }}>
                      {t(`redCrossWebQaModule.settings.${opt.key}`)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Thresholds */}
          <div style={{ ...panel, borderTop: '4px solid #10b981' }}>
            <h3 style={panelTitle}>📊 {t('redCrossWebQaModule.settings.thresholds')}</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <Field label={t('redCrossWebQaModule.settings.thresholdLighthousePerf')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="number" min="0" max="100" value={thresholdPerf}
                    onChange={e => setThresholdPerf(e.target.value)} style={{ ...input, flex: 1 }} />
                  <span style={thresholdBadge('#10b981')}>≥ {thresholdPerf}</span>
                </div>
              </Field>
              <Field label={t('redCrossWebQaModule.settings.thresholdLighthouseSeo')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="number" min="0" max="100" value={thresholdSeo}
                    onChange={e => setThresholdSeo(e.target.value)} style={{ ...input, flex: 1 }} />
                  <span style={thresholdBadge('#06b6d4')}>≥ {thresholdSeo}</span>
                </div>
              </Field>
              <Field label={t('redCrossWebQaModule.settings.thresholdAxeCritical')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="number" min="0" value={thresholdAxeCritical}
                    onChange={e => setThresholdAxeCritical(e.target.value)} style={{ ...input, flex: 1 }} />
                  <span style={thresholdBadge('#dc2626')}>≤ {thresholdAxeCritical}</span>
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* Save bar */}
        <div style={{
          ...panel, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <button onClick={handleSave} disabled={saving} style={primaryBtn(saving)}>
            {saving ? t('redCrossWebQaModule.common.loading') : `💾 ${t('redCrossWebQaModule.settings.btnSave')}`}
          </button>
          {savedAt && (
            <span style={{
              padding: '6px 12px', borderRadius: 999,
              backgroundColor: '#d1fae5', color: '#047857', border: '1px solid #6ee7b7',
              fontSize: 12, fontWeight: 600,
            }}>
              ✓ Saved at {savedAt}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label style={{
      display: 'block', fontSize: 11, color: '#64748b',
      textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4, marginBottom: 6,
    }}>{label}</label>
    {children}
  </div>
);

const panel = {
  backgroundColor: 'white', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
};
const panelTitle = { margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#1e293b' };
const input = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #cbd5e1', fontSize: 13, color: '#1e293b',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
const primaryBtn = (disabled) => ({
  padding: '10px 22px', borderRadius: 8, border: 'none',
  backgroundColor: disabled ? '#fca5a5' : '#dc2626', color: 'white',
  fontWeight: 600, fontSize: 14, cursor: disabled ? 'default' : 'pointer',
});
const thresholdBadge = (color) => ({
  padding: '6px 10px', borderRadius: 8,
  backgroundColor: `${color}15`, color, border: `1px solid ${color}40`,
  fontSize: 12, fontWeight: 700, fontFamily: 'ui-monospace, monospace',
  whiteSpace: 'nowrap', minWidth: 60, textAlign: 'center',
});

export default Settings;
