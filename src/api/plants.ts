import apiClient from './client';
import type { Plant } from '../types';

export interface CreatePlantRequest {
  organization_id: string;
  name: string;
  slug?: string;
  location?: string;
  timezone?: string;
  settings?: Record<string, any>;
}

export interface UpdatePlantRequest {
  name?: string;
  slug?: string;
  location?: string;
  timezone?: string;
  is_active?: boolean;
  settings?: Record<string, any>;
}

export interface GetPlantsParams {
  page?: number;
  limit?: number;
  organization_id?: string;
  search?: string;
  is_active?: boolean;
}

export interface PlantsResponse {
  plants: Plant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get all plants with pagination
export const getPlants = async (params?: GetPlantsParams): Promise<PlantsResponse> => {
  const { data } = await apiClient.get('/plants', { params });
  return data;
};

// Get plant by ID
export const getPlant = async (id: string): Promise<Plant> => {
  const { data } = await apiClient.get(`/plants/${id}`);
  return data.plant;
};

// Get plants by organization
export const getPlantsByOrganization = async (organizationId: string): Promise<Plant[]> => {
  const { data } = await apiClient.get(`/plants/organization/${organizationId}`);
  return data.plants;
};

// Check slug availability
export const checkPlantSlugAvailability = async (
  organizationId: string,
  slug: string
): Promise<boolean> => {
  const { data } = await apiClient.get(`/plants/check-slug/${organizationId}/${slug}`);
  return data.available;
};

// Create plant
export const createPlant = async (payload: CreatePlantRequest): Promise<Plant> => {
  const { data } = await apiClient.post('/plants', payload);
  return data.plant;
};

// Update plant
export const updatePlant = async (id: string, payload: UpdatePlantRequest): Promise<Plant> => {
  const { data } = await apiClient.patch(`/plants/${id}`, payload);
  return data.plant;
};

// Soft delete plant
export const deletePlant = async (id: string): Promise<void> => {
  await apiClient.delete(`/plants/${id}`);
};

// Permanently delete plant
export const permanentlyDeletePlant = async (id: string): Promise<void> => {
  await apiClient.delete(`/plants/${id}/permanent`);
};
