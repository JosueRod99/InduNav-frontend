import apiClient from './client';
import type { Translations } from './tourBuilder';

// Company profile and company/plant photo galleries (PLAN_LAB_KRAFT.md points 1-2)

export interface CompanyValue {
  title: Translations;
  description: Translations;
}

export interface OrganizationProfileData {
  tagline: Translations;
  about: Translations;
  mission: Translations;
  vision: Translations;
  values: CompanyValue[];
  industry: string;
  website: string;
  phone: string;
  email: string;
  address: string;
}

export const TOUR_DISPLAY_BLOCKS = ['about', 'mission', 'vision', 'values', 'contact', 'gallery', 'plant'] as const;
export type TourDisplayBlock = (typeof TOUR_DISPLAY_BLOCKS)[number];
export type TourDisplay = Record<TourDisplayBlock, boolean>;

export interface OrganizationProfile {
  id: string;
  name: string;
  logo_url: string | null;
  profile: Partial<OrganizationProfileData>;
  tour_display: TourDisplay;
}

export interface OrganizationPhoto {
  id: string;
  organization_id: string;
  plant_id: string | null;
  image_url: string;
  caption: string | null;
  display_order: number;
  is_cover: boolean;
  created_at: string;
}

export const getOrganizationProfile = async (organizationId: string): Promise<OrganizationProfile> => {
  const { data } = await apiClient.get(`/organizations/${organizationId}/profile`);
  return data;
};

export const updateOrganizationProfile = async (
  organizationId: string,
  payload: { profile: OrganizationProfileData; tour_display: TourDisplay; logo_url?: string | null }
): Promise<OrganizationProfile> => {
  const { data } = await apiClient.put(`/organizations/${organizationId}/profile`, payload);
  return data;
};

const photosPath = (organizationId: string) => `/organizations/${organizationId}/photos`;

/** Company photos (no plantId) or a plant's photos */
export const getPhotos = async (organizationId: string, plantId?: string | null): Promise<OrganizationPhoto[]> => {
  const { data } = await apiClient.get(photosPath(organizationId), { params: plantId ? { plant_id: plantId } : {} });
  return data.data;
};

export const addPhotos = async (
  organizationId: string,
  plantId: string | null,
  photos: { image_url: string; caption?: string }[]
): Promise<OrganizationPhoto[]> => {
  const { data } = await apiClient.post(photosPath(organizationId), { plant_id: plantId, photos });
  return data.data;
};

export const updatePhoto = async (
  organizationId: string,
  photoId: string,
  payload: { caption?: string | null; is_cover?: true }
): Promise<OrganizationPhoto[]> => {
  const { data } = await apiClient.patch(`${photosPath(organizationId)}/${photoId}`, payload);
  return data.data;
};

export const reorderPhotos = async (organizationId: string, plantId: string | null, photoIds: string[]): Promise<OrganizationPhoto[]> => {
  const { data } = await apiClient.put(`${photosPath(organizationId)}/order`, { plant_id: plantId, photo_ids: photoIds });
  return data.data;
};

export const deletePhoto = async (organizationId: string, photoId: string): Promise<OrganizationPhoto[]> => {
  const { data } = await apiClient.delete(`${photosPath(organizationId)}/${photoId}`);
  return data.data;
};
