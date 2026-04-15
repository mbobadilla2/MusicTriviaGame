export interface Track {
  id: string;
  name: string;
  previewUrl: string | null;
  artistName: string;
  albumImageUrl: string;
}

export interface TriviaSource {
  type: 'artist' | 'playlist';
  id: string;
  name: string;
  imageUrl: string;
}

export interface Question {
  track: Track;
  options: string[];
  optionTracks: Track[];   // parallel array to options, with full track info
  correctIndex: number;
  audioBlob: Blob;
}

export interface QuestionResult {
  question: Question;
  selectedIndex: number | null;
  isCorrect: boolean;
  timeMs: number;
  pointsEarned: number;
  streakAtAnswer: number;
}

export interface TriviaSession {
  source: TriviaSource;
  questions: Question[];
  results: QuestionResult[];
  totalScore: number;
  totalTimeMs: number;
  startedAt: number;
}

export interface LeaderboardEntry {
  id: string;
  sourceName: string;
  sourceType: 'artist' | 'playlist';
  sourceImageUrl: string;
  totalScore: number;
  correctAnswers: number;
  totalTimeMs: number;
  playedAt: number;
}

export type GamePhase =
  | 'source-selection'
  | 'preloading'
  | 'ready'
  | 'question-active'
  | 'question-feedback'
  | 'results';
