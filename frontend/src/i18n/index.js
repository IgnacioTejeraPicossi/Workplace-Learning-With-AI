import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import noCommon from './locales/no/common.json';
import esCommon from './locales/es/common.json';
import enRunTest from './locales/en/runTestModule.json';
import noRunTest from './locales/no/runTestModule.json';
import enAppChrome from './locales/en/appChrome.json';
import noAppChrome from './locales/no/appChrome.json';
import esAppChrome from './locales/es/appChrome.json';
import esMicroLesson from './locales/es/microLesson.json';
import esScenarioSimulator from './locales/es/scenarioSimulator.json';
import esSimulationResults from './locales/es/simulationResults.json';
import esTeamDynamics from './locales/es/teamDynamics.json';
import esCertificationsModule from './locales/es/certificationsModule.json';
import esCareerCoachModule from './locales/es/careerCoachModule.json';
import esSkillsForecastModule from './locales/es/skillsForecastModule.json';
import esKnowledgeMapModule from './locales/es/knowledgeMapModule.json';
import esBabelLibraryModule from './locales/es/babelLibraryModule.json';
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
import enRedCrossWebQaModule from './locales/en/redCrossWebQaModule.json';
import noRedCrossWebQaModule from './locales/no/redCrossWebQaModule.json';
import esRedCrossWebQaModule from './locales/es/redCrossWebQaModule.json';
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
import enWebSearchModule from './locales/en/webSearchModule.json';
import noWebSearchModule from './locales/no/webSearchModule.json';
import esWebSearchModule from './locales/es/webSearchModule.json';
import esRepoAnalyzerModule from './locales/es/repoAnalyzerModule.json';
import esAgentCursorModule from './locales/es/agentCursorModule.json';
import esLearningRepoModule from './locales/es/learningRepoModule.json';
import esDocumentAnalyzerModule from './locales/es/documentAnalyzerModule.json';
import esLearningDocumentModule from './locales/es/learningDocumentModule.json';
import esAgenticRagDocumentModule from './locales/es/agenticRagDocumentModule.json';
import esEaSecondBrainModule from './locales/es/eaSecondBrainModule.json';
import esSalesAssistantModule from './locales/es/salesAssistantModule.json';
import esPersonalAttentionAgentModule from './locales/es/personalAttentionAgentModule.json';
import esAgiHubModule from './locales/es/agiHubModule.json';
import esCloudInstallModule from './locales/es/cloudInstallModule.json';
import esFutureAppModule from './locales/es/futureAppModule.json';
import esIdeaLogModule from './locales/es/ideaLogModule.json';
import esFeatureRoadmapModule from './locales/es/featureRoadmapModule.json';
import esApiConfigModule from './locales/es/apiConfigModule.json';
import esRunTestModule from './locales/es/runTestModule.json';
import esRobomindClinicModule from './locales/es/robomindClinicModule.json';
import esAtmCopilotModule from './locales/es/atmCopilotModule.json';
import esTelcoOpsAgentModule from './locales/es/telcoOpsAgentModule.json';
import enEnterpriseArchitectureModule from './locales/en/enterpriseArchitectureModule.json';
import noEnterpriseArchitectureModule from './locales/no/enterpriseArchitectureModule.json';
import esEnterpriseArchitectureModule from './locales/es/enterpriseArchitectureModule.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'no', 'es'],
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
        common: { ...enCommon, ...enRunTest, ...enAppChrome, ...enMicroLesson, ...enScenarioSimulator, ...enSimulationResults, ...enTeamDynamics, ...enCertificationsModule, ...enCareerCoachModule, ...enSkillsForecastModule, ...enBabelLibraryModule, ...enKnowledgeMapModule, ...enRepoAnalyzerModule, ...enAgentCursorModule, ...enAgenticRagModule, ...enLearningRepoModule, ...enDocumentAnalyzerModule, ...enLearningDocumentModule, ...enAgenticRagDocumentModule, ...enEaSecondBrainModule, ...enSalesAssistantModule, ...enPersonalAttentionAgentModule, ...enTelcoOpsAgentModule, ...enGrcAgentModule, ...enCouncilAgentModule, ...enOpsEfficiencyAgentModule, ...enAtmCopilotModule, ...enRedCrossWebQaModule, ...enApiConfigModule, ...enFutureAppModule, ...enIdeaLogModule, ...enFeatureRoadmapModule, ...enCloudInstallModule, ...enAgiHubModule, ...enWebSearchModule, ...enEnterpriseArchitectureModule }
      },
      no: {
        common: { ...noCommon, ...noRunTest, ...noAppChrome, ...noMicroLesson, ...noScenarioSimulator, ...noSimulationResults, ...noTeamDynamics, ...noCertificationsModule, ...noCareerCoachModule, ...noSkillsForecastModule, ...noBabelLibraryModule, ...noKnowledgeMapModule, ...noRepoAnalyzerModule, ...noAgentCursorModule, ...noAgenticRagModule, ...noLearningRepoModule, ...noDocumentAnalyzerModule, ...noLearningDocumentModule, ...noAgenticRagDocumentModule, ...noEaSecondBrainModule, ...noSalesAssistantModule, ...noPersonalAttentionAgentModule, ...noTelcoOpsAgentModule, ...noGrcAgentModule, ...noCouncilAgentModule, ...noOpsEfficiencyAgentModule, ...noAtmCopilotModule, ...noRedCrossWebQaModule, ...noApiConfigModule, ...noFutureAppModule, ...noIdeaLogModule, ...noFeatureRoadmapModule, ...noCloudInstallModule, ...noAgiHubModule, ...noWebSearchModule, ...noEnterpriseArchitectureModule }
      },
      es: {
        common: { ...esCommon, ...esAppChrome, ...esMicroLesson, ...esScenarioSimulator, ...esSimulationResults, ...esTeamDynamics, ...esCertificationsModule, ...esCareerCoachModule, ...esSkillsForecastModule, ...esKnowledgeMapModule, ...esBabelLibraryModule, ...esWebSearchModule, ...esRepoAnalyzerModule, ...esAgentCursorModule, ...esLearningRepoModule, ...esDocumentAnalyzerModule, ...esLearningDocumentModule, ...esAgenticRagDocumentModule, ...esEaSecondBrainModule, ...esSalesAssistantModule, ...esPersonalAttentionAgentModule, ...esTelcoOpsAgentModule, ...esAgiHubModule, ...esCloudInstallModule, ...esFutureAppModule, ...esIdeaLogModule, ...esFeatureRoadmapModule, ...esApiConfigModule, ...esRunTestModule, ...esRobomindClinicModule, ...esAtmCopilotModule, ...esRedCrossWebQaModule, ...esEnterpriseArchitectureModule }
      }
    }
  });

export default i18n;
