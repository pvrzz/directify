// i18next setup. Only en/es/ja ship with real translations today; every
// other language falls back to English — the framework (and this file) is
// what lets community contributors add more without touching app code.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";
import ja from "./locales/ja.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ja", label: "日本語" },
];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    ja: { translation: ja },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
