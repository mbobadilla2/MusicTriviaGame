import type { Track } from '../types';

/**
 * Filters tracks that have a valid (non-null, non-empty) previewUrl.
 */
export function filterTracksWithPreview(tracks: Track[]): Track[] {
  return tracks.filter(
    (track) => typeof track.previewUrl === 'string' && track.previewUrl.length > 0
  );
}

/**
 * Returns the first `max` elements of the array.
 */
export function limitSearchResults<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}

/**
 * Returns true if there are at least `min` tracks in the array.
 */
export function hasEnoughTracks(tracks: Track[], min: number): boolean {
  return tracks.length >= min;
}
