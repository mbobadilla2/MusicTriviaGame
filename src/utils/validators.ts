/**
 * @file validators.ts
 * @description Pure utility functions for validating and filtering track data.
 *
 * These functions are used both in the API client (to sanitize responses)
 * and in the PreloadScreen (to verify there are enough playable tracks
 * before starting a game session).
 *
 * All functions are pure (no side effects) and are covered by property-based
 * tests in `validators.test.ts`.
 */

import type { Track } from '../types';

/**
 * Filters an array of tracks to only those with a valid preview URL.
 *
 * A preview URL is considered valid if it is a non-null, non-empty string.
 * Tracks without a preview cannot be used in the trivia game.
 *
 * @param tracks - Array of tracks to filter
 * @returns New array containing only tracks where `previewUrl` is a non-empty string
 */
export function filterTracksWithPreview(tracks: Track[]): Track[] {
  return tracks.filter(
    (track) => typeof track.previewUrl === 'string' && track.previewUrl.length > 0
  );
}

/**
 * Returns the first `max` elements of an array.
 * Used to cap search results to a maximum count.
 *
 * @param items - Array of any type
 * @param max - Maximum number of items to return
 * @returns Slice of `items` with at most `max` elements
 */
export function limitSearchResults<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}

/**
 * Checks whether there are at least `min` tracks in the array.
 * Used to verify a source has enough playable tracks before starting a session.
 * The game requires a minimum of 7 tracks with valid previews.
 *
 * @param tracks - Array of tracks to check
 * @param min - Minimum required count
 * @returns `true` if `tracks.length >= min`, `false` otherwise
 */
export function hasEnoughTracks(tracks: Track[], min: number): boolean {
  return tracks.length >= min;
}
