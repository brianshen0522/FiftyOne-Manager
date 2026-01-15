"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initI18n, t as translate, getCurrentLang, setLanguage, onLanguageChange } from '@/lib/i18n';

const LanguageContext = createContext({
  lang: 'zh-TW',
  t: (key) => key,
  setLang: () => {},
  isReady: false,
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('zh-TW');
  const [isReady, setIsReady] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    initI18n().then(() => {
      setLang(getCurrentLang());
      setIsReady(true);
    });

    const unsubscribe = onLanguageChange((newLang) => {
      setLang(newLang);
      forceUpdate(n => n + 1);
    });

    return unsubscribe;
  }, []);

  const handleSetLang = useCallback(async (newLang) => {
    await setLanguage(newLang);
  }, []);

  const t = useCallback((key, params) => {
    return translate(key, params);
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LanguageContext.Provider value={{ lang, t, setLang: handleSetLang, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useTranslation() {
  const { t, lang, isReady } = useContext(LanguageContext);
  return { t, lang, isReady };
}
