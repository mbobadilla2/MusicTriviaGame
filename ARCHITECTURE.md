# Architecture — Music Trivia Game

> 🇪🇸 [Versión en español](ARCHITECTURE.es.md)

A mobile-first music trivia web app where players identify songs by their 30-second previews. Built with React + TypeScript + Vite on the frontend and a Node.js/Express proxy on the backend.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Tech Stack](#tech-stack)
3. [Game Flow](#game-flow)
4. [Architecture Overview](#architecture-overview)
5. [Backend Proxy](#backend-proxy)
6. [Audio System](#audio-system)
7. [Scoring System](#scoring-system)
8. [State Management](#state-management)
9. [Internationalization](#internationalization)
10. [Theming](#theming)
11. [Leaderboard](#leaderboard)
12. [Local Development](#local-development)
13. [Deployment](#deployment)
14. [Environment Variables](#environment-variables)

---

## Project Structure

```
/
├── server/                  # Node.js/Express proxy backend
│   ├── server.ts            # All proxy endpoints and Deezer API integration
│   ├── package.json
│   └── tsconfig.json
│
├── src/
│   ├── api/
│   │   └── apiClient.ts     # HTTP client — calls the proxy backend
│   │
│   ├── audio/
│   │   ├── audioPlayer.ts   # Audio playback (Web Audio API + HTMLAudioElement fallback)
│   │   └── soundFX.ts       # Programmatic sound effects (Web Audio API)
│   │
│   ├── components/
│   │   ├── ConfirmDialog/   # Reusable confirmation modal
│   │   ├── GameScreen/      # Active question UI (timer bar, score, options)
│   │   ├── LeaderboardView/ # Top-10 scores overlay
│   │   ├── PlaylistSelector/# Preset playlist grid
│   │   ├── PreloadScreen/   # Audio/image download progress screen
│   │   ├── QuestionCard/    # Four answer option buttons with album art
│   │   ├── ResultsScreen/   # End-of-game summary with playable samples
│   │   ├── ScoreCounter/    # Animated score + streak indicator
│   │   ├── SearchBar/       # Artist search with debounce
│   │   ├── SettingsMenu/    # Theme, language, and score reset panel
│   │   ├── SourceSelection/ # Main screen (search + preset playlists)
│   │   ├── ThemeToggle/     # Light/dark mode button
│   │   └── TimerBar/        # Full-width countdown bar (green → red)
│   │
│   ├── engine/
│   │   ├── gameEngine.ts    # Core game logic (build questions, record answers)
│   │   ├── leaderboard.ts   # localStorage leaderboard CRUD
│   │   ├── randomizer.ts    # Fisher-Yates track/option shuffling
│   │   └── scoreCalculator.ts # Points and streak bonus formulas
│   │
│   ├── hooks/
│   │   ├── useGameSession.ts # Game state machine (phase transitions)
│   │   ├── useLanguage.ts    # ES/EN language preference
│   │   ├── useTheme.ts       # Light/dark theme preference
│   │   └── useTimer.ts       # requestAnimationFrame countdown timer
│   │
│   ├── i18n/
│   │   └── translations.ts  # All UI strings in Spanish and English
│   │
│   ├── styles/
│   │   └── globals.css      # CSS custom properties for both themes
│   │
│   ├── types/
│   │   └── index.ts         # All shared TypeScript interfaces and types
│   │
│   └── utils/
│       └── validators.ts    # Pure functions for filtering/validating tracks
│
├── .env.example             # Template for required environment variables
├── ARCHITECTURE.md          # This file
└── README.md                # Setup and deployment guide
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite |
| Package manager | pnpm |
| Styling | CSS Modules + CSS custom properties |
| Audio | Web Audio API (`AudioContext`) + `HTMLAudioElement` fallback |
| Backend proxy | Node.js + Express + TypeScript |
| Music data | Deezer API (public, no auth required) |
| Testing | Vitest + fast-check (property-based) + Testing Library |
| Deployment (frontend) | GitHub Pages |
| Deployment (backend) | Render.com |

---

## Game Flow

```
┌─────────────────────┐
│   source-selection  │  Player searches for an artist or picks a preset playlist
└────────┬────────────┘
         │ confirm selection
         ▼
┌─────────────────────┐
│     preloading      │  Fetch tracks → select 7 → build questions →
│                     │  download audio blobs + preload album images
└────────┬────────────┘
         │ tap "Play!"  (also unlocks AudioContext on iOS)
         ▼
┌─────────────────────┐
│   question-active   │  Play audio preview, start 10s countdown timer
└────────┬────────────┘
         │ player taps an option (or timer expires)
         ▼
┌─────────────────────┐
│  question-feedback  │  Show correct/wrong highlight, play sound FX,
│                     │  auto-advance after 2s (or tap "Next →")
└────────┬────────────┘
         │ repeat for all 7 questions
         ▼
┌─────────────────────┐
│       results       │  Show score, per-song breakdown, save to leaderboard
└─────────────────────┘
         │ "Play Again" or "Back to Home"
         ▼
   source-selection
```

The `GamePhase` union type and all transitions are managed by the `useGameSession` hook.

---

## Architecture Overview

```
Browser                          Proxy Server              Deezer API
─────────────────────────────    ──────────────────────    ──────────────
React App (GitHub Pages)
  │
  ├── apiClient.ts  ──────────►  /api/search              ──► /search/artist
  │                             /api/artist-tracks         ──► /artist/{id}/top
  │                             /api/playlist-tracks       ──► /playlist/{id}/tracks
  │                             /api/playlist-image        ──► /playlist/{id}
  │
  ├── audioPlayer.ts            (fetches preview MP3s directly from Deezer CDN)
  │
  └── leaderboard.ts            (reads/writes localStorage — no server needed)
```

**Why a proxy?**
The Deezer API does not support CORS for browser requests from arbitrary origins. The proxy server handles all Deezer API calls server-side and returns sanitized, app-specific JSON to the frontend.

---

## Backend Proxy

**File:** `server/server.ts`

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/search?q=&limit=8` | Search artists by name |
| GET | `/api/artist-tracks?artistId=` | Top 100 tracks for an artist |
| GET | `/api/playlist-tracks?playlistId=` | Tracks from a playlist |
| GET | `/api/playlist-image?playlistId=` | Playlist cover image URL only |

### Data Mapping

All Deezer responses are mapped to the app's internal `Track` type:

```typescript
interface Track {
  id: string;
  name: string;
  previewUrl: string | null;  // 30-second MP3 URL
  artistName: string;
  albumImageUrl: string;      // album cover (medium size)
}
```

Tracks without a `preview` URL are filtered out before being returned to the client.

### CORS Policy

The proxy allows requests from:
- `localhost` (any port) — local development
- Any `192.168.x.x`, `10.x.x.x`, `172.16-31.x.x` — local network (mobile testing)
- `*.github.io` — GitHub Pages deployments
- `ALLOWED_ORIGIN` env variable — custom production domain

---

## Audio System

**File:** `src/audio/audioPlayer.ts`

### Two-Backend Design

```
play(blob)
    │
    ├── AudioContext available?
    │       │
    │       ├── YES → FileReader → decodeAudioData → AudioBufferSourceNode.start()
    │       │
    │       └── NO  → URL.createObjectURL → new Audio() → .play()
    │
    └── (fallback also used if decodeAudioData fails)
```

### iOS Safari Unlock

iOS Safari blocks audio playback unless initiated synchronously from a user gesture. The solution:

1. `unlockAudio()` is called directly inside the "Play!" button's `onClick` handler in `PreloadScreen`.
2. This calls `AudioContext.resume()` synchronously, unlocking the context for the session.
3. All subsequent `play()` calls (from `useEffect`, `setTimeout`, etc.) work without restriction.

### Cancellation Token Pattern

`play()` is asynchronous (FileReader + decodeAudioData). If `pause()` or `stop()` is called while decoding is in progress, the audio must not start when decoding completes.

Solution: a module-level `playToken` integer is incremented on every `stop()` and `pause()`. Each `play()` call captures the token at start time and checks it before starting playback.

```
play()  →  token = ++playToken (= 5)
           FileReader starts...
pause() →  playToken++ (= 6)
           FileReader finishes → token (5) ≠ playToken (6) → ABORT ✓
```

### Preloading

Before the game starts, `preloadAudio()`:
1. Downloads all 7 preview MP3s as `Blob` objects (stored in `question.audioBlob`).
2. Retries each download once on failure.
3. Preloads all unique album image URLs into the browser's HTTP cache using `new Image()`.

This ensures zero network latency during gameplay.

---

## Scoring System

**File:** `src/engine/scoreCalculator.ts`

### Base Points

```
basePoints = max(0, 150 - floor(timeMs / 1000) × 10)
```

| Time | Points |
|---|---|
| 0–999 ms | 150 |
| 1000–1999 ms | 140 |
| 5000–5999 ms | 100 |
| 9000–9999 ms | 60 |
| ≥ 15000 ms | 0 |

### Streak Bonus

A bonus is added when the player answers correctly 2+ times in a row:

```
streakBonus = streak >= 2 ? floor(streak × 0.1 × basePoints) : 0
```

The streak resets to 0 on any wrong answer or timeout.

### Maximum Score

- 7 questions × 150 base points = **1050 base points**
- With a 7-question streak and instant answers: up to **~1785 points**

---

## State Management

**File:** `src/hooks/useGameSession.ts`

All game state lives in a single React hook using `useState` with a flat state object. There is no external state library (Redux, Zustand, etc.).

### Why a single state object?

Multiple `useState` calls would cause intermediate renders where some values are updated but others aren't. For example, advancing to the next question requires updating both `currentQuestionIndex` and `phase` atomically.

### State Shape

```typescript
interface GameSessionState {
  phase: GamePhase;
  selectedSource: TriviaSource | null;
  questions: Question[];
  currentQuestionIndex: number;
  results: QuestionResult[];
  totalScore: number;
  streak: number;
}
```

### Key Design: `submitAnswer` uses functional setState

```typescript
const submitAnswer = useCallback((selectedIndex, timeMs) => {
  setState((prev) => {
    // Uses prev (latest state) — never stale
    const { result, newStreak, newTotalScore } = recordAnswer(...);
    return { ...prev, results: [...prev.results, result], ... };
  });
}, []);
```

This avoids stale closure bugs that would occur if `state` were captured directly in the callback.

---

## Internationalization

**File:** `src/i18n/translations.ts`

All UI strings are defined in a single `translations` object with `es` and `en` keys. The `useLanguage` hook provides the current translation object (`t`) to all components.

```typescript
const { t } = useLanguage();
// t.playAgain → "Jugar de nuevo" (es) or "Play again" (en)
```

**What is NOT translated:**
- Artist names
- Song titles
- Playlist names

These always come from the Deezer API as-is.

Language preference is persisted in localStorage and auto-detected from `navigator.language` on first visit.

---

## Theming

**File:** `src/styles/globals.css`, `src/hooks/useTheme.ts`

The theme system uses CSS custom properties (variables) toggled by a `dark` class on `<html>`:

```css
:root {
  --color-bg: #f5f5f5;
  --color-surface: #ffffff;
  --color-primary: #1db954;
  /* ... */
}

html.dark {
  --color-bg: #121212;
  --color-surface: #1e1e1e;
  /* ... */
}
```

`useTheme` adds/removes the `dark` class on `document.documentElement` and persists the preference to localStorage. The initial theme is determined from localStorage or `prefers-color-scheme`.

---

## Leaderboard

**File:** `src/engine/leaderboard.ts`

The leaderboard is stored entirely in `localStorage` — no server required.

- **Key:** `music-trivia-leaderboard`
- **Format:** JSON array of up to 10 `LeaderboardEntry` objects
- **Sorting:** Score descending; ties broken by total time ascending

```typescript
interface LeaderboardEntry {
  id: string;
  sourceName: string;
  sourceType: 'artist' | 'playlist';
  sourceImageUrl: string;   // artist photo or playlist emoji
  totalScore: number;
  correctAnswers: number;   // out of 7
  totalTimeMs: number;
  playedAt: number;         // Unix timestamp
}
```

All leaderboard functions fail silently if localStorage is unavailable (e.g. private browsing mode).

---

## Local Development

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Setup

```bash
# 1. Install frontend dependencies
pnpm install

# On first install, pnpm blocks build scripts for security.
# Approve the two required packages when prompted:
pnpm approve-builds
# → approve: esbuild, msw
# Then re-run:
pnpm install

# 2. Install backend dependencies
cd server && pnpm install && cd ..

# 3. Create environment file
cp .env.example .env
# Edit .env — set VITE_API_BASE_URL=http://localhost:3001
```

### Running

```bash
# Terminal 1 — backend proxy
pnpm run server

# Terminal 2 — frontend dev server
pnpm run dev

# To expose on local network (for mobile testing):
pnpm run dev -- --host
# Then set VITE_API_BASE_URL=http://<your-local-ip>:3001 in .env
```

### Testing

```bash
pnpm test          # single run
pnpm run test:watch  # watch mode
```

---

## Deployment

### Frontend → GitHub Pages

A GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically builds and deploys the frontend on every push to `main`.

Required GitHub repository secrets:
- `VITE_API_BASE_URL` — URL of the Render.com backend (e.g. `https://your-app.onrender.com`)
- `VITE_BASE_URL` — Repository path prefix (e.g. `/MusicTriviaGame/`)

### Backend → Render.com

The `render.yaml` file configures the backend service. Connect the GitHub repository in the Render dashboard and set the environment variable:
- `ALLOWED_ORIGIN` — Your GitHub Pages URL (e.g. `https://username.github.io`)

The backend auto-deploys on every push to `main`.

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Frontend `.env` | URL of the proxy backend |
| `VITE_BASE_URL` | GitHub Actions secret | Base path for GitHub Pages (e.g. `/RepoName/`) |
| `PORT` | Backend `.env` | Port for the Express server (default: 3001) |
| `ALLOWED_ORIGIN` | Render dashboard | Allowed CORS origin for production |
