function getAudioContext(): AudioContext | null {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    return new Ctx();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue = 0.3
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(gainValue, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playCorrect(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(ctx, 523, t, 0.12);       // C5
  playTone(ctx, 659, t + 0.1, 0.15); // E5
  playTone(ctx, 784, t + 0.2, 0.2);  // G5
}

export function playWrong(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(ctx, 330, t, 0.15, 'sawtooth');       // E4
  playTone(ctx, 220, t + 0.12, 0.2, 'sawtooth'); // A3
}

export function playTimeout(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(ctx, 180, t, 0.3, 'sine', 0.25);
}

export function playGameStart(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    playTone(ctx, freq, t + i * 0.12, 0.15, 'triangle', 0.35);
  });
}

export function playHighScore(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const melody = [523, 659, 784, 659, 784, 1047, 784, 1047];
  melody.forEach((freq, i) => {
    playTone(ctx, freq, t + i * 0.1, 0.12, 'triangle', 0.3);
  });
}

export function playGameEnd(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(ctx, 440, t, 0.15);        // A4
  playTone(ctx, 392, t + 0.15, 0.15); // G4
  playTone(ctx, 349, t + 0.3, 0.3);   // F4
}
