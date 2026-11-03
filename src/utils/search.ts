// Search boxes ignore accents and case: "jose" finds "José", "LOGISTICA" finds "Logística".

/** Lowercase without accents (ñ becomes n too, as people often type it without the tilde) */
export const normalizeSearch = (text: string | null | undefined) =>
  (text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Whether any of the values contains the query (an empty query matches everything) */
export const matchesSearch = (query: string, ...values: (string | null | undefined)[]) => {
  const q = normalizeSearch(query);
  return !q || values.some((v) => normalizeSearch(v).includes(q));
};
