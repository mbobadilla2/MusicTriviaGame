/**
 * @file index.ts
 * @description Shared TypeScript interfaces and types used throughout the app.
 * All data structures that flow between components, hooks, and the engine are defined here.
 */

/**
 * Represents a single music track returned by the Deezer API proxy.
 */
export interface Track {
  /** Deezer track ID */
  id: string;
  /** Track title */
  name: string;
  /** URL to the 30-second MP3 preview, or null if unavailable */
  previewUrl: string | null;
  /** Name of the primary artist */
  artistName: string;
  /** URL to the album cover image (medium size) */
  albumImageUrl: string;
}

/**
 * Represents the music source selected by the player before a game starts.
 * Can be either a searched artist or a preset playlist.
 */
export interface TriviaSource {
  /** Whether this source is an artist search result or a preset playlist */
  type: 'artist' | 'playlist';
  /** Deezer artist or playlist ID */
  id: string;
  /** Display name shown in the UI */
  name: string;
  /** URL to the artist/playlist image, or an emoji string for preset playlists */
  imageUrl: string;
}

/**
 * Represents a single trivia question.
 * Contains the correct track, four answer options, and the preloaded audio blob.
 */
export interface Question {
  /** The track whose preview is played — this is the correct answer */
  track: Track;
  /** Array of four song name strings shown as answer buttons */
  options: string[];
  /**
   * Parallel array to `options` — each entry is the full Track object
   * corresponding to that option, used to display album art on answer buttons.
   */
  optionTracks: Track[];
  /** Index into `options` that corresponds to the correct answer */
  correctIndex: number;
  /**
   * Preloaded audio blob for the track preview.
   * Populated by `preloadAudio()` before the game starts.
   * Initialized as `new Blob()` (empty placeholder) by `buildQuestions()`.
   */
  audioBlob: Blob;
}

/**
 * Records the outcome of a single answered (or timed-out) question.
 */
export interface QuestionResult {
  /** The question that was answered */
  question: Question;
  /** Index of the option the player selected, or null if time expired */
  selectedIndex: number | null;
  /** Whether the player selected the correct option */
  isCorrect: boolean;
  /** Time elapsed in milliseconds from question start to answer (or timeout) */
  timeMs: number;
  /** Points awarded for this answer (0 if incorrect or timed out) */
  pointsEarned: number;
  /** Consecutive correct answers the player had at the time of this answer */
  streakAtAnswer: number;
}

/**
 * Represents a complete game session from source selection to final results.
 * Used internally by `recordAnswer` to compute scores.
 */
export interface TriviaSession {
  /** The source (artist or playlist) used for this session */
  source: TriviaSource;
  /** All 7 questions for this session */
  questions: Question[];
  /** Results accumulated so far (grows as questions are answered) */
  results: QuestionResult[];
  /** Running total score */
  totalScore: number;
  /** Total time spent answering all questions so far (ms) */
  totalTimeMs: number;
  /** Unix timestamp (ms) when the session started */
  startedAt: number;
}

/**
 * A single entry in the local leaderboard stored in localStorage.
 */
export interface LeaderboardEntry {
  /** Unique identifier (UUID or timestamp-based fallback) */
  id: string;
  /** Display name of the artist or playlist used */
  sourceName: string;
  /** Whether the source was an artist or a playlist */
  sourceType: 'artist' | 'playlist';
  /** Image URL or emoji for the source, used in the leaderboard UI */
  sourceImageUrl: string;
  /** Final score for this session */
  totalScore: number;
  /** Number of questions answered correctly (out of 7) */
  correctAnswers: number;
  /** Total time spent answering all questions (ms) */
  totalTimeMs: number;
  /** Unix timestamp (ms) when the session ended */
  playedAt: number;
}

/**
 * Represents the current phase of the game flow.
 *
 * State machine transitions:
 * ```
 * source-selection → preloading → question-active ⇄ question-feedback → results
 *        ↑___________________________________________________|
 * ```
 */
export type GamePhase =
  | 'source-selection'  // Player is choosing an artist or playlist
  | 'preloading'        // Audio and images are being downloaded
  | 'ready'             // Resources loaded, waiting for player to start
  | 'question-active'   // Timer running, player must choose an answer
  | 'question-feedback' // Answer submitted, showing correct/wrong feedback
  | 'results';          // All 7 questions done, showing final score
