// Approximate speaking rate of the narration voices, in characters per minute. Languages written
// without spaces say much more per character.
const CHARS_PER_MINUTE: Record<string, number> = { ja: 400, zh: 280, ko: 500 };
const DEFAULT_CHARS_PER_MINUTE = 900;

/** Estimated seconds of audio for a script */
export const narrationSeconds = (characters: number, language: string) =>
  Math.round((characters / (CHARS_PER_MINUTE[language.split('-')[0]] ?? DEFAULT_CHARS_PER_MINUTE)) * 60);
