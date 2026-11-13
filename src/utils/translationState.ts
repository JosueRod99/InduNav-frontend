import type { Translations } from '../api/tourBuilder';

// State of each translated text, the same way the backend decides what to translate
// (backend services/tourTranslationService.ts and utils/textHash.ts: keep them in step).

export type TranslationMeta = Record<string, Record<string, string>>; // language -> output hash -> source hash
export type TranslationState = 'none' | 'missing' | 'auto' | 'outdated' | 'manual';

const LANGUAGE_CODE = /^[a-z]{2,3}(-[A-Z]{2}|-[A-Z][a-z]{3})?$/;

const fnv1a = (text: string, seed: number) => {
  let hash = seed;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
};

export const textHash = (text: string) => {
  const value = text.trim();
  return fnv1a(value, 0x811c9dc5) + fnv1a(value, 0x01000193);
};

export const translationState = (text: Translations | undefined, source: string, language: string, meta: TranslationMeta = {}): TranslationState => {
  const original = text?.[source]?.trim();
  if (!original || language === source) return 'none';
  const current = text?.[language]?.trim();
  if (!current) return 'missing';
  const sourceHash = meta[language]?.[textHash(current)];
  if (sourceHash === undefined) return 'manual';
  return sourceHash === textHash(original) ? 'auto' : 'outdated';
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

const collectTexts = (value: unknown, languages: string[], found: Translations[] = []): Translations[] => {
  if (Array.isArray(value)) value.forEach((item) => collectTexts(item, languages, found));
  else if (isPlainObject(value)) {
    const keys = Object.keys(value);
    const isText =
      keys.length > 0 && keys.every((k) => LANGUAGE_CODE.test(k) && typeof value[k] === 'string') && keys.some((k) => languages.includes(k));
    if (isText) found.push(value as Translations);
    else Object.values(value).forEach((item) => collectTexts(item, languages, found));
  }
  return found;
};

/** Texts the translator would fill in or update, per language */
export const pendingTranslations = (
  entities: { texts: unknown; meta?: TranslationMeta }[],
  source: string,
  languages: string[]
): Record<string, number> => {
  const pending: Record<string, number> = {};
  for (const { texts, meta } of entities) {
    for (const text of collectTexts(texts, languages)) {
      for (const language of languages) {
        const state = translationState(text, source, language, meta);
        if (state === 'missing' || state === 'outdated') pending[language] = (pending[language] || 0) + 1;
      }
    }
  }
  return pending;
};
