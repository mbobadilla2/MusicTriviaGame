import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';
import { URL } from 'url';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Allow localhost (any port) for local development
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return callback(null, true);
    // Allow any local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) return callback(null, true);
    // Allow GitHub Pages and any configured production origin
    const allowed = process.env.ALLOWED_ORIGIN;
    if (allowed && origin === allowed) return callback(null, true);
    // Allow any *.github.io origin
    if (/^https:\/\/[^.]+\.github\.io$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
}));
app.use(express.json());

// ─── HTTP helper ──────────────────────────────────────────────────────────────

interface HttpGetResult {
  statusCode: number;
  body: string;
}

function httpsGet(url: string): Promise<HttpGetResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, body: data }));
    });

    req.on('error', reject);
    req.end();
  });
}

async function deezerGet(path: string): Promise<unknown> {
  const url = `https://api.deezer.com${path}`;
  const result = await httpsGet(url);

  if (result.statusCode !== 200) {
    console.error(`[proxy] Deezer error ${result.statusCode}:`, result.body.substring(0, 200));
    throw new Error(`Deezer API error ${result.statusCode}`);
  }

  const parsed = JSON.parse(result.body);

  // Deezer returns { error: { type, message, code } } on API-level errors
  if (parsed.error) {
    console.error('[proxy] Deezer API error:', parsed.error);
    throw new Error(`Deezer error: ${parsed.error.message ?? JSON.stringify(parsed.error)}`);
  }

  return parsed;
}

// ─── Data mappers ─────────────────────────────────────────────────────────────

interface Track {
  id: string;
  name: string;
  previewUrl: string | null;
  artistName: string;
  albumImageUrl: string;
}

function sanitizeString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  return '';
}

function mapDeezerTrack(item: Record<string, unknown>): Track | null {
  const id = String(item['id'] ?? '');
  const name = sanitizeString(item['title']);
  if (!id || !name) return null;

  const previewUrl =
    typeof item['preview'] === 'string' && item['preview'].trim() !== ''
      ? item['preview'].trim()
      : null;

  const artist = item['artist'] as Record<string, unknown> | undefined;
  const artistName = artist ? sanitizeString(artist['name']) : '';

  const album = item['album'] as Record<string, unknown> | undefined;
  const albumImageUrl = album ? sanitizeString(album['cover_medium'] ?? album['cover']) : '';

  return { id, name, previewUrl, artistName, albumImageUrl };
}

function filterTracksWithPreview(tracks: Track[]): Track[] {
  return tracks.filter(
    (t) => typeof t.previewUrl === 'string' && t.previewUrl.trim() !== ''
  );
}

// ─── Error handler ────────────────────────────────────────────────────────────

function handleError(err: unknown, res: Response): void {
  console.error('[proxy] Unexpected error:', err);
  res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/search?q={query}&limit=8
 * Search artists on Deezer.
 */
app.get('/api/search', async (req: Request, res: Response) => {
  const q = sanitizeString(req.query['q']);
  const limit = Math.min(Math.max(parseInt(String(req.query['limit'] ?? '8'), 10) || 8, 1), 50);

  if (!q) {
    res.status(400).json({ error: 'Query parameter "q" is required.' });
    return;
  }

  try {
    const data = (await deezerGet(
      `/search/artist?q=${encodeURIComponent(q)}&limit=${limit}`
    )) as Record<string, unknown>;

    const items = Array.isArray(data['data']) ? data['data'] as Record<string, unknown>[] : [];

    const artists = items.map((a) => ({
      id: String(a['id'] ?? ''),
      name: sanitizeString(a['name']),
      imageUrl: sanitizeString(a['picture_medium'] ?? a['picture']),
      genres: [] as string[],
      followers: typeof a['nb_fan'] === 'number' ? a['nb_fan'] : 0,
    })).filter((a) => a.id && a.name);

    res.json({ artists: artists.slice(0, limit) });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /api/artist-tracks?artistId={id}
 * Returns top tracks for a Deezer artist (only those with a valid preview).
 */
app.get('/api/artist-tracks', async (req: Request, res: Response) => {
  const artistId = sanitizeString(req.query['artistId']);

  if (!artistId) {
    res.status(400).json({ error: 'Query parameter "artistId" is required.' });
    return;
  }

  try {
    const data = (await deezerGet(
      `/artist/${encodeURIComponent(artistId)}/top?limit=50`
    )) as Record<string, unknown>;

    const items = Array.isArray(data['data']) ? data['data'] as Record<string, unknown>[] : [];
    const tracks = filterTracksWithPreview(
      items.map(mapDeezerTrack).filter((t): t is Track => t !== null)
    );

    res.json({ tracks });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /api/playlist-tracks?playlistId={id}
 * Returns tracks from a Deezer playlist (only those with a valid preview).
 */
app.get('/api/playlist-tracks', async (req: Request, res: Response) => {
  const playlistId = sanitizeString(req.query['playlistId']);

  if (!playlistId) {
    res.status(400).json({ error: 'Query parameter "playlistId" is required.' });
    return;
  }

  try {
    const data = (await deezerGet(
      `/playlist/${encodeURIComponent(playlistId)}/tracks?limit=100`
    )) as Record<string, unknown>;

    const items = Array.isArray(data['data']) ? data['data'] as Record<string, unknown>[] : [];
    const tracks = filterTracksWithPreview(
      items.map(mapDeezerTrack).filter((t): t is Track => t !== null)
    );

    // Playlist metadata — fetch separately
    let playlistName = '';
    let playlistImageUrl = '';
    try {
      const meta = (await deezerGet(`/playlist/${encodeURIComponent(playlistId)}`)) as Record<string, unknown>;
      playlistName = sanitizeString(meta['title']);
      playlistImageUrl = sanitizeString(meta['picture_medium'] ?? meta['picture']);
    } catch {
      // metadata is optional
    }

    res.json({ tracks, playlistName, playlistImageUrl });
  } catch (err) {
    handleError(err, res);
  }
});

// ─── 404 fallback ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Global error middleware ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  handleError(err, res);
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[proxy] Music Trivia proxy (Deezer) running on http://0.0.0.0:${PORT}`);
});

export default app;
