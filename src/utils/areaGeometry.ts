import type { AreaGeometry, GeoJSONPolygon } from '../api/areaRepresentations';

// An area is drawn as one zone (GeoJSON Polygon) or several zones that are not next to each
// other (MultiPolygon). Everything that reads an area's shape goes through these helpers.
// A zone is the outer ring of a polygon, GeoJSON [x, y] in layout coordinates, closed
// (last point = first point).

export type Ring = number[][];

/** Outer ring of every zone of the area (empty if the geometry is missing or malformed) */
export const zonesOf = (geometry: AreaGeometry | null | undefined): Ring[] => {
  if (!geometry || !Array.isArray(geometry.coordinates)) return [];
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((polygon) => polygon?.[0]).filter((ring): ring is Ring => Array.isArray(ring) && ring.length >= 3);
  }
  const ring = geometry.coordinates[0];
  return Array.isArray(ring) && ring.length >= 3 ? [ring] : [];
};

/** Geometry from zones: a single zone is stored as a Polygon */
export const geometryFromZones = (zones: Ring[]): AreaGeometry =>
  zones.length === 1 ? { type: 'Polygon', coordinates: [zones[0]] } : { type: 'MultiPolygon', coordinates: zones.map((ring) => [ring]) };

/** Closed GeoJSON ring from the points of the Leaflet editor ([lat, lng] = [y, x]) */
export const ringFromLeaflet = (points: number[][]): Ring => {
  const ring = points.map(([lat, lng]) => [lng, lat]);
  const [first, last] = [ring[0], ring[ring.length - 1]];
  return first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first];
};

/** Surface of a ring (shoelace formula), in layout units² */
export const ringArea = (ring: Ring) =>
  Math.abs(
    ring.reduce((sum, [x1, y1], i) => {
      const [x2, y2] = ring[(i + 1) % ring.length];
      return sum + (x1 * y2 - x2 * y1);
    }, 0),
  ) / 2;

/** Center of the ring's bounding box */
export const ringCenter = (ring: Ring): [number, number] => {
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
};

/** Largest zone: where a single marker for the area goes (route of the tour, etc.) */
export const mainZone = (geometry: AreaGeometry | null | undefined): Ring | null => {
  const zones = zonesOf(geometry);
  return zones.length ? zones.reduce((a, b) => (ringArea(b) > ringArea(a) ? b : a)) : null;
};

/** Bounding box of every zone together */
export const zonesBounds = (zones: Ring[]) => {
  const points = zones.flat();
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
};

/** One zone as a Polygon, for the point-by-point editor */
export const zoneAsPolygon = (geometry: AreaGeometry, zoneIndex: number): GeoJSONPolygon => ({
  type: 'Polygon',
  coordinates: [zonesOf(geometry)[zoneIndex] ?? []],
});

export const replaceZone = (geometry: AreaGeometry, zoneIndex: number, ring: Ring): AreaGeometry =>
  geometryFromZones(zonesOf(geometry).map((zone, i) => (i === zoneIndex ? ring : zone)));

export const addZone = (geometry: AreaGeometry, ring: Ring): AreaGeometry => geometryFromZones([...zonesOf(geometry), ring]);

/** The last zone cannot be removed: deleting the whole drawing is a separate action */
export const removeZone = (geometry: AreaGeometry, zoneIndex: number): AreaGeometry => {
  const zones = zonesOf(geometry);
  if (zones.length <= 1) throw new Error('El área debe conservar al menos una zona');
  return geometryFromZones(zones.filter((_, i) => i !== zoneIndex));
};
