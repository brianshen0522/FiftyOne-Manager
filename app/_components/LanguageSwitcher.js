"use client";

import { useLanguage } from './LanguageProvider';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher() {
  const { lang, setLang, isReady } = useLanguage();

  if (!isReady) {
    return null;
  }

  const toggleLanguage = () => {
    const newLang = lang === 'zh-TW' ? 'en' : 'zh-TW';
    setLang(newLang);
  };

  return (
    <button
      className={styles.switcher}
      onClick={toggleLanguage}
      title={lang === 'zh-TW' ? 'Switch to English' : '切換為繁體中文'}
      aria-label={lang === 'zh-TW' ? 'Switch to English' : '切換為繁體中文'}
    >
      <span className={lang === 'zh-TW' ? styles.active : styles.inactive}>繁中</span>
      <span className={styles.separator}>/</span>
      <span className={lang === 'en' ? styles.active : styles.inactive}>EN</span>
    </button>
  );
}
