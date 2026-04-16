/**
 * @file useTheme.ts
 * @description React hook for managing the light/dark theme preference.
 *
 * ## Behavior
 *
 * On initialization, the theme is determined in this priority order:
 * 1. Value stored in localStorage under `THEME_KEY`
 * 2. System preference via `prefers-color-scheme` media query
 * 3. Fallback: `'light'`
 *
 * When the theme changes, the `dark` CSS class is added to or removed from
 * `document.documentElement`. This class is used by the CSS variables in
 * `globals.css` to switch between light and dark color palettes.
 *
 * The selected theme is persisted to localStorage so it survives page reloads.
 */

import { useState, useEffect } from 'react';

/** localStorage key used to persist the theme preference */
export const THEME_KEY = 'music-trivia-theme';

/** Available theme values */
export type Theme = 'light' | 'dark';

/**
 * Reads the initial theme from localStorage or the system preference.
 * Falls back to 'light' if neither is available.
 */
function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // localStorage not available
  }

  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Applies the theme by toggling the `dark` class on `<html>`.
 * CSS variables in globals.css use `html.dark { ... }` to switch palettes.
 */
function applyTheme(theme: Theme): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Hook for reading and toggling the app theme.
 *
 * @returns `{ theme, toggleTheme }` where `theme` is the current value
 *          and `toggleTheme` switches between 'light' and 'dark'.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = getInitialTheme();
    applyTheme(initial); // apply immediately to avoid flash of wrong theme
    return initial;
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // localStorage not available — degrade gracefully
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}
