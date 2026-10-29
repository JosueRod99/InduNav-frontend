import apiClient from './client';
import type { GeoJSONPolygon } from './areaRepresentations';
import type { EquipmentStatus, EquipmentType } from './equipment';
import type { StopContent, TourLanguage, TourSection, Translations } from './tourBuilder';

// What a visitor sees of a real tour (backend tourViewService). Separate from the demo data.

export interface TourViewEquipment {
  id: string;
  code: string;
  name: string;
  equipment_type: EquipmentType;
  status: EquipmentStatus;
  primary_image_url: string | null;
  manufacturer: string | null;
  model: string | null;
  used_in: { product: string; step_number: number; step_name: string }[];
}

export interface TourViewInterior {
  image_url: string | null;
  layout_data: {
    source?: 'plant_crop' | 'image' | 'blank';
    plant_image_url?: string | null;
    crop?: { x: number; y: number; scale: number };
    outline?: number[][];
  };
  sub_areas: { id: string; name: string; color: string | null; geometry: GeoJSONPolygon }[];
  footprints: {
    id: string;
    code: string;
    name: string;
    equipment_type: EquipmentType;
    status: EquipmentStatus;
    geometry: GeoJSONPolygon;
  }[];
}

export interface TourViewStop {
  id: string;
  order: number;
  area_id: string | null;
  title: Translations;
  image_url: string | null;
  area: {
    name: string;
    code: string | null;
    description: string | null;
    color: string | null;
    capacity: number | null;
    square_meters: number | null;
  } | null;
  responsible: { name: string; position: string | null; avatar_url: string | null } | null;
  content: StopContent;
  sections: TourSection[]; // visible, non-empty, in order
  audio: Partial<Record<TourLanguage, string | null>>;
  live: {
    personnel: { id: string; name: string; position: string | null; avatar_url: string | null; is_primary: boolean }[];
    headcount?: { position: string; quantity: number; shift: string | null }[]; // unnamed staff by position
    processes?: {
      process_name: string;
      process_code: string | null;
      step_number: number;
      total_steps: number;
      name: string;
      description: string | null;
      activities: string[];
      documents: { code: string | null; title: string }[];
      equipment: string[];
    }[];
    people_total?: number; // named + headcount
    safety: {
      required_ppe: string[];
      hazards: { name: string; type: string; severity: string }[];
      emergency_assembly_point: string | null;
      restricted_access: boolean | null;
      access_requirements: string | null;
      special_instructions: string | null;
      days_without_accident: number | null;
    } | null;
    equipment: TourViewEquipment[];
    products: {
      id: string;
      name: string;
      sku: string;
      primary_image_url: string | null;
      description: string | null;
      category: string;
      steps: { step_number: number; step_name: string }[];
    }[];
    gallery: { id: string; photo_url: string; thumbnail_url: string | null; caption: string | null }[];
    documents: {
      id: string;
      title: string;
      description: string | null;
      category: string | null;
      file_url: string;
      file_type: string | null;
      version: string | null;
    }[];
    certifications: {
      id: string;
      certification_name: string;
      certification_body: string | null;
      status: string; // active | in_progress
      scope?: 'organization' | 'plant' | 'area';
      expiry_date: string | null;
    }[];
    certified_people?: { name: string; count: number }[]; // people certifications of the area's staff, counts only
    location_available: boolean;
    interior: TourViewInterior | null;
  };
}

interface TourPhoto {
  image_url: string;
  caption: string | null;
}

/** Company profile as tours show it: blocks switched off in the profile come back empty */
export interface TourCompanyProfile {
  tagline: Translations | null;
  about: Translations | null;
  mission: Translations | null;
  vision: Translations | null;
  values: { title: Translations; description: Translations }[];
  industry: string | null;
  contact: { website: string | null; phone: string | null; email: string | null; address: string | null } | null;
  photos: TourPhoto[];
  plant: { description: string | null; photos: TourPhoto[] } | null;
  plant_cover_url: string | null;
}

export interface TourView {
  tour: {
    id: string;
    title: Translations;
    description: Translations;
    languages: TourLanguage[];
    cover_image_url: string | null;
    plant_name: string;
    organization: { name: string | null; logo_url: string | null; profile: TourCompanyProfile | null };
    status: 'draft' | 'published' | 'archived';
    public_code: string | null;
    version: number | null;
  };
  plant_layout: {
    image_url: string | null;
    areas: { area_id: string; name: string; geometry: GeoJSONPolygon }[];
  } | null;
  stops: TourViewStop[];
  is_preview: boolean;
}

/** Draft preview for the editor (authenticated) */
export const getTourPreview = async (tourId: string): Promise<TourView> => {
  const { data } = await apiClient.get(`/tours/${tourId}/preview`);
  return data;
};

/** Published tour by short code (public, no login; private tours need a session) */
export const getPublicTour = async (code: string): Promise<TourView> => {
  const { data } = await apiClient.get(`/public/tours/${encodeURIComponent(code)}`);
  return data;
};

/** Published tour by readable link /t/:orgSlug/:tourSlug */
export const getPublicTourBySlug = async (orgSlug: string, tourSlug: string): Promise<TourView> => {
  const { data } = await apiClient.get(
    `/public/tours/by-slug/${encodeURIComponent(orgSlug)}/${encodeURIComponent(tourSlug)}`
  );
  return data;
};

/** QR code of a stop → tour code and position of the stop */
export const resolveStopQr = async (qrCode: string): Promise<{ tour_code: string; stop_index: number | null }> => {
  const { data } = await apiClient.get(`/public/stops/${encodeURIComponent(qrCode)}/resolve`);
  return data;
};

/** Text in the requested language, falling back to Spanish */
export const tr = (text: Translations | undefined | null, language: TourLanguage): string =>
  (text?.[language] || text?.es || '').trim();
