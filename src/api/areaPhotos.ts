import apiClient from './client';

export interface AreaPhoto {
  id: string;
  organizational_area_id: string;
  photo_url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  photo_type: string;
  display_order: number;
  is_featured: boolean;
  is_cover: boolean;
  taken_at?: Date | null;
  taken_by?: string | null;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;

  // Relations populated by backend
  taken_by_employee?: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
  };
}

export interface CreateAreaPhotoRequest {
  photo_url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  photo_type?: string;
  display_order?: number;
  is_featured?: boolean;
  is_cover?: boolean;
  taken_at?: Date | null;
  taken_by?: string | null;
  metadata?: Record<string, any>;
}

export interface UpdateAreaPhotoRequest {
  photo_url?: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  photo_type?: string;
  display_order?: number;
  is_featured?: boolean;
  is_cover?: boolean;
  taken_at?: Date | null;
  taken_by?: string | null;
  metadata?: Record<string, any>;
}

// Get all photos for an area
export const getPhotosByArea = async (areaId: string): Promise<AreaPhoto[]> => {
  const { data } = await apiClient.get(`/organizational-areas/${areaId}/photos`);
  return data.photos || [];
};

// Get photos by type
export const getPhotosByType = async (
  areaId: string,
  photoType: string
): Promise<AreaPhoto[]> => {
  const { data } = await apiClient.get(
    `/organizational-areas/${areaId}/photos/type/${photoType}`
  );
  return data.photos || [];
};

// Get cover photo for an area
export const getCoverPhoto = async (areaId: string): Promise<AreaPhoto | null> => {
  try {
    const { data } = await apiClient.get(`/organizational-areas/${areaId}/photos/cover`);
    return data.photo || null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Get single photo by ID
export const getPhotoById = async (id: string): Promise<AreaPhoto> => {
  const { data } = await apiClient.get(`/area-photos/${id}`);
  return data.photo || data;
};

// Create new photo
export const createPhoto = async (
  areaId: string,
  payload: CreateAreaPhotoRequest
): Promise<AreaPhoto> => {
  const { data } = await apiClient.post(`/organizational-areas/${areaId}/photos`, payload);
  return data.photo || data;
};

// Update photo
export const updatePhoto = async (
  id: string,
  payload: UpdateAreaPhotoRequest
): Promise<AreaPhoto> => {
  const { data } = await apiClient.patch(`/area-photos/${id}`, payload);
  return data.photo || data;
};

// Delete photo
export const deletePhoto = async (id: string): Promise<void> => {
  await apiClient.delete(`/area-photos/${id}`);
};

// Reorder photos
export const reorderPhotos = async (
  areaId: string,
  updates: Array<{ id: string; display_order: number }>
): Promise<void> => {
  await apiClient.post(`/organizational-areas/${areaId}/photos/reorder`, { photos: updates });
};

// Photo type constants
export const PHOTO_TYPES = {
  GENERAL: 'general',
  BEFORE_IMPROVEMENT: 'before_improvement',
  AFTER_IMPROVEMENT: 'after_improvement',
  EQUIPMENT: 'equipment',
  LAYOUT: 'layout',
  SAFETY: 'safety',
  PRODUCT: 'product',
} as const;

export type PhotoType = typeof PHOTO_TYPES[keyof typeof PHOTO_TYPES];
