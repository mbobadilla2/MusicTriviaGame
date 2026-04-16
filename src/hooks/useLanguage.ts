/**
 * @file useLanguage.ts
 * @description React hook for managing the UI language preference (Spanish / English).
 *
 * ## Behavior
 *
 * On initialization, the language is determined in this priority order:
 * 1. Value stored in localStorage under `LANGUAGE_KEY`
 * 2. Browser language via `navigator.language` (uses Spanish if it starts with 'es')
 * 3. Fallback: `'es'` (Spanish)
 *
 * The selected language is persisted to localStorage so it survives page reloads.
 *
 * ## Note on translated content
 *
 * Only UI strings (labels, buttons, messages) are translated.
 * Artist names, song titles, and playlist names are always shown as-is
 * from the Deezer API, regardless of the selected language.
 */

import { useState, useCallback } from 'react';
import type { Language, Translations } from '../i18n/translations';
import { translations } from '../i18n/translations';

/** localStorage key used to persist the language preference */
const LANGUAGE_KEY = 'music-trivia-language';

/**
 * Reads the initial language from localStorage or the browser's language setting.
 * Falls back to Spanish ('es') if neither is available.
 */
function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === 'es' || stored === 'en') return stored;
    const lang = navigator.language.toLowerCase();
    return lang.startsWith('es') ? 'es' : 'en';
  } catch {
    return 'es';
  }
}

/**
 * Hook for reading and toggling the UI language.
 *
 * @returns Object containing:
 *   - `language`: current language code ('es' | 'en')
 *   - `toggleLanguage`: switches between Spanish and English
 *   - `t`: the full translations object for the current language
 */
export function useLanguage(): { language: Language; toggleLanguage: () => void; t: Translations } {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  /**
   * Toggles between 'es' and 'en' and persists the new value to localStorage.
   */
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
