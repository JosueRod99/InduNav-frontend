import apiClient from './client';

export interface PlantLayout {
  id: string;
  plant_id: string;
  layout_name: string;
  layout_image_url: string | null;
  layout_data: Record<string, any>;
  floor_level: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PlantArea {
  id: string;
  plant_id: string;
  layout_id: string | null;
  name: string;
  description: string | null;
  area_type: string;
  geometry: Record<string, any>;
  floor_level: number;
  color: string;
  capacity: number | null;
  square_meters: number | null;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLayoutRequest {
  plant_id: string;
  layout_name: string;
  layout_image_url?: string;
  layout_data?: Record<string, any>;
  floor_level?: number;
}

export interface UpdateLayoutRequest {
  layout_name?: string;
  layout_image_url?: string;
  layout_data?: Record<string, any>;
  floor_level?: number;
  is_active?: boolean;
}

export interface CreateAreaRequest {
  plant_id: string;
  layout_id?: string;
  name: string;
  description?: string;
  area_type?: string;
  geometry: Record<string, any>;
  floor_level?: number;
  color?: string;
  capacity?: number;
  square_meters?: number;
  metadata?: Record<string, any>;
}

export interface UpdateAreaRequest {
  name?: string;
  description?: string;
  area_type?: string;
  geometry?: Record<string, any>;
  color?: string;
  capacity?: number;
  square_meters?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

// Layouts
export const getLayouts = async (params?: { plant_id?: string; floor_level?: number; is_active?: boolean }): Promise<PlantLayout[]> => {
  const { data } = await apiClient.get('/layouts', { params });
  return data.layouts || data;
};

export const getLayout = async (id: string): Promise<PlantLayout> => {
  const { data } = await apiClient.get(`/layouts/${id}`);
  return data.layout || data;
};

export const getLayoutByPlantAndFloor = async (plantId: string, floorLevel: number): Promise<PlantLayout> => {
  const { data } = await apiClient.get(`/layouts/plant/${plantId}/floor/${floorLevel}`);
  return data.layout || data;
};

export const createLayout = async (payload: CreateLayoutRequest): Promise<PlantLayout> => {
  const { data } = await apiClient.post('/layouts', payload);
  return data.layout || data;
};

export const updateLayout = async (id: string, payload: UpdateLayoutRequest): Promise<PlantLayout> => {
  const { data } = await apiClient.patch(`/layouts/${id}`, payload);
  return data.layout || data;
};

export const deleteLayout = async (id: string): Promise<void> => {
  await apiClient.delete(`/layouts/${id}`);
};

// Areas
export const getAreas = async (params?: { plant_id?: string; layout_id?: string; area_type?: string; floor_level?: number; is_active?: boolean }): Promise<PlantArea[]> => {
  const { data } = await apiClient.get('/areas', { params });
  return data.areas || data;
};

export const getArea = async (id: string): Promise<PlantArea> => {
  const { data } = await apiClient.get(`/areas/${id}`);
  return data.area || data;
};

export const getAreasByPlant = async (plantId: string): Promise<PlantArea[]> => {
  const { data } = await apiClient.get(`/areas/plant/${plantId}`);
  return data.areas || data;
};

export const createArea = async (payload: CreateAreaRequest): Promise<PlantArea> => {
  const { data } = await apiClient.post('/areas', payload);
  return data.area || data;
};

export const updateArea = async (id: string, payload: UpdateAreaRequest): Promise<PlantArea> => {
  const { data } = await apiClient.patch(`/areas/${id}`, payload);
  return data.area || data;
};

export const deleteArea = async (id: string): Promise<void> => {
  await apiClient.delete(`/areas/${id}`);
};
