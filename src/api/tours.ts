import apiClient from './client';
import type { Tour } from '../types';

export interface CreateTourRequest {
  plant_id: string;
  title: string;
  description?: string;
  slug?: string;
  is_public?: boolean;
}

export interface UpdateTourRequest {
  title?: string;
  description?: string;
  slug?: string;
  is_public?: boolean;
  is_active?: boolean;
}

export interface GetToursParams {
  page?: number;
  limit?: number;
  plant_id?: string;
  search?: string;
  is_active?: boolean;
  is_public?: boolean;
}

export interface ToursResponse {
  tours: Tour[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get all tours with pagination
export const getTours = async (params?: GetToursParams): Promise<ToursResponse> => {
  const { data } = await apiClient.get('/tours', { params });
  return data;
};

// Get tour by ID
export const getTour = async (id: string): Promise<Tour> => {
  const { data } = await apiClient.get(`/tours/${id}`);
  return data.tour;
};

// Get tours by plant
export const getToursByPlant = async (plantId: string): Promise<Tour[]> => {
  const { data } = await apiClient.get(`/tours/plant/${plantId}`);
  return data.tours;
};

// Check slug availability
export const checkTourSlugAvailability = async (
  plantId: string,
  slug: string
): Promise<boolean> => {
  const { data } = await apiClient.get(`/tours/check-slug/${plantId}/${slug}`);
  return data.available;
};

// Create tour
export const createTour = async (payload: CreateTourRequest): Promise<Tour> => {
  const { data } = await apiClient.post('/tours', payload);
  return data.tour;
};

// Update tour
export const updateTour = async (id: string, payload: UpdateTourRequest): Promise<Tour> => {
  const { data } = await apiClient.patch(`/tours/${id}`, payload);
  return data.tour;
};

// Soft delete tour
export const deleteTour = async (id: string): Promise<void> => {
  await apiClient.delete(`/tours/${id}`);
};

// Permanently delete tour
export const permanentlyDeleteTour = async (id: string): Promise<void> => {
  await apiClient.delete(`/tours/${id}/permanent`);
};
