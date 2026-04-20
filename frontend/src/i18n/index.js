import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import noCommon from './locales/no/common.json';
import enRunTest from './locales/en/runTestModule.json';
import noRunTest from './locales/no/runTestModule.json';
import enAppChrome from './locales/en/appChrome.json';
import noAppChrome from './locales/no/appChrome.json';
import enMicroLesson from './locales/en/microLesson.json';
import noMicroLesson from './locales/no/microLesson.json';
import enScenarioSimulator from './locales/en/scenarioSimulator.json';
import noScenarioSimulator from './locales/no/scenarioSimulator.json';
import enSimulationResults from './locales/en/simulationResults.json';
import noSimulationResults from './locales/no/simulationResults.json';
import enTeamDynamics from './locales/en/teamDynamics.json';
import noTeamDynamics from './locales/no/teamDynamics.json';
import enCertificationsModule from './locales/en/certificationsModule.json';
import noCertificationsModule from './locales/no/certificationsModule.json';
import enCareerCoachModule from './locales/en/careerCoachModule.json';
import noCareerCoachModule from './locales/no/careerCoachModule.json';
import enSkillsForecastModule from './locales/en/skillsForecastModule.json';
import noSkillsForecastModule from './locales/no/skillsForecastModule.json';
import enBabelLibraryModule from './locales/en/babelLibraryModule.json';
import noBabelLibraryModule from './locales/no/babelLibraryModule.json';
import enKnowledgeMapModule from './locales/en/knowledgeMapModule.json';
import noKnowledgeMapModule from './locales/no/knowledgeMapModule.json';
import enRepoAnalyzerModule from './locales/en/repoAnalyzerModule.json';
import noRepoAnalyzerModule from './locales/no/repoAnalyzerModule.json';
import enAgentCursorModule from './locales/en/agentCursorModule.json';
import noAgentCursorModule from './locales/no/agentCursorModule.json';
import enAgenticRagModule from './locales/en/agenticRagModule.json';
import noAgenticRagModule from './locales/no/agenticRagModule.json';
import enLearningRepoModule from './locales/en/learningRepoModule.json';
import noLearningRepoModule from './locales/no/learningRepoModule.json';
import enDocumentAnalyzerModule from './locales/en/documentAnalyzerModule.json';
import noDocumentAnalyzerModule from './locales/no/documentAnalyzerModule.json';
import enLearningDocumentModule from './locales/en/learningDocumentModule.json';
import noLearningDocumentModule from './locales/no/learningDocumentModule.json';
import enAgenticRagDocumentModule from './locales/en/agenticRagDocumentModule.json';
import noAgenticRagDocumentModule from './locales/no/agenticRagDocumentModule.json';
import enEaSecondBrainModule from './locales/en/eaSecondBrainModule.json';
import noEaSecondBrainModule from './locales/no/eaSecondBrainModule.json';
import enSalesAssistantModule from './locales/en/salesAssistantModule.json';
import noSalesAssistantModule from './locales/no/salesAssistantModule.json';
import enPersonalAttentionAgentModule from './locales/en/personalAttentionAgentModule.json';
import noPersonalAttentionAgentModule from './locales/no/personalAttentionAgentModule.json';
import enTelcoOpsAgentModule from './locales/en/telcoOpsAgentModule.json';
import noTelcoOpsAgentModule from './locales/no/telcoOpsAgentModule.json';
import enGrcAgentModule from './locales/en/grcAgentModule.json';
import noGrcAgentModule from './locales/no/grcAgentModule.json';
import enCouncilAgentModule from './locales/en/councilAgentModule.json';
import noCouncilAgentModule from './locales/no/councilAgentModule.json';
import enOpsEfficiencyAgentModule from './locales/en/opsEfficiencyAgentModule.json';
import noOpsEfficiencyAgentModule from './locales/no/opsEfficiencyAgentModule.json';
import enAtmCopilotModule from './locales/en/atmCopilotModule.json';
import noAtmCopilotModule from './locales/no/atmCopilotModule.json';
import enApiConfigModule from './locales/en/apiConfigModule.json';
import noApiConfigModule from './locales/no/apiConfigModule.json';
import enFutureAppModule from './locales/en/futureAppModule.json';
import noFutureAppModule from './locales/no/futureAppModule.json';
import enIdeaLogModule from './locales/en/ideaLogModule.json';
import noIdeaLogModule from './locales/no/ideaLogModule.json';
import enFeatureRoadmapModule from './locales/en/featureRoadmapModule.json';
import noFeatureRoadmapModule from './locales/no/featureRoadmapModule.json';
import enCloudInstallModule from './locales/en/cloudInstallModule.json';
import noCloudInstallModule from './locales/no/cloudInstallModule.json';
import enAgiHubModule from './locales/en/agiHubModule.json';
import noAgiHubModule from './locales/no/agiHubModule.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'no'],
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { 
      escapeValue: false 
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    resources: {
      en: {
        common: { ...enCommon, ...enRunTest, ...enAppChrome, ...enMicroLesson, ...enScenarioSimulator, ...enSimulationResults, ...enTeamDynamics, ...enCertificationsModule, ...enCareerCoachModule, ...enSkillsForecastModule, ...enBabelLibraryModule, ...enKnowledgeMapModule, ...enRepoAnalyzerModule, ...enAgentCursorModule, ...enAgenticRagModule, ...enLearningRepoModule, ...enDocumentAnalyzerModule, ...enLearningDocumentModule, ...enAgenticRagDocumentModule, ...enEaSecondBrainModule, ...enSalesAssistantModule, ...enPersonalAttentionAgentModule, ...enTelcoOpsAgentModule, ...enGrcAgentModule, ...enCouncilAgentModule, ...enOpsEfficiencyAgentModule, ...enAtmCopilotModule, ...enApiConfigModule, ...enFutureAppModule, ...enIdeaLogModule, ...enFeatureRoadmapModule, ...enCloudInstallModule, ...enAgiHubModule }
      },
      no: {
        common: { ...noCommon, ...noRunTest, ...noAppChrome, ...noMicroLesson, ...noScenarioSimulator, ...noSimulationResults, ...noTeamDynamics, ...noCertificationsModule, ...noCareerCoachModule, ...noSkillsForecastModule, ...noBabelLibraryModule, ...noKnowledgeMapModule, ...noRepoAnalyzerModule, ...noAgentCursorModule, ...noAgenticRagModule, ...noLearningRepoModule, ...noDocumentAnalyzerModule, ...noLearningDocumentModule, ...noAgenticRagDocumentModule, ...noEaSecondBrainModule, ...noSalesAssistantModule, ...noPersonalAttentionAgentModule, ...noTelcoOpsAgentModule, ...noGrcAgentModule, ...noCouncilAgentModule, ...noOpsEfficiencyAgentModule, ...noAtmCopilotModule, ...noApiConfigModule, ...noFutureAppModule, ...noIdeaLogModule, ...noFeatureRoadmapModule, ...noCloudInstallModule, ...noAgiHubModule }
      }
    }
  });

export default i18n;
