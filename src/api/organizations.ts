import apiClient from './client';
import type { Organization } from '../types';

export interface CreateOrganizationRequest {
  name: string;
  slug?: string;
  logo_url?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  settings?: Record<string, any>;
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  logo_url?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  is_active?: boolean;
  settings?: Record<string, any>;
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
  return data;
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
