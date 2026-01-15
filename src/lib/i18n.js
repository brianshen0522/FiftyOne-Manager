/**
 * 輕量級 i18n 模組
 * 支援 React 和 vanilla JS 共用翻譯
 */

const STORAGE_KEY = 'app_language';
const DEFAULT_LANG = 'zh-TW';
const SUPPORTED_LANGS = ['zh-TW', 'en'];

let currentLang = DEFAULT_LANG;
let translations = {};
let listeners = [];

/**
 * 初始化 i18n 系統
 * @returns {Promise<void>}
 */
export async function initI18n() {
  // 從 localStorage 讀取語言設定
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      currentLang = saved;
    }
  }

  // 載入翻譯檔案
  await loadTranslations(currentLang);

  // 更新 HTML lang 屬性
  updateHtmlLang();
}

/**
 * 載入指定語言的翻譯檔案
 * @param {string} lang
 */
async function loadTranslations(lang) {
  try {
    const module = await import(`@/locales/${lang}.json`);
    translations = module.default || module;
  } catch (error) {
    console.error(`Failed to load translations for ${lang}:`, error);
    // 如果載入失敗且不是預設語言，嘗試載入預設語言
    if (lang !== DEFAULT_LANG) {
      await loadTranslations(DEFAULT_LANG);
    }
  }
}

/**
 * 更新 HTML lang 屬性
 */
function updateHtmlLang() {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = currentLang === 'zh-TW' ? 'zh-Hant-TW' : 'en';
  }
}

/**
 * 取得翻譯文字
 * @param {string} key - 翻譯鍵值，支援巢狀結構如 "manager.title"
 * @param {object} params - 替換參數，如 { count: 5 } 會替換 {count}
 * @returns {string}
 */
export function t(key, params = {}) {
  const keys = key.split('.');
  let value = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // 找不到翻譯，返回 key 本身
      console.warn(`Translation missing: ${key}`);
      return key;
    }
  }

  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string: ${key}`);
    return key;
  }

  // 替換參數
  let result = value;
  for (const [paramKey, paramValue] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
  }

  return result;
}

/**
 * 取得當前語言
 * @returns {string}
 */
export function getCurrentLang() {
  return currentLang;
}

/**
 * 取得支援的語言列表
 * @returns {string[]}
 */
export function getSupportedLangs() {
  return [...SUPPORTED_LANGS];
}

/**
 * 切換語言
 * @param {string} lang
 * @returns {Promise<void>}
 */
export async function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) {
    console.error(`Unsupported language: ${lang}`);
    return;
  }

  if (lang === currentLang) {
    return;
  }

  currentLang = lang;

  // 儲存到 localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
  }

  // 載入新語言的翻譯
  await loadTranslations(lang);

  // 更新 HTML lang 屬性
  updateHtmlLang();

  // 通知所有監聽者
  notifyListeners();
}

/**
 * 註冊語言變更監聽器
 * @param {function} callback
 * @returns {function} 取消註冊的函數
 */
export function onLanguageChange(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

/**
 * 通知所有監聽者語言已變更
 */
function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener(currentLang);
    } catch (error) {
      console.error('Error in language change listener:', error);
    }
  }
}

/**
 * 檢查是否為繁體中文
 * @returns {boolean}
 */
export function isZhTW() {
  return currentLang === 'zh-TW';
}

/**
 * 語言顯示名稱對應
 */
export const LANG_NAMES = {
  'zh-TW': '繁中',
  'en': 'EN'
};
