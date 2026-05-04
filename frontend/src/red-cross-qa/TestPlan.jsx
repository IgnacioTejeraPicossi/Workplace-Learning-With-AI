import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
    setGenerating(true);
    setPlan(null);
    try {
      const res = await fetch(`${API}/generate-test-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jira_epic: jiraEpic, acceptance_criteria: acceptance,
          design_link: designLink, risk_level: riskLevel,
          environment, lang: i18n.language,
        }),
      });
      const data = await res.json();
      setPlan(data);
    } catch {
      setPlan({ status: 'error', message: 'Network error' });
    } finally {
      setGenerating(false);
    }
  };

  const Section = ({ title, items }) => (
    <div>
      <h4 className="font-semibold text-gray-800 mb-2">{title} <span className="text-xs text-gray-400">({(items||[]).length})</span></h4>
      <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
        {(items||[]).map((it, i) => <li key={i}>{typeof it === 'string' ? it : it.title || JSON.stringify(it)}</li>)}
      </ul>
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('redCrossWebQaModule.testPlan.header')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('redCrossWebQaModule.testPlan.subheader')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('redCrossWebQaModule.testPlan.inputJiraEpic')}</label>
            <textarea value={jiraEpic} onChange={e => setJiraEpic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-400" rows={3}
              placeholder="e.g. ITEM-1234 — As a donor I want to choose a one-time amount and continue to payment" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('redCrossWebQaModule.testPlan.inputAcceptance')}</label>
            <textarea value={acceptance} onChange={e => setAcceptance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-400" rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('redCrossWebQaModule.testPlan.inputDesignLink')}</label>
              <input value={designLink} onChange={e => setDesignLink(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('redCrossWebQaModule.testPlan.inputRiskLevel')}</label>
              <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                <option value="low">{t('redCrossWebQaModule.common.low')}</option>
                <option value="medium">{t('redCrossWebQaModule.common.medium')}</option>
                <option value="high">{t('redCrossWebQaModule.common.high')}</option>
              </select>
            </div>
          </div>
          <button onClick={handleGenerate} disabled={generating}
            className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors">
            {generating ? t('redCrossWebQaModule.common.generating') : t('redCrossWebQaModule.testPlan.btnGenerate')}
          </button>
        </div>

        {/* Output */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {!plan && <p className="text-sm text-gray-400 text-center py-12">{t('redCrossWebQaModule.common.noData')}</p>}
          {plan && plan.status === 'error' && <p className="text-sm text-red-600">{plan.message}</p>}
          {plan && plan.plan && (
            <div className="space-y-4">
              <Section title={t('redCrossWebQaModule.testPlan.outputManualTests')} items={plan.plan.manual_tests} />
              <Section title={t('redCrossWebQaModule.testPlan.outputAutomatedCandidates')} items={plan.plan.automated_candidates} />
              <Section title={t('redCrossWebQaModule.testPlan.outputAccessibilityChecklist')} items={plan.plan.accessibility_checklist} />
              <Section title={t('redCrossWebQaModule.testPlan.outputApiChecks')} items={plan.plan.api_checks} />
              <Section title={t('redCrossWebQaModule.testPlan.outputRegressionScope')} items={plan.plan.regression_scope} />
              <Section title={t('redCrossWebQaModule.testPlan.outputJiraSubtasks')} items={plan.plan.jira_subtasks} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPlan;
