// Where a visitor was in a tour, on this device. No personal data, and every read and write can fail
// (private windows, blocked storage): then the tour simply starts at its cover.
//   localStorage: survives closing the tab. Expires after a day without moving, or at the end of the tour.
//   sessionStorage: marks this tab as being inside the tour, which tells a reload (keep going) from
//   coming back later (the cover offers to continue: the device may be someone else's by then).

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface TourProgress {
  stopId: string; // not its position: republishing can change the order
  section: string | null;
  language: string;
  updatedAt: number;
}

// The preview apart, so a draft and the published tour do not mix
const keyFor = (tourId: string, isPreview: boolean) => `indunav-tour-progress:${tourId}:${isPreview ? 'preview' : 'published'}`;

export const tourProgress = (tourId: string, isPreview: boolean) => {
  const key = keyFor(tourId, isPreview);

  const clear = () => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // Nothing was saved
    }
  };

  return {
    read: (): TourProgress | null => {
      try {
        const saved = JSON.parse(localStorage.getItem(key) || 'null') as TourProgress | null;
        if (!saved?.stopId || typeof saved.updatedAt !== 'number') return null;
        if (Date.now() - saved.updatedAt > MAX_AGE_MS) {
          clear();
          return null;
        }
        return saved;
      } catch {
        return null;
      }
    },
    save: (progress: Omit<TourProgress, 'updatedAt'>) => {
      try {
        localStorage.setItem(key, JSON.stringify({ ...progress, updatedAt: Date.now() }));
        sessionStorage.setItem(key, '1');
      } catch {
        // The tour works the same, it just will not remember the place
      }
    },
    clear,
    isThisTabInside: () => {
      try {
        return sessionStorage.getItem(key) === '1';
      } catch {
        return false;
      }
    },
    leaveThisTab: () => {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // Nothing was saved
      }
    },
  };
};

export const isPageReload = () => {
  const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  return navigation?.type === 'reload';
};
