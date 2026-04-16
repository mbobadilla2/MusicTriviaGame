/**
 * @file useTimer.ts
 * @description React hook for a high-precision countdown timer using requestAnimationFrame.
 *
 * ## Why requestAnimationFrame instead of setInterval?
 *
 * `setInterval` is throttled by the browser when the tab is in the background
 * and can drift over time. `requestAnimationFrame` provides a high-resolution
 * timestamp on every frame (~60fps), allowing the timer to calculate elapsed
 * time accurately regardless of frame rate or tab visibility.
 *
 * ## Implementation
 *
 * The timer stores the start timestamp on the first RAF tick and computes
 * `remaining = durationMs - (currentTimestamp - startTimestamp)` on each frame.
 * This approach is immune to frame rate variations.
 *
 * `activeRef` is used instead of state to control the RAF loop, avoiding
 * stale closure issues that would arise from using a boolean state variable
 * inside the `tick` callback.
 *
 * `onExpireRef` keeps the latest `onExpire` callback in a ref so the `tick`
 * function doesn't need to be recreated when the callback changes.
 */

import { useRef, useState, useCallback, useEffect } from 'react';

/** Return type of the useTimer hook */
export interface UseTimerReturn {
  /** Current remaining time in milliseconds (counts down from durationMs to 0) */
  timeMs: number;
  /** Pauses the countdown without resetting it */
  stop: () => void;
  /** Resets the countdown to durationMs and immediately starts it */
  resetAndStart: () => void;
}

/**
 * Countdown timer hook using requestAnimationFrame for smooth, accurate timing.
 *
 * @param durationMs - Total countdown duration in milliseconds
 * @param onExpire - Callback invoked exactly once when the timer reaches 0
 * @returns `{ timeMs, stop, resetAndStart }`
 *
 * @example
 * ```tsx
 * const { timeMs, stop, resetAndStart } = useTimer(10000, () => {
 *   console.log('Time is up!');
 * });
 * ```
 */
export function useTimer(durationMs: number, onExpire: () => void): UseTimerReturn {
  const [timeMs, setTimeMs] = useState(durationMs);

  /** Handle to the pending requestAnimationFrame call */
  const rafRef = useRef<number | null>(null);

  /** Timestamp of the first RAF tick for this run (null = not started yet) */
  const startTsRef = useRef<number | null>(null);

  /** Whether the timer is currently running (used inside RAF callback) */
  const activeRef = useRef(false);

  /** Always holds the latest onExpire callback to avoid stale closures */
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  /** Cancels the pending RAF without changing activeRef */
  const cancel = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  /**
   * RAF callback — called on every animation frame while the timer is active.
   * Computes remaining time and either schedules the next frame or fires onExpire.
   */
  const tick = useCallback((ts: number) => {
    if (!activeRef.current) return;

    // Capture start timestamp on the very first tick
    if (startTsRef.current === null) {
      startTsRef.current = ts;
    }

    const elapsed = ts - startTsRef.current;
    const remaining = Math.max(0, durationMs - elapsed);

    setTimeMs(remaining);

    if (remaining <= 0) {
      activeRef.current = false;
      onExpireRef.current();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  // durationMs is stable for the lifetime of a question — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs]);

  /** Stops the timer without resetting timeMs */
  const stop = useCallback(() => {
    activeRef.current = false;
    cancel();
  }, []);

  /**
   * Resets timeMs to durationMs and immediately starts the countdown.
   * Any previously running timer is cancelled first.
   */
  const resetAndStart = useCallback(() => {
    cancel();
    activeRef.current = true;
    startTsRef.current = null; // will be set on first tick
    setTimeMs(durationMs);
    rafRef.current = requestAnimationFrame(tick);
  }, [durationMs, tick]);

  /** Cleanup: cancel RAF when the component unmounts */
  useEffect(() => {
    return () => {
      activeRef.current = false;
      cancel();
    };
  }, []);

  return { timeMs, stop, resetAndStart };
}
