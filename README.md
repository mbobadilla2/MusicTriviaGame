# 🎵 Music Trivia Game

A mobile-first music trivia web app. Listen to song previews and guess the title before the timer runs out. Built with React + TypeScript and powered by the Deezer API.

## Features

- 🔍 Search any artist or pick from curated playlists
- 🎧 30-second song previews preloaded before the game starts
- ⏱️ 10-second countdown timer per question with visual feedback
- 🔥 Streak bonus system — chain correct answers for extra points
- 🏆 Local leaderboard (top 10 scores, persisted on device)
- 🌙 Dark mode with system preference detection
- 📱 Optimized for mobile (320–430px)

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend proxy | Node.js + Express |
| Music data | Deezer Public API |
| Testing | Vitest + fast-check (property-based) |
| Deploy | GitHub Pages (frontend) + Render (backend) |

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/music-trivia-game.git
   cd music-trivia-game
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd server && npm install && cd ..
   ```

4. Create your `.env` file:
   ```bash
   cp .env.example .env
   ```
   The default values work for local development — no API keys needed.

### Run

Open two terminals:

```bash
# Terminal 1 — backend proxy
npm run server

# Terminal 2 — frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

To test on mobile devices on the same network:

```bash
npm run dev -- --host
```

Then update `VITE_API_BASE_URL` in `.env` to your local IP (e.g. `http://192.168.x.x:3001`).

### Tests

```bash
npm test
```

## Deployment

### Backend → Render

1. Connect your GitHub repo on [render.com](https://render.com)
2. Render will detect `render.yaml` automatically
3. Set the `ALLOWED_ORIGIN` environment variable to your GitHub Pages URL

### Frontend → GitHub Pages

Set these secrets in your GitHub repo (Settings → Secrets → Actions):

| Secret | Value |
|---|---|
| `VITE_API_BASE_URL` | Your Render service URL (e.g. `https://music-trivia-proxy.onrender.com`) |
| `VITE_BASE_URL` | `/your-repo-name/` |

Push to `main` — the GitHub Actions workflow deploys automatically.

## Project Structure

```
├── src/
│   ├── api/          # Deezer proxy client
│   ├── audio/        # Audio player + sound effects
│   ├── components/   # React UI components
│   ├── engine/       # Game logic (scoring, randomizer, leaderboard)
│   ├── hooks/        # Custom React hooks
│   └── types/        # Shared TypeScript types
├── server/           # Node.js/Express proxy backend
└── .github/
    └── workflows/    # GitHub Actions deploy workflow
```

---

Made by Miguel Fernando w/ Kiro 🤖

## License

[MIT](LICENSE)
