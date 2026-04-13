import { useState, useEffect } from 'react';
import { getEntries, clearEntries } from '../../engine/leaderboard';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import type { LeaderboardEntry } from '../../types';
import styles from './LeaderboardView.module.css';

interface LeaderboardViewProps {
  onClose: () => void;
}

function formatTime(ms: number): string {
  return `${Math.round(ms / 1000)}s`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function LeaderboardView({ onClose }: LeaderboardViewProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  function handleClearConfirm() {
    clearEntries();
    setEntries([]);
    setShowConfirm(false);
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <h2 className={styles.title}>🏆 Puntuaciones</h2>

        {entries.length === 0 ? (
          <p className={styles.empty}>Aún no hay puntuaciones registradas</p>
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
          <button className={styles.btnClear} onClick={() => setShowConfirm(true)}>
            Borrar
          </button>
          <button className={styles.btnClose} onClick={onClose}>
            Cerrar
          </button>
        </div>

        <ConfirmDialog
          isOpen={showConfirm}
          title="Borrar puntuaciones"
          message="¿Seguro que quieres borrar todas las puntuaciones? Esta acción no se puede deshacer."
          onConfirm={handleClearConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
    </div>
  );
}
