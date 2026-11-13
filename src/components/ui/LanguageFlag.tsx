import { useState } from 'react';

// Flag of a language (public/flags/<code>.png). Decorative: the name or code always goes next to it.
// A language added to the catalog without its image simply shows none.

const LanguageFlag = ({ code, className = 'h-4 w-4' }: { code: string; className?: string }) => {
  const [missing, setMissing] = useState<string | null>(null);
  if (missing === code) return null;
  return (
    <img
      src={`/flags/${encodeURIComponent(code)}.png`}
      alt=""
      loading="lazy"
      onError={() => setMissing(code)}
      className={`flex-shrink-0 object-contain ${className}`}
    />
  );
};

export default LanguageFlag;
