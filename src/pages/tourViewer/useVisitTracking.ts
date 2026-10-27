import { useCallback, useEffect, useRef } from 'react';
import { API_URL } from '../../api/client';
import type { TourLanguage } from '../../api/tourBuilder';

// Anonymous visit tracking of the public tour viewer (PLAN_TOURS_REALES.md step 7).
// Few requests per visit: one when the tour opens, one when the visitor leaves or hides the tab,
// one at the end screen, and at most one every 2 minutes while moving between areas.
// No personal data: the session id is random and kept only in this tab (sessionStorage).

export type VisitSource = 'link' | 'slug' | 'qr';

interface Options {
  enabled: boolean; // false in the editor preview
  tourId: string;
  publicCode: string | null;
  source: VisitSource;
  entryStopId: string | null;
  language: TourLanguage;
  stopId: string | null; // area on screen (null on the cover and the end screen)
  finished: boolean;
}

type StopStats = { seconds: number; audio_seconds: number; audio_played: boolean };

const MIN_FLUSH_INTERVAL_MS = 2 * 60 * 1000;
const MAX_SEGMENT_SECONDS = 10 * 60; // a phone left open on one area counts 10 min at most

// randomUUID only exists on HTTPS/localhost (not when testing from a phone on the local network)
const randomId = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

const sessionIdFor = (tourId: string) => {
  const key = `indunav-visit:${tourId}`;
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = randomId();
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return randomId();
  }
};

export const useVisitTracking = ({ enabled, tourId, publicCode, source, entryStopId, language, stopId, finished }: Options) => {
  const sessionId = useRef<string | null>(null);
  const pending = useRef(new Map<string, StopStats>());
  const completed = useRef(false);
  const started = useRef(false); // first batch (the visit itself) sent
  const current = useRef<{ stopId: string | null; since: number | null }>({ stopId: null, since: null });
  const lastFlush = useRef(0);
  const languageRef = useRef(language);
  languageRef.current = language;

  const active = enabled && !!publicCode;

  const entry = (id: string) => {
    let stats = pending.current.get(id);
    if (!stats) {
      stats = { seconds: 0, audio_seconds: 0, audio_played: false };
      pending.current.set(id, stats);
    }
    return stats;
  };

  /** Adds the time spent on the current area since the last check */
  const accumulate = useCallback(() => {
    const { stopId: id, since } = current.current;
    const now = Date.now();
    if (id && since !== null) entry(id).seconds += Math.min((now - since) / 1000, MAX_SEGMENT_SECONDS);
    current.current.since = id && document.visibilityState === 'visible' ? now : null;
  }, []);

  const flush = useCallback(() => {
    if (!active) return;
    accumulate();
    const stops = [...pending.current.entries()]
      .map(([stop_id, s]) => ({ stop_id, seconds: Math.round(s.seconds), audio_seconds: Math.round(s.audio_seconds), audio_played: s.audio_played }))
      .filter((s) => s.seconds > 0 || s.audio_played);
    if (started.current && stops.length === 0 && !completed.current) return;

    sessionId.current ??= sessionIdFor(tourId);
    const body = JSON.stringify({
      session_id: sessionId.current,
      language: languageRef.current,
      source,
      entry_stop_id: entryStopId,
      completed: completed.current || undefined,
      stops,
    });
    pending.current.clear();
    started.current = true;
    lastFlush.current = Date.now();
    // text/plain + keepalive: no CORS preflight and it is delivered even while the page closes
    fetch(`${API_URL}/public/tours/${encodeURIComponent(publicCode!)}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [active, accumulate, tourId, publicCode, source, entryStopId]);

  // The visit counts as soon as the tour opens
  useEffect(() => {
    if (active && !started.current) flush();
  }, [active, flush]);

  // Area changes: close the previous area's time and start the new one
  useEffect(() => {
    if (!active) return;
    accumulate();
    current.current = { stopId, since: stopId && document.visibilityState === 'visible' ? Date.now() : null };
    if (Date.now() - lastFlush.current > MIN_FLUSH_INTERVAL_MS) flush();
  }, [active, stopId, accumulate, flush]);

  useEffect(() => {
    if (!active || !finished || completed.current) return;
    completed.current = true;
    flush();
  }, [active, finished, flush]);

  // Leaving or hiding the tab sends what is pending; time does not run while hidden
  useEffect(() => {
    if (!active) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
      else if (current.current.stopId) current.current.since = Date.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      flush(); // leaving the viewer inside the app
    };
  }, [active, flush]);

  /** Narration listened on the current area (seconds of real playback) */
  const onNarration = useCallback(
    (seconds: number) => {
      const id = current.current.stopId;
      if (!active || !id) return;
      const stats = entry(id);
      stats.audio_played = true;
      stats.audio_seconds += seconds;
    },
    [active]
  );

  return { onNarration };
};
