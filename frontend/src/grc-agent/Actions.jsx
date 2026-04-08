import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ACTION_TYPES = ['erp.fix', 'po.block', 'invoice.hold', 'esg.recalc', 'notify.slack', 'notify.teams'];

const Actions = () => {
  const { t, i18n } = useTranslation();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      const response = await fetch('/api/agent-runs');
      const data = await response.json();

      const allRuns = data.items || [];
      const grcRuns = allRuns.filter(run => run.module === 'grc');

      const allActions = [];
      grcRuns.forEach(run => {
        if (run.bundle?.actions) {
          run.bundle.actions.forEach((action, index) => {
            allActions.push({
              ...action,
              run_id: run.run_id,
              timestamp: run.created_at,
              index: index
            });
          });
        }
      });
      setActions(allActions);
    } catch (error) {
      console.error("Failed to load actions:", error);
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionTypeColor = (type) => {
    switch (type) {
      case 'erp.fix': return 'text-blue-600 bg-blue-100';
      case 'po.block': return 'text-red-600 bg-red-100';
      case 'invoice.hold': return 'text-orange-600 bg-orange-100';
      case 'esg.recalc': return 'text-green-600 bg-green-100';
      case 'notify.slack': return 'text-purple-600 bg-purple-100';
      case 'notify.teams': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getModeColor = (mode) => {
    return mode === 'Auto' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100';
  };

  const formatMode = (mode) => {
    if (mode === 'Auto') return t('grcAgentModule.modeAuto');
    return mode ?? '—';
  };

  const dateLocale = i18n.language?.startsWith('no') ? 'nb-NO' : 'en-US';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('grcAgentModule.actionsTitle')}</h2>
        <p className="text-gray-600">{t('grcAgentModule.actionsSubtitle')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('grcAgentModule.thActionType')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('grcAgentModule.thMode')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('grcAgentModule.thPayload')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('grcAgentModule.thRunId')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('grcAgentModule.thTimestamp')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('grcAgentModule.thStatus')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {actions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <p>{t('grcAgentModule.actionsEmpty')}</p>
                      <p className="text-sm">{t('grcAgentModule.actionsEmptyHint')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                actions.map((action, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionTypeColor(action.type)}`}>
                        {action.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModeColor(action.mode)}`}>
                        {formatMode(action.mode)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {JSON.stringify(action.payload)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {action.run_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {action.timestamp ? new Date(action.timestamp).toLocaleString(dateLocale) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {t('grcAgentModule.statusExecuted')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">{t('grcAgentModule.actionTypesLegend')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ACTION_TYPES.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getActionTypeColor(type)}`}>{type}</span>
              <span className="text-xs text-gray-600">{t(`grcAgentModule.actionTypeDesc.${type}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Actions;
