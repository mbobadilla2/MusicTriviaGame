import { useEffect, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { QuestionResult, TriviaSource } from '../../types';
import { addEntry, getEntries, saveEntries, isHighScore } from '../../engine/leaderboard';
import { playHighScore, playGameEnd } from '../../audio/soundFX';
import { AudioPlayer } from '../../audio/audioPlayer';
import styles from './ResultsScreen.module.css';

interface ResultsScreenProps {
  results: QuestionResult[];
  totalScore: number;
  source: TriviaSource;
  onPlayAgain: () => void;
  onChangeSource: () => void;
  t: {
    results: string;
    points: string;
    correct: string;
    timeout: string;
    playAgain: string;
    backToHome: string;
  };
}

export function ResultsScreen({
  results,
  totalScore,
  source,
  onPlayAgain,
  onChangeSource,
  t,
}: ResultsScreenProps) {
  const correctAnswers = results.filter((r) => r.isCorrect).length;
  const totalTimeMs = results.reduce((sum, r) => sum + r.timeMs, 0);
  const savedRef = useRef(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // Stop audio when leaving results screen
  useEffect(() => {
    return () => { AudioPlayer.stop(); };
  }, []);

  const handleAlbumClick = useCallback((index: number, audioBlob: Blob) => {
    if (playingIndex === index) {
      AudioPlayer.pause();
      setPlayingIndex(null);
    } else {
      AudioPlayer.play(audioBlob, () => setPlayingIndex(null));
      setPlayingIndex(index);
    }
  }, [playingIndex]);

  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    try {
      const entries = getEntries();
      // crypto.randomUUID() requires HTTPS — use fallback for HTTP (local dev)
      const id = typeof crypto?.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newEntry = {
        id,
        sourceName: source.name,
        sourceType: source.type,
        sourceImageUrl: source.imageUrl,
        totalScore,
        correctAnswers,
        totalTimeMs,
        playedAt: Date.now(),
      };
      const updated = addEntry(entries, newEntry);
      saveEntries(updated);

      if (isHighScore(entries, totalScore)) {
        playHighScore();
      } else {
        playGameEnd();
      }
    } catch (e) {
      console.error('[ResultsScreen] Error saving entry:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return mins > 0 ? `${mins}m ${remaining}s` : `${remaining}s`;
  };

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.results}</h1>
        <p className={styles.sourceName}>{source.name}</p>
        <div className={styles.scoreBlock}>
          <span className={styles.totalScore}>{totalScore}</span>
          <span className={styles.scoreLabel}>{t.points}</span>
        </div>
        <div className={styles.stats}>
          <span className={styles.correctCount}>
            {correctAnswers} / 7 {t.correct}
          </span>
          <span className={styles.timeTotal}>{formatTime(totalTimeMs)}</span>
        </div>
      </div>

      <ul className={styles.songList} aria-label="Lista de canciones">
        {results.map((result, index) => {
          const correctName = result.question.track.name;
          const isTimeout = result.selectedIndex === null && !result.isCorrect;
          const chosenName =
            result.selectedIndex !== null
              ? result.question.options[result.selectedIndex]
              : null;

          // Build the detail line — only for incorrect answers
          let detailContent: ReactNode = null;
          if (!result.isCorrect) {
            if (isTimeout) {
              detailContent = (
                <span className={styles.timeout}>{t.timeout}</span>
              );
            } else {
              detailContent = (
                <span className={styles.chosen}>{chosenName}</span>
              );
            }
          }

          return (
            <li
              key={index}
              className={`${styles.songItem} ${result.isCorrect ? styles.correct : styles.incorrect}`}
            >
              {result.question.track.albumImageUrl ? (
                <button
                  className={styles.albumBtn}
                  onClick={() => handleAlbumClick(index, result.question.audioBlob)}
                  aria-label={playingIndex === index ? 'Pausar' : 'Reproducir'}
                >
                  <img
                    src={result.question.track.albumImageUrl}
                    alt=""
                    className={styles.albumThumb}
                    draggable={false}
                  />
                  <span className={`${styles.albumOverlay} ${playingIndex === index ? styles.playing : ''}`}>
                    {/* Circular progress ring — CSS animation runs for 30s (Deezer preview length) */}
                    <svg className={styles.progressRing} viewBox="0 0 64 64" aria-hidden="true">
                      <circle className={styles.progressTrack} cx="32" cy="32" r="28" />
                      <circle
                        className={`${styles.progressArc} ${playingIndex === index ? styles.progressArcActive : ''}`}
                        cx="32" cy="32" r="28"
                      />
                    </svg>
                    <span className={styles.playIcon}>
                      {playingIndex === index ? '𑫨' : '▶'}
                      {/* {playingIndex === index ? '⏸' : '▶'} */}
                    </span>
                  </span>
                </button>
              ) : (
                <span className={styles.indicator}>
                  {result.isCorrect ? '✅' : '❌'}
                </span>
              )}
              <div className={styles.songInfo}>
                <span className={styles.songName}>{correctName}</span>
                {detailContent && (
                  <span className={styles.songDetail}>{detailContent}</span>
                )}
              </div>
              {result.question.track.albumImageUrl && (
                <span className={styles.indicatorRight}>
                  {result.isCorrect ? '✅' : '❌'}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={onPlayAgain}>
          {t.playAgain}
        </button>
        <button className={styles.btnSecondary} onClick={onChangeSource}>
          {t.backToHome}
        </button>
      </div>
    </div>
  );
}
