import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import viVN from './locales/vi-VN.json';
import enUS from './locales/en-US.json';

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: viVN },
    en: { translation: enUS },
  },
  lng: 'vi', // Default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
