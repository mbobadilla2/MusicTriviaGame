/**
 * @file audioPlayer.ts
 * @description Audio playback module for the Music Trivia game.
 *
 * ## Architecture
 *
 * This module manages two audio backends:
 *
 * 1. **Web Audio API (`AudioContext` + `AudioBufferSourceNode`)** — Primary path.
 *    Used because iOS Safari blocks `HTMLAudioElement.play()` unless called
 *    synchronously from a user gesture. Once the `AudioContext` is unlocked
 *    via `unlockAudio()` (called from a button tap), it can play audio from
 *    any context — including `useEffect` callbacks and `setTimeout` handlers.
 *
 * 2. **`HTMLAudioElement`** — Fallback path.
 *    Used if `AudioContext` is unavailable (very old browsers) or if
 *    `decodeAudioData` fails for a specific blob.
 *
 * ## Cancellation Token Pattern
 *
 * `play()` is asynchronous: it reads the blob with `FileReader` and then
 * decodes it with `decodeAudioData`, both of which are async operations.
 * If `pause()` or `stop()` is called while these are in flight, the audio
 * must NOT start playing when the async callbacks eventually fire.
 *
 * This is solved with `playToken`: an integer incremented on every `stop()`
 * and `pause()`. Each `play()` call captures the token at the time it starts.
 * Before starting playback, the async callbacks check whether the token still
 * matches — if not, they abort silently.
 *
 * ## Preloading
 *
 * `preloadAudio()` downloads all 7 track previews as `Blob` objects before
 * the game starts, storing them in `question.audioBlob`. This ensures zero
 * network latency during gameplay. Album images are also preloaded into the
 * browser's HTTP cache using `new Image()`.
 */

import type { Question } from '../types';

/** Currently playing HTMLAudioElement (fallback path only) */
let currentAudio: HTMLAudioElement | null = null;

/** Object URL created for the current HTMLAudioElement (must be revoked on stop) */
let currentObjectUrl: string | null = null;

/** Callback to invoke when the current audio finishes playing naturally */
let onEndedCallback: (() => void) | null = null;

/**
 * Cancellation token. Incremented on every `stop()` and `pause()`.
 * Async play callbacks compare against this to detect if they've been cancelled.
 */
let playToken = 0;

/** Shared AudioContext instance (created once, reused for all playback) */
let audioCtx: AudioContext | null = null;

/** Currently playing AudioBufferSourceNode (Web Audio API path) */
let audioCtxSource: AudioBufferSourceNode | null = null;

/**
 * Returns the shared AudioContext, creating it on first call.
 * Handles the `webkitAudioContext` prefix for older Safari versions.
 * Returns null if the Web Audio API is not available.
 */
function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Unlocks the Web Audio API on iOS Safari.
 *
 * iOS requires that `AudioContext.resume()` be called synchronously from
 * a user gesture (tap/click). Call this function directly inside a button's
 * `onClick` handler — before any async operations — to unlock audio for the
 * entire session.
 *
 * Safe to call multiple times; subsequent calls are no-ops.
 */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Fetches a URL and returns its content as a Blob.
 * Retries once on failure before giving up.
 *
 * @param url - The URL to fetch
 * @returns The response Blob, or null if both attempts fail
 */
async function fetchWithRetry(url: string): Promise<Blob | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.blob();
    } catch {
      if (attempt === 1) return null;
    }
  }
  return null;
}

/**
 * Preloads all audio previews and album images before the game starts.
 *
 * For each question:
 * - Downloads the track preview as a Blob and stores it in `question.audioBlob`.
 * - If the download fails after one retry, sets `question.track.previewUrl = null`
 *   to mark the track as unavailable.
 *
 * After all audio is loaded, preloads all unique album image URLs into the
 * browser's HTTP cache using `new Image()`, so they render instantly during
 * gameplay. Image failures are silently ignored.
 *
 * @param questions - The 7 questions for the session (mutated in place)
 * @param onProgress - Called after each download with (loaded, total) counts
 */
export async function preloadAudio(
  questions: Question[],
  onProgress: (loaded: number, total: number) => void
): Promise<void> {
  const total = questions.length;
  let loaded = 0;

  await Promise.all(
    questions.map(async (question) => {
      const url = question.track.previewUrl;
      if (!url) {
        loaded++;
        onProgress(loaded, total);
        return;
      }

      const blob = await fetchWithRetry(url);
      if (blob) {
        question.audioBlob = blob;
      } else {
        question.track.previewUrl = null; // mark as unavailable
      }

      loaded++;
      onProgress(loaded, total);
    })
  );

  // Preload album images into browser cache (fire-and-forget)
  const imageUrls = new Set<string>();
  for (const q of questions) {
    if (q.track.albumImageUrl) imageUrls.add(q.track.albumImageUrl);
    for (const t of q.optionTracks ?? []) {
      if (t.albumImageUrl) imageUrls.add(t.albumImageUrl);
    }
  }
  await Promise.allSettled(
    [...imageUrls].map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  );
}

/**
 * Plays an audio blob using the Web Audio API (primary) or HTMLAudioElement (fallback).
 *
 * Stops any currently playing audio before starting the new one.
 * Uses the cancellation token pattern to safely handle async decode:
 * if `stop()` or `pause()` is called before decoding completes, the
 * audio will not start.
 *
 * @param audioBlob - The preloaded audio blob to play
 * @param onEnded - Optional callback invoked when playback ends naturally
 *                  (not called if stopped/paused manually)
 */
export function play(audioBlob: Blob, onEnded?: () => void): void {
  stop();
  onEndedCallback = onEnded ?? null;
  const token = ++playToken; // capture token for cancellation checks

  const ctx = getAudioContext();

  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (token !== playToken) return; // cancelled while reading

      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer || !audioCtx) return;

      audioCtx.decodeAudioData(arrayBuffer, (buffer) => {
        if (token !== playToken || !audioCtx) return; // cancelled while decoding

        try { audioCtxSource?.stop(); } catch { /* already stopped */ }

        audioCtxSource = audioCtx.createBufferSource();
        audioCtxSource.buffer = buffer;
        audioCtxSource.connect(audioCtx.destination);
        audioCtxSource.onended = () => {
          if (token !== playToken) return; // was stopped manually — don't fire callback
          audioCtxSource = null;
          const cb = onEndedCallback;
          onEndedCallback = null;
          cb?.();
        };
        audioCtxSource.start(0);
      }, () => {
        // decodeAudioData failed — fall back to HTMLAudioElement
        if (token !== playToken) return;
        playWithElement(audioBlob, onEnded);
      });
    };
    reader.readAsArrayBuffer(audioBlob);
    return;
  }

  // Web Audio API not available — use HTMLAudioElement directly
  playWithElement(audioBlob, onEnded);
}

/**
 * Fallback playback using HTMLAudioElement.
 * Creates an object URL from the blob, plays it, and registers the onEnded listener.
 *
 * @param audioBlob - The audio blob to play
 * @param onEnded - Optional callback for natural end of playback
 */
function playWithElement(audioBlob: Blob, onEnded?: () => void): void {
  currentObjectUrl = URL.createObjectURL(audioBlob);
  currentAudio = new Audio(currentObjectUrl);
  if (onEnded) {
    currentAudio.addEventListener('ended', () => {
      const cb = onEndedCallback;
      onEndedCallback = null;
      cb?.();
    }, { once: true });
  }
  currentAudio.play().catch(() => {});
}

/**
 * Pauses the currently playing audio without releasing resources.
 * Increments the cancellation token to abort any in-flight async play operations.
 *
 * Note: `AudioBufferSourceNode` cannot be truly "paused" — it is stopped and
 * would need to be recreated to resume from the same position. For this app,
 * pausing is equivalent to stopping since previews are short and non-resumable.
 */
export function pause(): void {
  playToken++; // cancel any in-flight play
  try { audioCtxSource?.stop(); } catch { /* already stopped */ }
  audioCtxSource = null;
  currentAudio?.pause();
}

/**
 * Stops all audio playback and releases associated resources.
 * - Increments the cancellation token.
 * - Clears the onEnded callback.
 * - Stops and nullifies the AudioBufferSourceNode.
 * - Pauses and nullifies the HTMLAudioElement.
 * - Revokes the object URL to free memory.
 */
export function stop(): void {
  playToken++; // cancel any in-flight play
  onEndedCallback = null;
  try { audioCtxSource?.stop(); } catch { /* already stopped */ }
  audioCtxSource = null;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

/** Public API surface for the audio player module */
export const AudioPlayer = { preloadAudio, play, pause, stop, unlockAudio };
