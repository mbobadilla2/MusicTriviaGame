import { useEffect, useRef } from 'react';
import type { Theme } from '../../hooks/useTheme';
import type { Language } from '../../i18n/translations';
import { clearEntries } from '../../engine/leaderboard';
import styles from './SettingsMenu.module.css';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onScoresCleared: () => void;
  t: {
    settings: string;
    darkMode: string;
    language: string;
    resetScores: string;
    deleteConfirmMessage: string;
    close: string;
  };
}

export function SettingsMenu({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
  onScoresCleared,
  t,
}: SettingsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleDeleteScores() {
    if (window.confirm(t.deleteConfirmMessage)) {
      clearEntries();
      onScoresCleared();
      onClose();
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.menu} ref={menuRef} role="dialog" aria-label={t.settings}>
        <h3 className={styles.title}>{t.settings}</h3>

        {/* Theme toggle — always labeled "Modo oscuro" / "Dark mode", ON when dark */}
        <button className={styles.row} onClick={onToggleTheme}>
          <span className={styles.rowIcon}>🌙</span>
          <span className={styles.rowLabel}>{t.darkMode}</span>
          <span className={styles.rowValue}>{theme === 'dark' ? 'ON' : 'OFF'}</span>
        </button>

        {/* Language toggle — flag emojis */}
        <button className={styles.row} onClick={onToggleLanguage}>
          <span className={styles.rowIcon}>🌐</span>
          <span className={styles.rowLabel}>{t.language}</span>
          <span className={styles.rowValue}>{language === 'es' ? '🇲🇽' : '🇬🇧'}</span>
        </button>

        {/* Reset scores */}
        <button className={`${styles.row} ${styles.rowDanger}`} onClick={handleDeleteScores}>
          <span className={styles.rowIcon}>🗑️</span>
          <span className={styles.rowLabel}>{t.resetScores}</span>
        </button>

        <button className={styles.closeBtn} onClick={onClose}>
          {t.close}
        </button>
      </div>
    </div>
  );
}
