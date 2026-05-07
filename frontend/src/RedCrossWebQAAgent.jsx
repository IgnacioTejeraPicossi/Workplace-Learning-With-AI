import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dashboard from './red-cross-qa/Dashboard';
import TestPlan from './red-cross-qa/TestPlan';
import Playwright from './red-cross-qa/Playwright';
import Cypress from './red-cross-qa/Cypress';
import ApiQA from './red-cross-qa/ApiQA';
import CmsQA from './red-cross-qa/CmsQA';
import FormsQA from './red-cross-qa/FormsQA';
import ContentMigration from './red-cross-qa/ContentMigration';
import Accessibility from './red-cross-qa/Accessibility';
import Performance from './red-cross-qa/Performance';
import Designsystemet from './red-cross-qa/Designsystemet';
import RoleMatrix from './red-cross-qa/RoleMatrix';
import StressTest from './red-cross-qa/StressTest';
import SecurityPrivacy from './red-cross-qa/SecurityPrivacy';
import AzureDevOps from './red-cross-qa/AzureDevOps';
import SprintReport from './red-cross-qa/SprintReport';
import Runs from './red-cross-qa/Runs';
import Settings from './red-cross-qa/Settings';

/**
 * Red Cross Web QA Agent — main shell.
 * Future Item Agents → Red Cross Web QA Agent (#9, last position).
 *
 * Two execution modes (set in Settings, surfaced in header):
 *   - Generate-only: produces scripts & reports for Cursor / Claude / GitHub Actions
 *   - Execute-directly: runs Playwright/Cypress/axe/Lighthouse/k6 in-app
 *
 * Two environments (MVP): local (http://localhost:3000) and test.
 */
const RedCrossWebQAAgent = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [environment, setEnvironment] = useState('local');
  const [executionMode, setExecutionMode] = useState('generate'); // 'generate' | 'execute'

  const tabs = [
    { id: 'dashboard',         label: t('redCrossWebQaModule.tabDashboard'),        icon: '📊' },
    { id: 'test-plan',         label: t('redCrossWebQaModule.tabTestPlan'),         icon: '📋' },
    { id: 'playwright',        label: t('redCrossWebQaModule.tabPlaywright'),       icon: '🎭' },
    { id: 'cypress',           label: t('redCrossWebQaModule.tabCypress'),          icon: '🌲' },
    { id: 'api-qa',            label: t('redCrossWebQaModule.tabApiQa'),            icon: '🔌' },
    { id: 'cms-qa',            label: t('redCrossWebQaModule.tabCmsQa'),            icon: '📝' },
    { id: 'forms-qa',          label: t('redCrossWebQaModule.tabFormsQa'),          icon: '📑' },
    { id: 'content-migration', label: t('redCrossWebQaModule.tabContentMigration'), icon: '📦' },
    { id: 'accessibility',     label: t('redCrossWebQaModule.tabAccessibility'),    icon: '♿' },
    { id: 'performance',       label: t('redCrossWebQaModule.tabPerformance'),      icon: '⚡' },
    { id: 'designsystemet',    label: t('redCrossWebQaModule.tabDesignsystemet'),   icon: '🎨' },
    { id: 'role-matrix',       label: t('redCrossWebQaModule.tabRoleMatrix'),       icon: '🔐' },
    { id: 'stress-test',       label: t('redCrossWebQaModule.tabStressTest'),       icon: '🔥' },
    { id: 'security-privacy',  label: t('redCrossWebQaModule.tabSecurityPrivacy'),  icon: '🛡️' },
    { id: 'ado',               label: t('redCrossWebQaModule.tabAdo'),              icon: '🎯' },
    { id: 'sprint-report',     label: t('redCrossWebQaModule.tabSprintReport'),     icon: '📈' },
    { id: 'runs',              label: t('redCrossWebQaModule.tabRuns'),             icon: '📜' },
    { id: 'settings',          label: t('redCrossWebQaModule.tabSettings'),         icon: '⚙️' },
  ];

  const sharedProps = { environment, executionMode };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':         return <Dashboard {...sharedProps} onNavigate={setActiveTab} />;
      case 'test-plan':         return <TestPlan {...sharedProps} />;
      case 'playwright':        return <Playwright {...sharedProps} />;
      case 'cypress':           return <Cypress {...sharedProps} />;
      case 'api-qa':            return <ApiQA {...sharedProps} />;
      case 'cms-qa':            return <CmsQA {...sharedProps} />;
      case 'forms-qa':          return <FormsQA {...sharedProps} />;
      case 'content-migration': return <ContentMigration {...sharedProps} />;
      case 'accessibility':     return <Accessibility {...sharedProps} />;
      case 'performance':       return <Performance {...sharedProps} />;
      case 'designsystemet':    return <Designsystemet {...sharedProps} />;
      case 'role-matrix':       return <RoleMatrix {...sharedProps} />;
      case 'stress-test':       return <StressTest {...sharedProps} />;
      case 'security-privacy':  return <SecurityPrivacy {...sharedProps} />;
      case 'ado':               return <AzureDevOps {...sharedProps} />;
      case 'sprint-report':     return <SprintReport {...sharedProps} />;
      case 'runs':              return <Runs {...sharedProps} />;
      case 'settings':          return <Settings environment={environment} setEnvironment={setEnvironment} executionMode={executionMode} setExecutionMode={setExecutionMode} />;
      default:                  return <Dashboard {...sharedProps} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 via-rose-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-5xl">❤️‍🩹</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('redCrossWebQaModule.title')}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('redCrossWebQaModule.tagline')}
              </p>
            </div>
          </div>

          {/* Environment + Mode quick selectors */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{t('redCrossWebQaModule.common.environment')}:</span>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="local">{t('redCrossWebQaModule.common.envLocal')}</option>
                <option value="test">{t('redCrossWebQaModule.common.envTest')}</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{t('redCrossWebQaModule.modes.title')}:</span>
              <select
                value={executionMode}
                onChange={(e) => setExecutionMode(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="generate">{t('redCrossWebQaModule.modes.generateOnly')}</option>
                <option value="execute">{t('redCrossWebQaModule.modes.executeDirectly')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs (horizontally scrollable for 13 entries) */}
      <div className="bg-white shadow-sm">
        <div className="px-8 overflow-x-auto">
          <nav className="-mb-px flex space-x-6 whitespace-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default RedCrossWebQAAgent;
