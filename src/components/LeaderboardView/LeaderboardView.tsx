import { useState, useEffect } from 'react';
import { getEntries } from '../../engine/leaderboard';
import type { LeaderboardEntry } from '../../types';
import styles from './LeaderboardView.module.css';

interface LeaderboardViewProps {
  onClose: () => void;
  t: {
    leaderboardTitle: string;
    noScores: string;
    close: string;
  };
}

function formatTime(ms: number): string {
  return `${Math.round(ms / 1000)}s`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function LeaderboardView({ onClose, t }: LeaderboardViewProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t.leaderboardTitle}</h2>

        {entries.length === 0 ? (
          <p className={styles.empty}>{t.noScores}</p>
        ) : (
          <ol className={styles.list}>
            {entries.map((entry, index) => (
              <li key={entry.id} className={styles.entry}>
                <span className={styles.position}>#{index + 1}</span>
                <div className={styles.entryMain}>
                  <span className={styles.source}>{entry.sourceName}</span>
                  <span className={styles.date}>{formatDate(entry.playedAt)}</span>
                </div>
                <div className={styles.entryStats}>
                  <span className={styles.score}>{entry.totalScore} pts</span>
                  <span className={styles.correct}>{entry.correctAnswers}/7</span>
                  <span className={styles.time}>{formatTime(entry.totalTimeMs)}</span>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className={styles.actions}>
          <button className={styles.btnClose} onClick={onClose}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
