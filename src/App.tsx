import { useState, useEffect } from 'react';
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

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';

const PLAYLIST_IDS = [
  '3155776842','1306931615','1677006641','1964085082','867825522',
  '878989033','789123393','1615514485','1902101402','5104249748',
];

// Shared button style for top-bar icon buttons
const topBtnStyle: React.CSSProperties = {
  position: 'fixed',
  top: '1rem',
  right: '1rem',
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
  const [playlistImages, setPlaylistImages] = useState<Record<string, string>>({});
  const [appReady, setAppReady] = useState(false);

  // Load all playlist images on startup before showing the main screen
  useEffect(() => {
    let cancelled = false;
    async function loadImages() {
      const results = await Promise.allSettled(
        PLAYLIST_IDS.map(async (id) => {
          const res = await fetch(`${BASE_URL}/api/playlist-image?playlistId=${id}`);
          if (!res.ok) return { id, imageUrl: '' };
          const data = await res.json() as { imageUrl?: string };
          return { id, imageUrl: data.imageUrl ?? '' };
        })
      );
      if (cancelled) return;
      const images: Record<string, string> = {};
      for (const r of results) {
        if (r.status === 'fulfilled') images[r.value.id] = r.value.imageUrl;
      }
      setPlaylistImages(images);
      setAppReady(true);
    }
    void loadImages();
    return () => { cancelled = true; };
  }, []);

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

  // Splash screen while loading playlist images
  if (!appReady) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1rem',
        background: 'var(--color-bg)', color: 'var(--color-text)',
      }}>
        <span style={{ fontSize: '3rem' }}>🎵</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
          Music Trivia
        </span>
        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          Loading...
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Top-bar buttons — only on source selection screen */}
      {isSourceSelection && (
        <>
          {/* Settings button */}
          <button
            onClick={() => setShowSettings((v) => !v)}
            aria-label={t.settings}
            style={{ ...topBtnStyle}}
          >
            ⚙️
          </button>

          {/* Leaderboard button */}
          <button
            onClick={() => setShowLeaderboard(true)}
            aria-label={t.leaderboardTitle}
            style={{ ...topBtnStyle, top: '4rem' }}
            >
            🏆
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
        <SourceSelection onSourceSelected={selectSource} t={t} playlistImages={playlistImages} />
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
