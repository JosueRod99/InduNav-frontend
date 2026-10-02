import apiClient from './client';

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // [lng, lat] format
}

export interface AreaPhysicalRepresentation {
  id: string;
  organizational_area_id: string;
  layout_id: string | null;
  geometry: GeoJSONPolygon;
  floor_level: number;
  display_name: string | null;
  display_color: string | null;
  created_at: Date;
  updated_at: Date;

  // Relations populated by backend
  organizational_area?: {
    id: string;
    name: string;
    code: string | null;
    area_type: string;
    color: string | null;
  };
  layout?: {
    id: string;
    layout_name: string;
    plant_id: string;
  };
}

export interface CreatePhysicalRepresentationRequest {
  organizational_area_id: string;
  layout_id: string | null;
  geometry: GeoJSONPolygon;
  floor_level?: number;
  display_name?: string;
  display_color?: string;
}

export interface UpdatePhysicalRepresentationRequest {
  geometry?: GeoJSONPolygon;
  floor_level?: number;
  display_name?: string;
  display_color?: string;
}

// Get all physical representations for an organizational area
export const getRepresentationsByArea = async (
  organizationalAreaId: string
): Promise<AreaPhysicalRepresentation[]> => {
  const { data } = await apiClient.get(
    `/organizational-areas/${organizationalAreaId}/representations`
  );
  return data.representations || [];
};

// Get all areas on a specific layout
export const getAreasByLayout = async (
  layoutId: string,
  floorLevel?: number
): Promise<AreaPhysicalRepresentation[]> => {
  const params = floorLevel !== undefined ? { floor_level: floorLevel } : {};
  const { data } = await apiClient.get(`/layouts/${layoutId}/areas`, { params });
  return data.representations || [];
};

// Get areas for a specific floor
export const getAreasForFloor = async (
  layoutId: string,
  floorLevel: number
): Promise<AreaPhysicalRepresentation[]> => {
  const { data } = await apiClient.get(`/layouts/${layoutId}/floors/${floorLevel}/areas`);
  return data.representations || [];
};

// Get single representation by ID
export const getRepresentation = async (id: string): Promise<AreaPhysicalRepresentation> => {
  const { data } = await apiClient.get(`/area-representations/${id}`);
  return data.representation || data;
};

// Create new physical representation
export const createRepresentation = async (
  areaId: string,
  payload: Omit<CreatePhysicalRepresentationRequest, 'organizational_area_id'>
): Promise<AreaPhysicalRepresentation> => {
  const { data } = await apiClient.post(`/organizational-areas/${areaId}/representations`, payload);
  return data.representation || data;
};

// Update physical representation
export const updateRepresentation = async (
  id: string,
  payload: UpdatePhysicalRepresentationRequest
): Promise<AreaPhysicalRepresentation> => {
  const { data } = await apiClient.patch(`/area-representations/${id}`, payload);
  return data.representation || data;
};

// Delete physical representation
export const deleteRepresentation = async (id: string): Promise<void> => {
  await apiClient.delete(`/area-representations/${id}`);
};

// Utility: Convert Leaflet coordinates to GeoJSON
export const leafletToGeoJSON = (leafletCoords: number[][]): GeoJSONPolygon => {
  // Leaflet uses [lat, lng], GeoJSON uses [lng, lat]
  const geoJsonCoords = leafletCoords.map(coord => [coord[1], coord[0]]);

  // Ensure polygon is closed (first point === last point)
  const closedCoords =
    JSON.stringify(geoJsonCoords[0]) === JSON.stringify(geoJsonCoords[geoJsonCoords.length - 1])
      ? geoJsonCoords
      : [...geoJsonCoords, geoJsonCoords[0]];

  return {
    type: 'Polygon',
    coordinates: [closedCoords]
  };
};

// Utility: Convert GeoJSON coordinates to Leaflet
export const geoJSONToLeaflet = (geoJson: GeoJSONPolygon): number[][] => {
  // GeoJSON uses [lng, lat], Leaflet uses [lat, lng]
  // First array in coordinates is the outer ring
  return geoJson.coordinates[0].map(coord => [coord[1], coord[0]]);
};
