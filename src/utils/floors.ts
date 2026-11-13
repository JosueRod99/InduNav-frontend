// Floor of a plant layout: 0 ground floor, negative basements, positive upper floors

export const floorLabel = (level: number) => {
  if (level === 0) return 'Planta Baja';
  if (level < 0) return level === -1 ? 'Sótano' : `Sótano ${-level}`;
  return `Piso ${level}`;
};

/** Floors in display order: ground floor first, then upper floors, then basements */
export const sortFloors = (levels: number[]) =>
  [...new Set(levels)].sort((a, b) => (a < 0) === (b < 0) ? Math.abs(a) - Math.abs(b) : a < 0 ? 1 : -1);
