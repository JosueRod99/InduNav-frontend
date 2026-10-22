import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

/**
 * Debounced autosave. `schedule` merges partial payloads (later keys win) and saves them
 * after `delay` ms without new changes. `flush` saves immediately (e.g. before switching item).
 */
export function useAutosave<T extends object>(save: (payload: T) => Promise<unknown>, delay = 700) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const pending = useRef<Partial<T> | null>(null);
  const timer = useRef<number | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(async () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const payload = pending.current;
    if (!payload) return;
    pending.current = null;
    setStatus('saving');
    try {
      await saveRef.current(payload as T);
      setStatus(pending.current ? 'pending' : 'saved');
    } catch {
      setStatus('error');
    }
  }, []);

  const schedule = useCallback(
    (patch: Partial<T>) => {
      pending.current = { ...(pending.current || {}), ...patch };
      setStatus('pending');
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, delay);
    },
    [delay, flush]
  );

  // Save whatever is pending when the component goes away
  useEffect(() => () => void flush(), [flush]);

  return { schedule, flush, status };
}
