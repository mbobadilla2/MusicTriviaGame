import type { Question } from '../types';

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

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
}

export function play(audioBlob: Blob): void {
  stop();
  currentObjectUrl = URL.createObjectURL(audioBlob);
  currentAudio = new Audio(currentObjectUrl);
  currentAudio.play().catch(() => {
    // Ignore autoplay errors silently
  });
}

export function pause(): void {
  currentAudio?.pause();
}

export function stop(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

export const AudioPlayer = { preloadAudio, play, pause, stop };
