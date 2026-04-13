import { describe, expect, it } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import { filterTracksWithPreview, limitSearchResults, hasEnoughTracks } from './validators';
import type { Track } from '../types';

// Arbitrary for a Track with a controllable previewUrl
const validPreviewUrl = fc.oneof(
  fc.webUrl(),
  fc.constantFrom('https://example.com/preview.mp3', 'https://cdn.deezer.com/track.mp3')
);

const invalidPreviewUrl = fc.oneof(
  fc.constant(null),
  fc.constant(''),
  fc.constant(undefined as unknown as null)
);

const trackArb = (previewUrl: fc.Arbitrary<string | null>): fc.Arbitrary<Track> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1 }),
    previewUrl,
    artistName: fc.string({ minLength: 1 }),
    albumImageUrl: fc.string(),
  });

const validTrackArb = trackArb(validPreviewUrl);
const invalidTrackArb = trackArb(invalidPreviewUrl);

// ─── Propiedad 1: Límite de resultados de búsqueda ───────────────────────────
// Feature: music-trivia-game, Propiedad 1: Para cualquier lista de artistas de cualquier tamaño,
// limitSearchResults retorna máximo 8 elementos
// Valida: Requisito 1.2
describe('limitSearchResults', () => {
  test.prop(
    [fc.array(fc.record({ id: fc.uuid(), name: fc.string() }))],
    { numRuns: 100 }
  )('Propiedad 1: retorna máximo 8 elementos para cualquier array de entrada', (items) => {
    const result = limitSearchResults(items, 8);
    expect(result.length).toBeLessThanOrEqual(8);
  });

  test.prop(
    [fc.array(fc.record({ id: fc.uuid(), name: fc.string() }), { minLength: 8 })],
    { numRuns: 100 }
  )('Propiedad 1 (array >= 8): retorna exactamente 8 elementos', (items) => {
    const result = limitSearchResults(items, 8);
    expect(result.length).toBe(8);
  });

  test.prop(
    [fc.array(fc.record({ id: fc.uuid(), name: fc.string() }), { maxLength: 7 })],
    { numRuns: 100 }
  )('Propiedad 1 (array < 8): retorna todos los elementos', (items) => {
    const result = limitSearchResults(items, 8);
    expect(result.length).toBe(items.length);
  });
});

// ─── Propiedad 2: Validación de canciones insuficientes ──────────────────────
// Feature: music-trivia-game, Propiedad 2: Para cualquier lista con menos de 7 tracks con
// preview válido, hasEnoughTracks retorna false
// Valida: Requisito 1.8
describe('hasEnoughTracks', () => {
  test.prop(
    [
      fc.integer({ min: 0, max: 6 }).chain((validCount) =>
        fc.tuple(
          fc.array(validTrackArb, { minLength: validCount, maxLength: validCount }),
          fc.array(invalidTrackArb, { minLength: 0, maxLength: 10 })
        ).map(([valid, invalid]) => [...valid, ...invalid])
      ),
    ],
    { numRuns: 100 }
  )('Propiedad 2: retorna false cuando hay menos de 7 tracks con preview válido', (tracks) => {
    // Filter to only valid-preview tracks to count them
    const validTracks = tracks.filter(
      (t) => typeof t.previewUrl === 'string' && t.previewUrl.length > 0
    );
    // We built the array with < 7 valid tracks
    expect(validTracks.length).toBeLessThan(7);
    // hasEnoughTracks checks the array length directly; we pass only valid tracks
    expect(hasEnoughTracks(validTracks, 7)).toBe(false);
  });

  test.prop(
    [fc.array(validTrackArb, { minLength: 7, maxLength: 20 })],
    { numRuns: 100 }
  )('retorna true cuando hay >= 7 tracks', (tracks) => {
    expect(hasEnoughTracks(tracks, 7)).toBe(true);
  });
});

// ─── Propiedad 17: Filtro de tracks con preview válido ───────────────────────
// Feature: music-trivia-game, Propiedad 17: Para cualquier lista de tracks con mezcla de
// previewUrl válidos e inválidos, filterTracksWithPreview retorna únicamente tracks con
// previewUrl string no nulo y no vacío
// Valida: Requisito 10.7
describe('filterTracksWithPreview', () => {
  test.prop(
    [fc.array(fc.oneof(validTrackArb, invalidTrackArb))],
    { numRuns: 100 }
  )('Propiedad 17: todos los tracks retornados tienen previewUrl string no nulo y no vacío', (tracks) => {
    const result = filterTracksWithPreview(tracks);
    for (const track of result) {
      expect(typeof track.previewUrl).toBe('string');
      expect((track.previewUrl as string).length).toBeGreaterThan(0);
    }
  });

  test.prop(
    [fc.array(fc.oneof(validTrackArb, invalidTrackArb))],
    { numRuns: 100 }
  )('Propiedad 17: no se pierde ningún track con preview válido', (tracks) => {
    const validCount = tracks.filter(
      (t) => typeof t.previewUrl === 'string' && t.previewUrl.length > 0
    ).length;
    const result = filterTracksWithPreview(tracks);
    expect(result.length).toBe(validCount);
  });

  it('retorna array vacío cuando todos los tracks tienen previewUrl inválido', () => {
    const tracks: Track[] = [
      { id: '1', name: 'A', previewUrl: null, artistName: 'X', albumImageUrl: '' },
      { id: '2', name: 'B', previewUrl: '', artistName: 'X', albumImageUrl: '' },
    ];
    expect(filterTracksWithPreview(tracks)).toHaveLength(0);
  });

  it('retorna todos los tracks cuando todos tienen previewUrl válido', () => {
    const tracks: Track[] = [
      { id: '1', name: 'A', previewUrl: 'https://example.com/a.mp3', artistName: 'X', albumImageUrl: '' },
      { id: '2', name: 'B', previewUrl: 'https://example.com/b.mp3', artistName: 'X', albumImageUrl: '' },
    ];
    expect(filterTracksWithPreview(tracks)).toHaveLength(2);
  });
});
