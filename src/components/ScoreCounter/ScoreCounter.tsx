import { useRef, useEffect, useState } from 'react';
import styles from './ScoreCounter.module.css';

interface ScoreCounterProps {
  score: number;
  streak?: number;
}

export function ScoreCounter({ score, streak = 0 }: ScoreCounterProps) {
  const prevScoreRef = useRef(score);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (score !== prevScoreRef.current) {
      prevScoreRef.current = score;
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [score]);

  return (
    <div className={styles.container}>
      <span className={`${styles.score}${animating ? ` ${styles.scoreAnimate}` : ''}`}>
        {score}
      </span>
      {streak >= 2 && (
        <span className={styles.streak}>🔥 Racha x{streak}</span>
      )}
    </div>
  );
}
