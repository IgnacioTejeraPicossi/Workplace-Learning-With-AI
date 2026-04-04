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
        common: { ...enCommon, ...enRunTest, ...enAppChrome }
      },
      no: {
        common: { ...noCommon, ...noRunTest, ...noAppChrome }
      }
    }
  });

export default i18n;
