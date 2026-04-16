import type { Question } from '../types';

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
let onEndedCallback: (() => void) | null = null;
// Incremented on every stop/pause so async play callbacks can detect cancellation
let playToken = 0;

// iOS Safari requires AudioContext to be resumed from a user gesture.
// We create it once and resume it on the first user interaction.
let audioCtx: AudioContext | null = null;
let audioCtxSource: AudioBufferSourceNode | null = null;

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
 * Call this from a user gesture (button tap) to unlock audio on iOS.
 * Safe to call multiple times.
 */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

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
        question.track.previewUrl = null;
      }

      loaded++;
      onProgress(loaded, total);
    })
  );

  // Preload all unique album images into the browser cache so they render
  // instantly during the game — fire-and-forget, failures are silently ignored.
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
          img.onerror = () => resolve(); // ignore failures
          img.src = url;
        })
    )
  );
}

export function play(audioBlob: Blob, onEnded?: () => void): void {
  stop();
  onEndedCallback = onEnded ?? null;
  const token = ++playToken; // capture current token for this play call

  const ctx = getAudioContext();

  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // If stop/pause was called after this play(), abort
      if (token !== playToken) return;

      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer || !audioCtx) return;
      audioCtx.decodeAudioData(arrayBuffer, (buffer) => {
        // Check again after async decode
        if (token !== playToken || !audioCtx) return;

        try { audioCtxSource?.stop(); } catch { /* already stopped */ }
        audioCtxSource = audioCtx.createBufferSource();
        audioCtxSource.buffer = buffer;
        audioCtxSource.connect(audioCtx.destination);
        audioCtxSource.onended = () => {
          if (token !== playToken) return; // was stopped manually
          audioCtxSource = null;
          const cb = onEndedCallback;
          onEndedCallback = null;
          cb?.();
        };
        audioCtxSource.start(0);
      }, () => {
        if (token !== playToken) return;
        playWithElement(audioBlob, onEnded);
      });
    };
    reader.readAsArrayBuffer(audioBlob);
    return;
  }

  playWithElement(audioBlob, onEnded);
}

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

export function pause(): void {
  playToken++; // cancel any in-flight play
  try { audioCtxSource?.stop(); } catch { /* already stopped */ }
  audioCtxSource = null;
  currentAudio?.pause();
}

export function stop(): void {
  playToken++; // cancel any in-flight play
  onEndedCallback = null;
  // Stop AudioContext source
  try { audioCtxSource?.stop(); } catch { /* already stopped */ }
  audioCtxSource = null;
  // Stop HTMLAudioElement fallback
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

export const AudioPlayer = { preloadAudio, play, pause, stop, unlockAudio };
