import type { Track } from '../types';
import { filterTracksWithPreview, limitSearchResults } from '../utils/validators';

export interface ArtistResult {
  id: string;
  name: string;
  imageUrl: string;
  genres: string[];
  followers: number;
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';

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
 * Search artists by query. Returns at most 8 results.
 */
export async function searchArtists(query: string): Promise<ArtistResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const data = await apiFetch<{ artists: unknown[] }>(`/api/search?q=${encodedQuery}&limit=8`);

  const artists = Array.isArray(data.artists) ? data.artists : [];
  const sanitized = artists.map(sanitizeArtist).filter((a): a is ArtistResult => a !== null);
  return limitSearchResults(sanitized, 8);
}

/**
 * Get tracks for an artist. Returns only tracks with a valid previewUrl.
 */
export async function getArtistTracks(artistId: string): Promise<Track[]> {
  const encodedId = encodeURIComponent(artistId);
  const data = await apiFetch<{ tracks: unknown[] }>(`/api/artist-tracks?artistId=${encodedId}`);

  const tracks = Array.isArray(data.tracks) ? data.tracks : [];
  const sanitized = tracks.map(sanitizeTrack).filter((t): t is Track => t !== null);
  return filterTracksWithPreview(sanitized);
}

/**
 * Get tracks for a playlist. Returns only tracks with a valid previewUrl.
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
