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
        common: { ...enCommon, ...enRunTest, ...enAppChrome, ...enMicroLesson, ...enScenarioSimulator, ...enSimulationResults, ...enTeamDynamics, ...enCertificationsModule, ...enCareerCoachModule, ...enSkillsForecastModule, ...enBabelLibraryModule, ...enKnowledgeMapModule, ...enRepoAnalyzerModule, ...enAgentCursorModule, ...enAgenticRagModule, ...enLearningRepoModule, ...enDocumentAnalyzerModule, ...enLearningDocumentModule, ...enAgenticRagDocumentModule, ...enEaSecondBrainModule, ...enSalesAssistantModule }
      },
      no: {
        common: { ...noCommon, ...noRunTest, ...noAppChrome, ...noMicroLesson, ...noScenarioSimulator, ...noSimulationResults, ...noTeamDynamics, ...noCertificationsModule, ...noCareerCoachModule, ...noSkillsForecastModule, ...noBabelLibraryModule, ...noKnowledgeMapModule, ...noRepoAnalyzerModule, ...noAgentCursorModule, ...noAgenticRagModule, ...noLearningRepoModule, ...noDocumentAnalyzerModule, ...noLearningDocumentModule, ...noAgenticRagDocumentModule, ...noEaSecondBrainModule, ...noSalesAssistantModule }
      }
    }
  });

export default i18n;
