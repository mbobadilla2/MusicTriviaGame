/**
 * Game Engine — Music Trivia Game
 * Requisitos: 4.6, 5.1, 5.2, 5.3, 5.5, 5.6, 6.3, 6.4, 6.5
 */

import type { Track, TriviaSource, Question, QuestionResult, TriviaSession } from '../types';
import { generateWrongOptions, shuffleOptions } from './randomizer';
import { calculateTotalPoints } from './scoreCalculator';

/** Duración de cada pregunta en milisegundos (Requisito 6.3) */
export const QUESTION_DURATION_MS = 10000;

/**
 * Construye el array de preguntas a partir de los tracks seleccionados.
 * Para cada track genera 3 opciones incorrectas de allTrackNames,
 * baraja las 4 opciones y usa new Blob() como placeholder para audioBlob.
 */
export function buildQuestions(tracks: Track[], allTrackNames: string[]): Question[] {
  return tracks.map((track) => {
    // Construir pool de tracks ficticios a partir de allTrackNames para reutilizar generateWrongOptions
    // Usamos generateWrongOptions con el pool real de tracks cuando sea posible,
    // pero aquí trabajamos con nombres, así que filtramos directamente.
    const wrongNames = allTrackNames
      .filter((name) => name !== track.name)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Aseguramos exactamente 3 opciones incorrectas (puede haber menos si el pool es pequeño)
    const allOptions = [track.name, ...wrongNames];

    const { shuffled, correctIndex } = shuffleOptions(allOptions);

    return {
      track,
      options: shuffled,
      correctIndex,
      audioBlob: new Blob(),
    };
  });
}

/**
 * Inicializa una nueva TriviaSession.
 */
export function initSession(source: TriviaSource, questions: Question[]): TriviaSession {
  return {
    source,
    questions,
    results: [],
    totalScore: 0,
    totalTimeMs: 0,
    startedAt: Date.now(),
  };
}

/**
 * Registra la respuesta a una pregunta y calcula el resultado.
 * Retorna el QuestionResult y el nuevo estado de streak y puntuación total.
 */
export function recordAnswer(
  session: TriviaSession,
  questionIndex: number,
  selectedIndex: number | null,
  timeMs: number,
  currentStreak: number,
): { result: QuestionResult; newStreak: number; newTotalScore: number } {
  const question = session.questions[questionIndex];
  const isCorrect = selectedIndex !== null && selectedIndex === question.correctIndex;

  let pointsEarned: number;
  let newStreak: number;

  if (isCorrect) {
    pointsEarned = calculateTotalPoints(timeMs, currentStreak);
    newStreak = currentStreak + 1;
  } else {
    pointsEarned = 0;
    newStreak = 0;
  }

  const result: QuestionResult = {
    question,
    selectedIndex,
    isCorrect,
    timeMs,
    pointsEarned,
    streakAtAnswer: currentStreak,
  };

  const newTotalScore = session.totalScore + pointsEarned;

  return { result, newStreak, newTotalScore };
}

/**
 * Calcula el tiempo total sumando los timeMs de todos los resultados.
 */
export function calculateTotalTime(results: QuestionResult[]): number {
  return results.reduce((sum, r) => sum + r.timeMs, 0);
}
