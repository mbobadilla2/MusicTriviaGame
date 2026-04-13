import { useState } from 'react';
import { useGameSession } from './hooks/useGameSession';
import { useTheme } from './hooks/useTheme';
import { playGameStart } from './audio/soundFX';
import { SourceSelection } from './components/SourceSelection/SourceSelection';
import { PreloadScreen } from './components/PreloadScreen/PreloadScreen';
import { GameScreen } from './components/GameScreen/GameScreen';
import { ResultsScreen } from './components/ResultsScreen/ResultsScreen';
import { LeaderboardView } from './components/LeaderboardView/LeaderboardView';
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle';
import type { FeedbackState } from './components/QuestionCard/QuestionCard';
import type { Question } from './types';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const {
    phase,
    selectedSource,
    questions,
    currentQuestionIndex,
    results,
    totalScore,
    streak,
    selectSource,
    startAndPlay,
    submitAnswer,
    nextQuestion,
    resetToSelection,
  } = useGameSession();
  const lastResult = results[currentQuestionIndex];
  const feedbackState: FeedbackState = lastResult
    ? lastResult.isCorrect
      ? 'correct'
      : lastResult.selectedIndex === null
        ? 'timeout'
        : 'wrong'
    : 'none';

  const selectedIndex = lastResult?.selectedIndex ?? null;

  function handlePreloadReady(qs: Question[]) {
    startAndPlay(qs);
    playGameStart();
  }

  return (
    <>
      {/* ThemeToggle solo visible fuera de la partida y resultados */}
      {(phase !== 'question-active' && phase !== 'question-feedback' && phase !== 'results') && (
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      )}

      {showLeaderboard && (
        <LeaderboardView onClose={() => setShowLeaderboard(false)} />
      )}

      {phase === 'source-selection' && (
        <div>
          <button
            onClick={() => setShowLeaderboard(true)}
            aria-label="Ver tabla de puntuaciones"
            style={{
              position: 'fixed',
              top: '1rem',
              right: '4rem',
              zIndex: 100,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              padding: '0.5rem 0.75rem',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: 'var(--color-text)',
              lineHeight: 1,
            }}
          >
            🏆
          </button>
          <SourceSelection onSourceSelected={selectSource} />
        </div>
      )}

      {phase === 'preloading' && selectedSource && (
        <PreloadScreen
          source={selectedSource}
          onReady={handlePreloadReady}
          onError={resetToSelection}
        />
      )}

      {(phase === 'question-active' || phase === 'question-feedback') && (
        <GameScreen
          questions={questions}
          currentIndex={currentQuestionIndex}
          score={totalScore}
          streak={streak}
          phase={phase}
          feedbackState={feedbackState}
          selectedIndex={selectedIndex}
          onAnswer={submitAnswer}
          onNext={nextQuestion}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {phase === 'results' && (
        <ResultsScreen
          results={results}
          totalScore={totalScore}
          source={selectedSource ?? { type: 'artist', id: '', name: 'Trivia', imageUrl: '' }}
          onPlayAgain={() => {
            const src = selectedSource;
            resetToSelection();
            if (src) selectSource(src);
          }}
          onChangeSource={resetToSelection}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </>
  );
}

export default App;
