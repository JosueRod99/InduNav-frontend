// Where the tour editor's back arrow goes: the tours list the tour was opened from (the global
// /tours page or the Tours tab of its plant). Kept per browser tab, so it survives going through
// the editor, statistics, QR sheet and preview, and reloading the page.

const KEY = 'indunav-tours-list';

export const rememberToursList = (path: string) => {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // storage blocked: the editor falls back to /tours
  }
};

export const toursListPath = (tourPlantId: string | undefined) => {
  let saved: string | null = null;
  try {
    saved = sessionStorage.getItem(KEY);
  } catch {
    // ignore
  }
  if (saved && tourPlantId && saved === `/plants/${tourPlantId}/tours`) return saved;
  return '/tours';
};
