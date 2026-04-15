import { useEffect, useRef, useCallback } from 'react';
import type { Question } from '../../types';
import { QUESTION_DURATION_MS } from '../../engine/gameEngine';
import { AudioPlayer } from '../../audio/audioPlayer';
import * as soundFX from '../../audio/soundFX';
import { useTimer } from '../../hooks/useTimer';
import { TimerBar } from '../TimerBar/TimerBar';
import { ScoreCounter } from '../ScoreCounter/ScoreCounter';
import { QuestionCard } from '../QuestionCard/QuestionCard';
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
  t: { question: string; of: string; next: string; streak: string; timeout: string; };
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
  t,
}: GameScreenProps) {
  const question = questions[currentIndex];

  // Guard: if question is undefined (transitioning to results), render nothing
  if (!question) return null;

  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answeredRef = useRef(false);
  const focusTrapRef = useRef<HTMLDivElement>(null);

  const handleExpire = useCallback(() => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    AudioPlayer.pause();
    onAnswer(null, QUESTION_DURATION_MS);
  }, [onAnswer]);

  const { timeMs, stop, resetAndStart } = useTimer(QUESTION_DURATION_MS, handleExpire);

  // When a new question-active phase starts, reset+start timer and play audio.
  // We depend only on currentIndex so this fires exactly once per new question,
  // regardless of how many times React re-runs effects (StrictMode / iOS Safari).
  useEffect(() => {
    answeredRef.current = false;
    // Move focus to the invisible trap element so no option button retains focus
    focusTrapRef.current?.focus();
    resetAndStart();
    if (question.audioBlob && question.audioBlob.size > 0) {
      AudioPlayer.play(question.audioBlob);
    }
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

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
          {t.question} {currentIndex + 1} {t.of} {questions.length}
        </span>
        <div className={styles.headerRight}>
          <ScoreCounter score={score} streak={streak} streakLabel={t.streak} />
        </div>
      </div>

      <div className={styles.cardWrapper}>
        {/* Invisible focus trap — receives focus on each new question so no
            option button retains focus from the previous answer on mobile */}
        <div
          ref={focusTrapRef}
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}
        />
        <QuestionCard
          question={question}
          onAnswer={handleAnswer}
          feedbackState={feedbackState}
          selectedIndex={selectedIndex}
          disabled={isDisabled}
          timeoutLabel={t.timeout}
        />
      </div>

      {phase === 'question-feedback' && (
        <div className={styles.nextWrapper}>
          <button className={styles.nextButton} onClick={handleNext}>
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
}
