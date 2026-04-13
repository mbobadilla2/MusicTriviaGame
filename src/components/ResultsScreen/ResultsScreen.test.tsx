import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import { ResultsScreen } from './ResultsScreen';
import type { Question, QuestionResult, TriviaSource } from '../../types';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../engine/leaderboard', () => ({
  getEntries: () => [],
  addEntry: (_entries: unknown, newEntry: unknown) => [newEntry],
  saveEntries: () => {},
  isHighScore: () => false,
}));

vi.mock('../../audio/soundFX', () => ({
  playHighScore: () => {},
  playGameEnd: () => {},
}));

// ── Arbitraries ───────────────────────────────────────────────────────────────

/** Track names: at least 2 chars, no leading/trailing spaces, printable ASCII */
const trackNameArb = fc
  .stringOf(fc.char().filter((c) => c.trim().length > 0), { minLength: 2, maxLength: 30 })
  .filter((s) => s.trim().length >= 2);

/** Generates a valid Question with 4 distinct option names */
const questionArb = fc
  .tuple(
    trackNameArb,
    fc.uniqueArray(trackNameArb, { minLength: 3, maxLength: 3 }),
    fc.integer({ min: 0, max: 3 }),
  )
  .filter(([correctName, wrongNames]) => !wrongNames.includes(correctName))
  .map(([correctName, wrongNames, correctIndex]) => {
    const options = [...wrongNames];
    options.splice(correctIndex, 0, correctName);
    const question: Question = {
      track: {
        id: 'track-id',
        name: correctName,
        previewUrl: null,
        artistName: 'Artist',
        albumImageUrl: '',
      },
      options,
      correctIndex,
      audioBlob: new Blob(),
    };
    return question;
  });

/** Generates a correct QuestionResult */
const correctResultArb: fc.Arbitrary<QuestionResult> = fc
  .tuple(questionArb, fc.integer({ min: 0, max: 10000 }), fc.integer({ min: 0, max: 150 }), fc.integer({ min: 0, max: 7 }))
  .map(([question, timeMs, pointsEarned, streakAtAnswer]) => ({
    question,
    selectedIndex: question.correctIndex,
    isCorrect: true,
    timeMs,
    pointsEarned,
    streakAtAnswer,
  }));

/** Generates an incorrect QuestionResult (wrong selection, not timeout) */
const wrongResultArb: fc.Arbitrary<QuestionResult> = questionArb.chain((question) => {
  const wrongIndices = question.options
    .map((_, i) => i)
    .filter((i) => i !== question.correctIndex);
  return fc
    .tuple(
      fc.constantFrom(...wrongIndices),
      fc.integer({ min: 0, max: 9999 }),
    )
    .map(([selectedIndex, timeMs]) => ({
      question,
      selectedIndex,
      isCorrect: false,
      timeMs,
      pointsEarned: 0,
      streakAtAnswer: 0,
    }));
});

/** Generates a timeout QuestionResult */
const timeoutResultArb: fc.Arbitrary<QuestionResult> = questionArb.map((question) => ({
  question,
  selectedIndex: null,
  isCorrect: false,
  timeMs: 10000,
  pointsEarned: 0,
  streakAtAnswer: 0,
}));

/** Any QuestionResult */
const anyResultArb = fc.oneof(correctResultArb, wrongResultArb, timeoutResultArb);

/** Exactly 7 QuestionResults */
const sevenResultsArb = fc.array(anyResultArb, { minLength: 7, maxLength: 7 });

const sourceArb = fc.record<TriviaSource>({
  type: fc.constantFrom('artist' as const, 'playlist' as const),
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 40 }),
  imageUrl: fc.constant(''),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderResults(results: QuestionResult[], totalScore = 0, source?: TriviaSource) {
  const defaultSource: TriviaSource = {
    type: 'artist',
    id: 'src-1',
    name: 'Test Artist',
    imageUrl: '',
  };
  return render(
    <ResultsScreen
      results={results}
      totalScore={totalScore}
      source={source ?? defaultSource}
      onPlayAgain={() => {}}
      onChangeSource={() => {}}
    />,
  );
}

// ── Propiedad 12 ──────────────────────────────────────────────────────────────
// Feature: music-trivia-game, Propiedad 12: Para cualquier resultado de sesión con 7 preguntas
// respondidas, el componente Results_Screen debe renderizar: la puntuación total, el número de
// aciertos sobre 7, y una entrada por cada una de las 7 canciones.
// Valida: Requisitos 7.2, 7.3, 7.4
test.prop([sevenResultsArb, fc.integer({ min: 0, max: 10500 }), sourceArb], { numRuns: 100 })(
  'Propiedad 12: ResultsScreen renderiza puntuación total, aciertos/7 y exactamente 7 canciones',
  (results, totalScore, source) => {
    const { unmount } = renderResults(results, totalScore, source);

    try {
      // Total score is rendered
      const scoreEl = screen.getByText(String(totalScore));
      expect(scoreEl).toBeInTheDocument();

      // "X / 7" correct answers
      const correctCount = results.filter((r) => r.isCorrect).length;
      expect(screen.getByText(`${correctCount} / 7 correctas`)).toBeInTheDocument();

      // Exactly 7 song items in the list
      const list = screen.getByRole('list', { name: /lista de canciones/i });
      const items = list.querySelectorAll('li');
      expect(items).toHaveLength(7);
    } finally {
      unmount();
      cleanup();
    }
  },
);

// ── Propiedad 13 ──────────────────────────────────────────────────────────────
// Feature: music-trivia-game, Propiedad 13: Para cualquier resultado de sesión que contenga
// al menos una respuesta incorrecta, el Results_Screen debe mostrar tanto el nombre de la
// opción elegida como el nombre correcto para cada pregunta fallida.
// Valida: Requisito 7.5
test.prop(
  [
    // At least one wrong (non-timeout) result + 6 any results
    fc
      .tuple(wrongResultArb, fc.array(anyResultArb, { minLength: 6, maxLength: 6 }))
      .map(([wrong, rest]) => [wrong, ...rest] as QuestionResult[]),
    sourceArb,
  ],
  { numRuns: 100 },
)(
  'Propiedad 13: ResultsScreen muestra opción elegida y nombre correcto para cada respuesta incorrecta',
  (results, source) => {
    const { unmount } = renderResults(results, 0, source);

    try {
      const incorrectResults = results.filter(
        (r) => !r.isCorrect && r.selectedIndex !== null,
      );

      for (const result of incorrectResults) {
        const chosenName = result.question.options[result.selectedIndex!];
        const correctName = result.question.track.name;

        // The chosen (wrong) option should appear (with strikethrough styling)
        const chosenEls = screen.getAllByText(chosenName);
        expect(chosenEls.length).toBeGreaterThan(0);

        // The correct name should appear (in songName and/or correctAnswer)
        const correctEls = screen.getAllByText(correctName);
        expect(correctEls.length).toBeGreaterThan(0);
      }
    } finally {
      unmount();
      cleanup();
    }
  },
);
