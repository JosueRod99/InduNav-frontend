// Time zone at some coordinates, computed in the browser (open data, no API). Loaded on demand:
// the boundaries data is only downloaded when an address is picked.
export const timezoneAt = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const tzlookup = (await import('@photostructure/tz-lookup')).default;
    return tzlookup(lat, lng);
  } catch {
    return null;
  }
};
