import { useRef, useState, useCallback, useEffect } from 'react';

export interface UseTimerReturn {
  timeMs: number;
  stop: () => void;
  resetAndStart: () => void;
}

/**
 * useTimer — countdown from durationMs to 0 using requestAnimationFrame.
 * Calls onExpire() exactly once when time runs out.
 */
export function useTimer(durationMs: number, onExpire: () => void): UseTimerReturn {
  const [timeMs, setTimeMs] = useState(durationMs);

  const rafRef = useRef<number | null>(null);
  const startTsRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const cancel = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const tick = useCallback((ts: number) => {
    if (!activeRef.current) return;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs]);

  const stop = useCallback(() => {
    activeRef.current = false;
    cancel();
  }, []);

  const resetAndStart = useCallback(() => {
    cancel();
    activeRef.current = true;
    startTsRef.current = null;
    setTimeMs(durationMs);
    rafRef.current = requestAnimationFrame(tick);
  }, [durationMs, tick]);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      cancel();
    };
  }, []);

  return { timeMs, stop, resetAndStart };
}
