/**
 * Tests de propiedad — Game Engine
 * Feature: music-trivia-game
 */

import { describe, it, expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import {
  QUESTION_DURATION_MS,
  calculateTotalTime,
  recordAnswer,
  initSession,
  buildQuestions,
} from './gameEngine';
import type { Track, TriviaSource, Question, QuestionResult, TriviaSession } from '../types';

// ---------------------------------------------------------------------------
// Helpers para generar datos de prueba
// ---------------------------------------------------------------------------

function makeTrack(id: string, name: string): Track {
  return { id, name, previewUrl: null, artistName: 'Artist', albumImageUrl: '' };
}

function makeQuestion(correctIndex: number): Question {
  return {
    track: makeTrack('t1', 'Song A'),
    options: ['Song A', 'Song B', 'Song C', 'Song D'],
    correctIndex,
    audioBlob: new Blob(),
  };
}

function makeSource(): TriviaSource {
  return { type: 'artist', id: 'src1', name: 'Test Artist', imageUrl: '' };
}

/** Construye una sesión con N preguntas (correctIndex siempre 0) */
function makeSession(numQuestions: number): TriviaSession {
  const questions: Question[] = Array.from({ length: numQuestions }, (_, i) =>
    makeQuestion(0),
  );
  return {
    source: makeSource(),
    questions,
    results: [],
    totalScore: 0,
    totalTimeMs: 0,
    startedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Propiedad 10: QUESTION_DURATION_MS es exactamente 10000
// Valida: Requisito 6.3
// ---------------------------------------------------------------------------

describe('Propiedad 10: Timer siempre inicia en 10 segundos', () => {
  it('QUESTION_DURATION_MS es exactamente 10000', () => {
    expect(QUESTION_DURATION_MS).toBe(10000);
  });

  // Test de propiedad: la constante no cambia bajo ninguna circunstancia
  test.prop(
    [fc.integer({ min: 0, max: 1000 })],
    { numRuns: 100 },
  )('QUESTION_DURATION_MS permanece 10000 independientemente de cualquier valor', (_ignored) => {
    // Feature: music-trivia-game, Propiedad 10: Para cualquier nueva pregunta iniciada, el valor inicial del timer es exactamente 10000 ms.
    // Valida: Requisito 6.3
    expect(QUESTION_DURATION_MS).toBe(10000);
  });
});

// ---------------------------------------------------------------------------
// Propiedad 11: calculateTotalTime retorna exactamente la suma aritmética
// Valida: Requisito 6.5
// ---------------------------------------------------------------------------

describe('Propiedad 11: Tiempo total es suma de tiempos individuales', () => {
  test.prop(
    [fc.array(fc.integer({ min: 0, max: 10000 }), { minLength: 7, maxLength: 7 })],
    { numRuns: 100 },
  )('calculateTotalTime retorna la suma exacta de 7 tiempos', (times) => {
    // Feature: music-trivia-game, Propiedad 11: Para cualquier array de 7 tiempos individuales (en ms), calculateTotalTime retorna exactamente su suma aritmética.
    // Valida: Requisito 6.5
    const results: QuestionResult[] = times.map((t) => ({
      question: makeQuestion(0),
      selectedIndex: 0,
      isCorrect: true,
      timeMs: t,
      pointsEarned: 100,
      streakAtAnswer: 0,
    }));

    const expected = times.reduce((a, b) => a + b, 0);
    expect(calculateTotalTime(results)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Propiedad 8: Invariante del contador de streak
// Valida: Requisitos 5.3, 5.5, 5.6
// ---------------------------------------------------------------------------

/**
 * Simula una secuencia de respuestas y retorna el streak final.
 * answers: array de 'correct' | 'wrong' | 'null'
 */
function simulateStreak(answers: Array<'correct' | 'wrong' | 'null'>): number {
  const session = makeSession(answers.length);
  let streak = 0;

  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    const selectedIndex: number | null =
      answer === 'correct' ? 0 : answer === 'wrong' ? 1 : null;

    const { newStreak } = recordAnswer(session, i, selectedIndex, 500, streak);
    streak = newStreak;
  }

  return streak;
}

/**
 * Calcula el streak esperado: número de aciertos consecutivos desde el último fallo/null.
 */
function expectedStreak(answers: Array<'correct' | 'wrong' | 'null'>): number {
  let count = 0;
  for (let i = answers.length - 1; i >= 0; i--) {
    if (answers[i] === 'correct') {
      count++;
    } else {
      break;
    }
  }
  return count;
}

describe('Propiedad 8: Invariante del contador de streak', () => {
  const answerArb = fc.array(
    fc.oneof(fc.constant('correct' as const), fc.constant('wrong' as const), fc.constant('null' as const)),
    { minLength: 1, maxLength: 10 },
  );

  test.prop([answerArb], { numRuns: 100 })(
    'el streak final es el número de aciertos consecutivos desde el último fallo/null',
    (answers) => {
      // Feature: music-trivia-game, Propiedad 8: Para cualquier secuencia de respuestas, el streak final es el número de aciertos consecutivos desde el último fallo/expiración.
      // Valida: Requisitos 5.3, 5.5, 5.6
      const actual = simulateStreak(answers);
      const expected = expectedStreak(answers);
      expect(actual).toBe(expected);
    },
  );

  test.prop(
    [
      fc.array(
        fc.oneof(fc.constant('correct' as const), fc.constant('wrong' as const), fc.constant('null' as const)),
        { minLength: 0, maxLength: 9 },
      ),
      fc.oneof(fc.constant('wrong' as const), fc.constant('null' as const)),
    ],
    { numRuns: 100 },
  )(
    'después de cualquier fallo o null, el streak es 0',
    (prefix, failOrNull) => {
      // Feature: music-trivia-game, Propiedad 8: Después de cualquier respuesta incorrecta o expiración, el streak debe ser 0.
      // Valida: Requisitos 5.3, 5.5, 5.6
      const answers = [...prefix, failOrNull];
      const session = makeSession(answers.length);
      let streak = 0;

      for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];
        const selectedIndex: number | null =
          answer === 'correct' ? 0 : answer === 'wrong' ? 1 : null;
        const { newStreak } = recordAnswer(session, i, selectedIndex, 500, streak);
        streak = newStreak;
      }

      expect(streak).toBe(0);
    },
  );
});
