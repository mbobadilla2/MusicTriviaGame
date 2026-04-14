import { useState } from 'react';
import { useGameSession } from './hooks/useGameSession';
import { useTheme } from './hooks/useTheme';
import { useLanguage } from './hooks/useLanguage';
import { playGameStart } from './audio/soundFX';
import { SourceSelection } from './components/SourceSelection/SourceSelection';
import { PreloadScreen } from './components/PreloadScreen/PreloadScreen';
import { GameScreen } from './components/GameScreen/GameScreen';
import { ResultsScreen } from './components/ResultsScreen/ResultsScreen';
import { LeaderboardView } from './components/LeaderboardView/LeaderboardView';
import { SettingsMenu } from './components/SettingsMenu/SettingsMenu';
import type { FeedbackState } from './components/QuestionCard/QuestionCard';
import type { Question } from './types';

// Shared button style for top-bar icon buttons
const topBtnStyle: React.CSSProperties = {
  position: 'fixed',
  top: '1rem',
  zIndex: 100,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  padding: '0.5rem 0.75rem',
  fontSize: '1.25rem',
  cursor: 'pointer',
  color: 'var(--color-text)',
  lineHeight: 1,
};

function App() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  const isSourceSelection = phase === 'source-selection';

  return (
    <>
      {/* Top-bar buttons — only on source selection screen */}
      {isSourceSelection && (
        <>
          {/* Leaderboard button */}
          <button
            onClick={() => setShowLeaderboard(true)}
            aria-label={t.leaderboardTitle}
            style={{ ...topBtnStyle, right: '4.5rem' }}
          >
            🏆
          </button>

          {/* Settings button */}
          <button
            onClick={() => setShowSettings((v) => !v)}
            aria-label={t.settings}
            style={{ ...topBtnStyle, right: '1rem' }}
          >
            ⚙️
          </button>
        </>
      )}

      {/* Settings menu */}
      <SettingsMenu
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
        language={language}
        onToggleLanguage={toggleLanguage}
        onScoresCleared={() => {}}
        t={t}
      />

      {/* Leaderboard overlay */}
      {showLeaderboard && (
        <LeaderboardView onClose={() => setShowLeaderboard(false)} t={t} />
      )}

      {/* Source selection */}
      {isSourceSelection && (
        <SourceSelection onSourceSelected={selectSource} t={t} />
      )}

      {/* Preload */}
      {phase === 'preloading' && selectedSource && (
        <PreloadScreen
          source={selectedSource}
          onReady={handlePreloadReady}
          onError={resetToSelection}
          t={t}
        />
      )}

      {/* Game */}
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
          t={t}
        />
      )}

      {/* Results */}
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
          t={t}
        />
      )}
    </>
  );
}

export default App;
