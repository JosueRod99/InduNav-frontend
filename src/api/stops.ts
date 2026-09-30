import apiClient from './client';
import type { Stop } from '../types';

export interface CreateStopRequest {
  tour_id: string;
  order_index?: number;
  title_translations: Record<string, string>;
  description_translations: Record<string, string>;
  image_url?: string;
  video_url?: string;
  audio_urls?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface UpdateStopRequest {
  order_index?: number;
  title_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  image_url?: string;
  video_url?: string;
  audio_urls?: Record<string, string>;
  metadata?: Record<string, any>;
  is_active?: boolean;
}

export interface ReorderStopsRequest {
  tour_id: string;
  stops: Array<{ id: string; order_index: number }>;
}

export interface GetStopsParams {
  page?: number;
  limit?: number;
  tour_id?: string;
  search?: string;
  is_active?: boolean;
}

export interface StopsResponse {
  stops: Stop[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get all stops with pagination
export const getStops = async (params?: GetStopsParams): Promise<StopsResponse> => {
  const { data } = await apiClient.get('/stops', { params });
  return data;
};

// Get stop by ID
export const getStop = async (id: string): Promise<Stop> => {
  const { data } = await apiClient.get(`/stops/${id}`);
  return data.stop;
};

// Get stops by tour
export const getStopsByTour = async (tourId: string): Promise<Stop[]> => {
  const { data } = await apiClient.get(`/stops/tour/${tourId}`);
  return data.stops;
};

// Check QR code availability
export const checkQRCodeAvailability = async (qrCode: string): Promise<boolean> => {
  const { data } = await apiClient.get(`/stops/check-qr/${qrCode}`);
  return data.available;
};

// Create stop
export const createStop = async (payload: CreateStopRequest): Promise<Stop> => {
  const { data } = await apiClient.post('/stops', payload);
  return data.stop;
};

// Update stop
export const updateStop = async (id: string, payload: UpdateStopRequest): Promise<Stop> => {
  const { data } = await apiClient.patch(`/stops/${id}`, payload);
  return data.stop;
};

// Reorder stops
export const reorderStops = async (payload: ReorderStopsRequest): Promise<void> => {
  await apiClient.patch('/stops/reorder', payload);
};

// Soft delete stop
export const deleteStop = async (id: string): Promise<void> => {
  await apiClient.delete(`/stops/${id}`);
};

// Permanently delete stop
export const permanentlyDeleteStop = async (id: string): Promise<void> => {
  await apiClient.delete(`/stops/${id}/permanent`);
};
