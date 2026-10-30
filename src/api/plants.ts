import apiClient from './client';
import type { Plant } from '../types';
import type { AddressDetails } from '../utils/googlePlaces';

export interface CreatePlantRequest {
  organization_id: string;
  name: string;
  slug?: string;
  location?: string;
  timezone?: string;
  address?: string | null;
  address_details?: AddressDetails | null;
  settings?: Record<string, any>;
}

export interface UpdatePlantRequest {
  name?: string;
  slug?: string;
  location?: string;
  timezone?: string;
  is_active?: boolean;
  settings?: Record<string, any>;
  description?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  address?: string | null;
  address_details?: AddressDetails | null;
}

// Plant "Resumen" tab. Fields the user's role cannot see come back null/empty.
export interface PlantSummary {
  counts: {
    areas: number;
    products: number | null;
    employees: number;
    headcount: number; // people counted by position, without names
    tours: number;
    tours_published: number;
    equipment_by_status: Partial<Record<'active' | 'maintenance' | 'out_of_service' | 'retired', number>> | null;
  };
  alerts: {
    equipment: { id: string; code: string; name: string; status: 'maintenance' | 'out_of_service'; updated_at: string }[];
    certifications: {
      id: string;
      certification_name: string;
      expiry_date: string | null;
      next_audit_date: string | null;
      area_id: string;
      area_name: string;
      kind: 'expired' | 'expiring' | 'audit';
    }[];
    without_supervisor: { total: number; areas: { id: string; name: string }[] };
    certified_people: { type_id: string; name: string; expiring: number; expired: number }[]; // people certifications to renew
  };
  tours: {
    visits_30d: number;
    visits_prev_30d: number;
    top: { id: string; title: string; status: string; visits_30d: number }[];
  };
  activity:
    | {
        id: string;
        method: string;
        action: string;
        kind: 'plant' | 'area' | 'equipment' | 'product' | 'tour' | 'stop' | 'employee' | 'layout';
        entity_id: string;
        entity_name: string | null;
        tour_id: string | null;
        user_name: string | null;
        created_at: string;
      }[]
    | null; // managers only
  alert_days: number;
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
  // Backend returns { data: [], pagination: {} }
  // Map to expected format { plants: [], pagination: {} }
  return {
    plants: data.data || [],
    pagination: data.pagination,
  };
};

// Get plant by ID
export const getPlant = async (id: string): Promise<Plant> => {
  const { data } = await apiClient.get(`/plants/${id}`);
  return data.plant;
};

export const getPlantSummary = async (id: string): Promise<PlantSummary> => {
  const { data } = await apiClient.get(`/plants/${id}/summary`);
  return data;
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
