import { useState, useCallback } from 'react';
import type { GamePhase, TriviaSource, Question, QuestionResult } from '../types';
import { recordAnswer } from '../engine/gameEngine';
import type { TriviaSession } from '../types';

interface GameSessionState {
  phase: GamePhase;
  selectedSource: TriviaSource | null;
  questions: Question[];
  currentQuestionIndex: number;
  results: QuestionResult[];
  totalScore: number;
  streak: number;
}

const INITIAL_STATE: GameSessionState = {
  phase: 'source-selection',
  selectedSource: null,
  questions: [],
  currentQuestionIndex: 0,
  results: [],
  totalScore: 0,
  streak: 0,
};

export function useGameSession() {
  const [state, setState] = useState<GameSessionState>(INITIAL_STATE);

  const selectSource = useCallback((source: TriviaSource) => {
    setState((prev) => ({ ...prev, selectedSource: source, phase: 'preloading' }));
  }, []);

  const startGame = useCallback((questions: Question[]) => {
    setState((prev) => ({ ...prev, questions, phase: 'ready' }));
  }, []);

  const beginPlaying = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'question-active' }));
  }, []);

  // Combines startGame + beginPlaying in a single state update
  const startAndPlay = useCallback((questions: Question[]) => {
    setState((prev) => ({ ...prev, questions, phase: 'question-active' }));
  }, []);

  const submitAnswer = useCallback(
    (selectedIndex: number | null, timeMs: number) => {
      setState((prev) => {
        if (!prev.selectedSource) return prev;

        // Build a minimal session snapshot to pass to recordAnswer
        const session: TriviaSession = {
          source: prev.selectedSource,
          questions: prev.questions,
          results: prev.results,
          totalScore: prev.totalScore,
          totalTimeMs: 0,
          startedAt: 0,
        };

        const { result, newStreak, newTotalScore } = recordAnswer(
          session,
          prev.currentQuestionIndex,
          selectedIndex,
          timeMs,
          prev.streak,
        );

        return {
          ...prev,
          results: [...prev.results, result],
          totalScore: newTotalScore,
          streak: newStreak,
          phase: 'question-feedback',
        };
      });
    },
    [],
  );

  const nextQuestion = useCallback(() => {
    setState((prev) => {
      // Only advance if we're in feedback phase
      if (prev.phase !== 'question-feedback') return prev;
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex >= prev.questions.length) {
        return { ...prev, phase: 'results' };
      }
      return { ...prev, currentQuestionIndex: nextIndex, phase: 'question-active' };
    });
  }, []);

  const resetToSelection = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    selectSource,
    startGame,
    beginPlaying,
    startAndPlay,
    submitAnswer,
    nextQuestion,
    resetToSelection,
  };
}
