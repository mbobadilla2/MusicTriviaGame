/**
 * @file apiClient.ts
 * @description HTTP client for communicating with the Node.js proxy backend.
 *
 * ## Architecture
 *
 * The app never calls the Deezer API directly from the browser. Instead, all
 * requests go through a Node.js/Express proxy server (`server/server.ts`) that:
 * - Handles CORS
 * - Sanitizes and maps Deezer responses to the app's internal `Track` type
 * - Filters out tracks without a valid preview URL
 *
 * The proxy base URL is configured via the `VITE_API_BASE_URL` environment
 * variable. In local development this is typically `http://localhost:3001`.
 * In production (GitHub Pages), it points to the Render.com deployment.
 *
 * ## Data Sanitization
 *
 * All responses from the proxy are sanitized before use:
 * - `sanitizeArtist()` validates and maps artist search results
 * - `sanitizeTrack()` validates and maps track objects
 *
 * Invalid or incomplete records are filtered out rather than causing runtime errors.
 */

import type { Track } from '../types';
import { filterTracksWithPreview, limitSearchResults } from '../utils/validators';

/**
 * Artist search result returned by the `/api/search` endpoint.
 */
export interface ArtistResult {
  /** Deezer artist ID */
  id: string;
  /** Artist display name */
  name: string;
  /** URL to the artist's profile picture (medium size) */
  imageUrl: string;
  /** List of genre names associated with the artist */
  genres: string[];
  /** Number of Deezer fans/followers */
  followers: number;
}

/** Base URL for the proxy backend, read from the Vite environment */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';

/**
 * Generic fetch wrapper for the proxy API.
 * Throws descriptive errors for network failures and non-OK responses.
 *
 * @param path - API path including query string (e.g. `/api/search?q=eminem`)
 * @returns Parsed JSON response typed as T
 * @throws Error with a descriptive message on network or HTTP errors
 */
async function apiFetch<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`);
  } catch (err) {
    throw new Error(`Network error while fetching ${path}: ${String(err)}`);
  }

  if (!response.ok) {
    throw new Error(`API request failed for ${path}: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Validates and maps a raw API response object to an `ArtistResult`.
 * Returns null if required fields are missing or invalid.
 */
function sanitizeArtist(raw: unknown): ArtistResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) return null;
  return {
    id: r.id,
    name: typeof r.name === 'string' ? r.name : '',
    imageUrl: typeof r.imageUrl === 'string' ? r.imageUrl : '',
    genres: Array.isArray(r.genres) ? (r.genres as unknown[]).filter((g): g is string => typeof g === 'string') : [],
    followers: typeof r.followers === 'number' ? r.followers : 0,
  };
}

/**
 * Validates and maps a raw API response object to a `Track`.
 * Returns null if required fields (id) are missing or invalid.
 */
function sanitizeTrack(raw: unknown): Track | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) return null;
  return {
    id: r.id,
    name: typeof r.name === 'string' ? r.name : '',
    previewUrl: typeof r.previewUrl === 'string' && r.previewUrl.length > 0 ? r.previewUrl : null,
    artistName: typeof r.artistName === 'string' ? r.artistName : '',
    albumImageUrl: typeof r.albumImageUrl === 'string' ? r.albumImageUrl : '',
  };
}

/**
 * Searches for artists by name using the Deezer API (via proxy).
 * Returns at most 8 results.
 *
 * @param query - Search string (artist name)
 * @returns Array of up to 8 matching artists
 */
export async function searchArtists(query: string): Promise<ArtistResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const data = await apiFetch<{ artists: unknown[] }>(`/api/search?q=${encodedQuery}&limit=8`);

  const artists = Array.isArray(data.artists) ? data.artists : [];
  const sanitized = artists.map(sanitizeArtist).filter((a): a is ArtistResult => a !== null);
  return limitSearchResults(sanitized, 8);
}

/**
 * Fetches the top tracks for a Deezer artist (via proxy).
 * Returns only tracks that have a valid 30-second preview URL.
 *
 * @param artistId - Deezer artist ID
 * @returns Array of tracks with valid previews
 */
export async function getArtistTracks(artistId: string): Promise<Track[]> {
  const encodedId = encodeURIComponent(artistId);
  const data = await apiFetch<{ tracks: unknown[] }>(`/api/artist-tracks?artistId=${encodedId}`);

  const tracks = Array.isArray(data.tracks) ? data.tracks : [];
  const sanitized = tracks.map(sanitizeTrack).filter((t): t is Track => t !== null);
  return filterTracksWithPreview(sanitized);
}

/**
 * Fetches tracks from a Deezer playlist (via proxy).
 * Returns only tracks that have a valid 30-second preview URL,
 * along with the playlist's display name and cover image URL.
 *
 * @param playlistId - Deezer playlist ID
 * @returns Object with tracks array, playlist name, and playlist image URL
 */
export async function getPlaylistTracks(
  playlistId: string
): Promise<{ tracks: Track[]; playlistName: string; playlistImageUrl: string }> {
  const encodedId = encodeURIComponent(playlistId);
  const data = await apiFetch<{ tracks: unknown[]; playlistName: unknown; playlistImageUrl: unknown }>(
    `/api/playlist-tracks?playlistId=${encodedId}`
  );

  const tracks = Array.isArray(data.tracks) ? data.tracks : [];
  const sanitized = tracks.map(sanitizeTrack).filter((t): t is Track => t !== null);

  return {
    tracks: filterTracksWithPreview(sanitized),
    playlistName: typeof data.playlistName === 'string' ? data.playlistName : '',
    playlistImageUrl: typeof data.playlistImageUrl === 'string' ? data.playlistImageUrl : '',
  };
}
