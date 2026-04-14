import { useState, useCallback } from 'react';
import type { Language, Translations } from '../i18n/translations';
import { translations } from '../i18n/translations';

const LANGUAGE_KEY = 'music-trivia-language';

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === 'es' || stored === 'en') return stored;
    // Detect browser language
    const lang = navigator.language.toLowerCase();
    return lang.startsWith('es') ? 'es' : 'en';
  } catch {
    return 'es';
  }
}

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next: Language = prev === 'es' ? 'en' : 'es';
      try { localStorage.setItem(LANGUAGE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const t: Translations = translations[language];

  return { language, toggleLanguage, t };
}
