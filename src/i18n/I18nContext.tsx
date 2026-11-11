// ============================================================================
// I18n Context & Provider (English & Urdu RTL/LTR)
// ============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from './en.json';
import urTranslations from './ur.json';

export type Language = 'en' | 'ur';

interface I18nContextType {
  language: Language;
  direction: 'ltr' | 'rtl';
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const dictionaries = {
  en: enTranslations,
  ur: urTranslations,
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('qistflow_lang');
    return saved === 'ur' ? 'ur' : 'en';
  });

  const direction = language === 'ur' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('qistflow_lang', language);
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', direction);
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ur' : 'en'));
  };

  const t = (keyPath: string, fallback?: string): string => {
    const dict = dictionaries[language] as any;
    const parts = keyPath.split('.');
    let current: any = dict;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Fallback to English dictionary if missing in current language
        let fallbackVal: any = (dictionaries['en'] as any);
        for (const fPart of parts) {
          if (fallbackVal && typeof fallbackVal === 'object' && fPart in fallbackVal) {
            fallbackVal = fallbackVal[fPart];
          } else {
            fallbackVal = undefined;
            break;
          }
        }
        return typeof fallbackVal === 'string' ? fallbackVal : fallback || keyPath;
      }
    }

    return typeof current === 'string' ? current : fallback || keyPath;
  };

  return (
    <I18nContext.Provider value={{ language, direction, setLanguage, toggleLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
