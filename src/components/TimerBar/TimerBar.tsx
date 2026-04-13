import styles from './TimerBar.module.css';

interface TimerBarProps {
  timeMs: number;
  maxTimeMs: number;
}

function getBarColor(timeMs: number, maxTimeMs: number): string {
  const ratio = Math.max(0, timeMs / maxTimeMs);
  // Interpolate hue: 120 (green) → 0 (red)
  const hue = Math.round(ratio * 120);
  return `hsl(${hue}, 70%, 45%)`;
}

export function TimerBar({ timeMs, maxTimeMs }: TimerBarProps) {
  const widthPct = Math.max(0, (timeMs / maxTimeMs) * 100);
  const isUrgent = timeMs <= 3000 && timeMs > 0;
  const color = getBarColor(timeMs, maxTimeMs);

  return (
    <div className={styles.container}>
      <div
        className={`${styles.bar}${isUrgent ? ` ${styles.urgent}` : ''}`}
        style={{ width: `${widthPct}%`, backgroundColor: color }}
        role="progressbar"
        aria-valuenow={timeMs}
        aria-valuemin={0}
        aria-valuemax={maxTimeMs}
      />
    </div>
  );
}
