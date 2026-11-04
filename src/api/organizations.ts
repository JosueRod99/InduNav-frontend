import apiClient from './client';
import type { Organization } from '../types';

export interface CreateOrganizationRequest {
  name: string;
  slug?: string;
  logo_url?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  settings?: Record<string, any>;
  tour_publications_per_month?: number; // tour publications with narration audio per month
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  logo_url?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  is_active?: boolean;
  settings?: Record<string, any>;
  tour_publications_per_month?: number;
}

export interface GetOrganizationsParams {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  is_active?: boolean;
}

export interface OrganizationsResponse {
  organizations: Organization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get all organizations with pagination
export const getOrganizations = async (params?: GetOrganizationsParams): Promise<OrganizationsResponse> => {
  const { data } = await apiClient.get('/organizations', { params });
  // Backend returns 'data' but we expect 'organizations'
  return {
    organizations: data.data,
    pagination: data.pagination
  };
};

// Get organization by ID
export const getOrganization = async (id: string): Promise<Organization> => {
  const { data } = await apiClient.get(`/organizations/${id}`);
  return data.organization;
};

// Get organization by slug
export const getOrganizationBySlug = async (slug: string): Promise<Organization> => {
  const { data } = await apiClient.get(`/organizations/slug/${slug}`);
  return data.organization;
};

// Check slug availability
export const checkSlugAvailability = async (slug: string): Promise<boolean> => {
  const { data } = await apiClient.get(`/organizations/check-slug/${slug}`);
  return data.available;
};

// Create organization
export const createOrganization = async (payload: CreateOrganizationRequest): Promise<Organization> => {
  const { data } = await apiClient.post('/organizations', payload);
  return data.organization;
};

// Update organization
export const updateOrganization = async (id: string, payload: UpdateOrganizationRequest): Promise<Organization> => {
  const { data } = await apiClient.patch(`/organizations/${id}`, payload);
  return data.organization;
};

// Soft delete organization
export const deleteOrganization = async (id: string): Promise<void> => {
  await apiClient.delete(`/organizations/${id}`);
};

// Permanently delete organization
export const permanentlyDeleteOrganization = async (id: string): Promise<void> => {
  await apiClient.delete(`/organizations/${id}/permanent`);
};

export interface OrganizationSummary {
  publications_limit: number;
  publications_used: number;
  plants: number;
  employees: number;
  headcount: number;
  tours: number;
  tours_published: number;
  tours_unpublished_changes: number;
  visits_30d: number;
  visits_prev_30d: number;
  documents: number;
  certifications_alert: number;
  people_certification_alerts: number;
  plants_list: {
    id: string;
    name: string;
    location: string | null;
    is_active: boolean;
    cover_url: string | null;
    areas: number;
    employees: number;
    tours: number;
    has_plan: boolean;
  }[];
  profile_missing: string[];
  alert_days: number;
  near_limit_ratio: number;
}

// "Resumen" tab of an organization
export const getOrganizationSummary = async (id: string): Promise<OrganizationSummary> => {
  const { data } = await apiClient.get(`/organizations/${id}/summary`);
  return data;
};

// Tour publications of this month and the limit
export const getOrganizationPublications = async (id: string): Promise<{ limit: number; used: number }> => {
  const { data } = await apiClient.get(`/organizations/${id}/publications`);
  return data;
};
