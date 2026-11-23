import React, { createContext, useContext, useState } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Load initial locale from LocalStorage, fallback to 'en'
  const [locale, setLocale] = useState(() => {
    const saved = localStorage.getItem('language');
    if (saved && translations[saved]) {
      return saved;
    }
    return 'en';
  });

  const changeLanguage = (newLocale) => {
    if (translations[newLocale]) {
      setLocale(newLocale);
      localStorage.setItem('language', newLocale);
    }
  };

  const t = (key) => {
    const localeDict = translations[locale] || translations['en'];
    const val = localeDict[key] || (translations['en'] && translations['en'][key]);
    return val !== undefined ? val : key;
  };

  return (
    <LanguageContext.Provider value={{ locale, t, changeLanguage, availableLanguages: ['en', 'ta', 'hi', 'te'] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

