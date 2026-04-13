import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
  inline?: boolean;
}

export function ThemeToggle({ theme, onToggle, inline = false }: ThemeToggleProps) {
  return (
    <button
      className={inline ? styles.buttonInline : styles.button}
      onClick={onToggle}
      aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
