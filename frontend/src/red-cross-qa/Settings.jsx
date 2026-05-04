import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000/api/red-cross-qa';

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

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">⚙️ {t('redCrossWebQaModule.settings.header')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('redCrossWebQaModule.settings.subheader')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">{t('redCrossWebQaModule.common.environment')}</h3>
          <Field label={t('redCrossWebQaModule.settings.envLocalUrl')}>
            <input value={envLocalUrl} onChange={e => setEnvLocalUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </Field>
          <Field label={t('redCrossWebQaModule.settings.envTestUrl')}>
            <input value={envTestUrl} onChange={e => setEnvTestUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </Field>
          <Field label={t('redCrossWebQaModule.settings.envDefault')}>
            <select value={environment} onChange={e => setEnvironment && setEnvironment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="local">{t('redCrossWebQaModule.common.envLocal')}</option>
              <option value="test">{t('redCrossWebQaModule.common.envTest')}</option>
            </select>
          </Field>
          <Field label={t('redCrossWebQaModule.modes.title')}>
            <select value={executionMode} onChange={e => setExecutionMode && setExecutionMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="generate">{t('redCrossWebQaModule.modes.generateOnly')}</option>
              <option value="execute">{t('redCrossWebQaModule.modes.executeDirectly')}</option>
            </select>
          </Field>
        </div>

        {/* Jira */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">{t('redCrossWebQaModule.settings.jiraSection')}</h3>
          <Field label={t('redCrossWebQaModule.settings.jiraProject')}>
            <input value={jiraProject} onChange={e => setJiraProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono" />
          </Field>
          <Field label={t('redCrossWebQaModule.settings.jiraComponent')}>
            <input value={jiraComponent} onChange={e => setJiraComponent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </Field>
          <Field label={t('redCrossWebQaModule.settings.jiraLabels')}>
            <input value={jiraLabels} onChange={e => setJiraLabels(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="comma, separated" />
          </Field>
          <Field label="OutSystems URL">
            <input value={outsystemsUrl} onChange={e => setOutsystemsUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="https://..." />
          </Field>
        </div>

        {/* Payment flow */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
          <h3 className="font-semibold text-gray-800">{t('redCrossWebQaModule.settings.paymentFlow')}</h3>
          {[
            ['handoff', 'paymentHandoff'],
            ['sandbox', 'paymentSandbox'],
            ['disabled', 'paymentDisabled'],
          ].map(([val, key]) => (
            <label key={val} className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm ${paymentFlow === val ? 'bg-red-50 border-red-300 text-red-800' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="radio" name="paymentFlow" value={val} checked={paymentFlow === val} onChange={() => setPaymentFlow(val)} className="accent-red-600" />
              {t(`redCrossWebQaModule.settings.${key}`)}
            </label>
          ))}
        </div>

        {/* Thresholds */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">{t('redCrossWebQaModule.settings.thresholds')}</h3>
          <Field label={t('redCrossWebQaModule.settings.thresholdLighthousePerf')}>
            <input type="number" min="0" max="100" value={thresholdPerf} onChange={e => setThresholdPerf(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </Field>
          <Field label={t('redCrossWebQaModule.settings.thresholdLighthouseSeo')}>
            <input type="number" min="0" max="100" value={thresholdSeo} onChange={e => setThresholdSeo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </Field>
          <Field label={t('redCrossWebQaModule.settings.thresholdAxeCritical')}>
            <input type="number" min="0" value={thresholdAxeCritical} onChange={e => setThresholdAxeCritical(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:opacity-50">
          {saving ? t('redCrossWebQaModule.common.loading') : t('redCrossWebQaModule.settings.btnSave')}
        </button>
        {savedAt && <span className="text-xs text-green-700">✓ Saved at {savedAt}</span>}
      </div>
    </div>
  );
};

export default Settings;
