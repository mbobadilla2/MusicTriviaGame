import { useEffect, useRef, useCallback } from 'react';
import type { Question } from '../../types';
import type { Theme } from '../../hooks/useTheme';
import { QUESTION_DURATION_MS } from '../../engine/gameEngine';
import { AudioPlayer } from '../../audio/audioPlayer';
import * as soundFX from '../../audio/soundFX';
import { useTimer } from '../../hooks/useTimer';
import { TimerBar } from '../TimerBar/TimerBar';
import { ScoreCounter } from '../ScoreCounter/ScoreCounter';
import { QuestionCard } from '../QuestionCard/QuestionCard';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import type { FeedbackState } from '../QuestionCard/QuestionCard';
import styles from './GameScreen.module.css';

interface GameScreenProps {
  questions: Question[];
  currentIndex: number;
  score: number;
  streak: number;
  phase: 'question-active' | 'question-feedback';
  feedbackState: FeedbackState;
  selectedIndex: number | null;
  onAnswer: (selectedIndex: number | null, timeMs: number) => void;
  onNext: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function GameScreen({
  questions,
  currentIndex,
  score,
  streak,
  phase,
  feedbackState,
  selectedIndex,
  onAnswer,
  onNext,
  theme,
  onToggleTheme,
}: GameScreenProps) {
  const question = questions[currentIndex];

  // Guard: if question is undefined (transitioning to results), render nothing
  if (!question) return null;

  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answeredRef = useRef(false);

  const handleExpire = useCallback(() => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    AudioPlayer.pause();
    onAnswer(null, QUESTION_DURATION_MS);
  }, [onAnswer]);

  const { timeMs, stop, resetAndStart } = useTimer(QUESTION_DURATION_MS, handleExpire);

  // When a new question-active phase starts, reset+start timer and play audio
  useEffect(() => {
    if (phase !== 'question-active') return;

    answeredRef.current = false;

    if (question.audioBlob && question.audioBlob.size > 0) {
      AudioPlayer.play(question.audioBlob);
    }
    resetAndStart();

    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, phase]);

  // Handle feedback phase: play sound effect and auto-advance
  useEffect(() => {
    if (phase !== 'question-feedback') return;

    // Play sound effect based on feedback
    if (feedbackState === 'correct') {
      soundFX.playCorrect();
    } else if (feedbackState === 'wrong') {
      soundFX.playWrong();
    } else if (feedbackState === 'timeout') {
      soundFX.playTimeout();
    }

    // Auto-advance after 2 seconds
    autoAdvanceRef.current = setTimeout(() => {
      onNext();
    }, 2000);

    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    };
  }, [phase, feedbackState, onNext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      AudioPlayer.pause();
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  const handleAnswer = useCallback(
    (index: number) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      stop();
      AudioPlayer.pause();
      navigator.vibrate?.(50);
      onAnswer(index, QUESTION_DURATION_MS - timeMs);
    },
    [stop, timeMs, onAnswer],
  );

  const handleNext = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    onNext();
  }, [onNext]);

  const isDisabled = phase === 'question-feedback' || answeredRef.current;

  return (
    <div className={`${styles.screen} ${phase === 'question-feedback' ? styles.fadeIn : ''}`}>
      <TimerBar timeMs={timeMs} maxTimeMs={QUESTION_DURATION_MS} />

      <div className={styles.header}>
        <span className={styles.questionCount}>
          Pregunta {currentIndex + 1} / {questions.length}
        </span>
        <div className={styles.headerRight}>
          <ScoreCounter score={score} streak={streak} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} inline />
        </div>
      </div>

      <div className={styles.cardWrapper}>
        <QuestionCard
          question={question}
          onAnswer={handleAnswer}
          feedbackState={feedbackState}
          selectedIndex={selectedIndex}
          disabled={isDisabled}
        />
      </div>

      {phase === 'question-feedback' && (
        <div className={styles.nextWrapper}>
          <button className={styles.nextButton} onClick={handleNext}>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
