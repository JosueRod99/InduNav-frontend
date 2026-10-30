// Floor of a plant layout: 0 ground floor, negative basements, positive upper floors

export const floorLabel = (level: number, language: 'es' | 'en' = 'es') => {
  if (level === 0) return language === 'es' ? 'Planta Baja' : 'Ground floor';
  if (level < 0) {
    const base = language === 'es' ? 'Sótano' : 'Basement';
    return level === -1 ? base : `${base} ${-level}`;
  }
  return `${language === 'es' ? 'Piso' : 'Floor'} ${level}`;
};

/** Floors in display order: ground floor first, then upper floors, then basements */
export const sortFloors = (levels: number[]) =>
  [...new Set(levels)].sort((a, b) => (a < 0) === (b < 0) ? Math.abs(a) - Math.abs(b) : a < 0 ? 1 : -1);
