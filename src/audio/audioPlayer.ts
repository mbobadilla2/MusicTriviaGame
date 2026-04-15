import type { Question } from '../types';

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

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

export function play(audioBlob: Blob): void {
  stop();

  const ctx = getAudioContext();

  // Try AudioContext path first (works reliably on iOS after unlock)
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer || !audioCtx) return;
      audioCtx.decodeAudioData(arrayBuffer, (buffer) => {
        if (!audioCtx) return;
        // Stop any previous source
        try { audioCtxSource?.stop(); } catch { /* already stopped */ }
        audioCtxSource = audioCtx.createBufferSource();
        audioCtxSource.buffer = buffer;
        audioCtxSource.connect(audioCtx.destination);
        audioCtxSource.start(0);
      }, () => {
        // Fallback to HTMLAudioElement if decoding fails
        playWithElement(audioBlob);
      });
    };
    reader.readAsArrayBuffer(audioBlob);
    return;
  }

  // Fallback: HTMLAudioElement
  playWithElement(audioBlob);
}

function playWithElement(audioBlob: Blob): void {
  currentObjectUrl = URL.createObjectURL(audioBlob);
  currentAudio = new Audio(currentObjectUrl);
  currentAudio.play().catch(() => {});
}

export function pause(): void {
  // Pause AudioContext source
  try { audioCtxSource?.stop(); } catch { /* already stopped */ }
  audioCtxSource = null;
  // Pause HTMLAudioElement fallback
  currentAudio?.pause();
}

export function stop(): void {
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
