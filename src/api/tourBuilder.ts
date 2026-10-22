import apiClient from './client';
import type { CustomSectionIcon } from '../components/tours/customSectionIcons';

// Tours v2 builder (PLAN_TOURS_REALES.md). The tour/stops rows are the draft; visitors see the
// latest published snapshot.

export type TourLanguage = 'es' | 'en';
export type Translations = Partial<Record<TourLanguage, string>>;

export const TOUR_LANGUAGE_LABELS: Record<TourLanguage, string> = { es: 'Español', en: 'English' };

export type TourSectionKey =
  | 'summary'
  | 'location'
  | 'personnel'
  | 'safety'
  | 'equipment'
  | 'products'
  | 'gallery'
  | 'documents'
  | 'certifications'
  | 'highlights'
  | 'custom';

export type ChartType = 'bar' | 'line' | 'donut';

export interface ChartData {
  type: ChartType;
  unit?: string;
  points: { label: Translations; value: number }[];
}

/** Content block of a custom section */
export type SectionBlock =
  | { type: 'text'; id: string; body: Translations }
  | { type: 'chart'; id: string; title?: Translations; chart: ChartData };

/** Sections that can appear several times in a stop (identified by id) */
export const MULTI_INSTANCE_SECTION_KEYS: TourSectionKey[] = ['custom'];
export const sectionInstanceId = (s: { key: TourSectionKey; id?: string }) =>
  MULTI_INSTANCE_SECTION_KEYS.includes(s.key) ? `${s.key}:${s.id}` : s.key;

export interface TourSection {
  key: TourSectionKey;
  visible: boolean;
  id?: string; // custom sections
  title?: Translations;
  body?: Translations;
  images?: string[];
  icon?: CustomSectionIcon; // custom sections
  blocks?: SectionBlock[]; // custom sections: text and charts in order
}

/** Blocks of a custom section; the legacy single `body` is read as one text block */
export const getSectionBlocks = (section: TourSection): SectionBlock[] =>
  section.blocks ?? (section.body && Object.values(section.body).some(Boolean) ? [{ type: 'text', id: 'body', body: section.body }] : []);

export const newBlockId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Sections whose data comes live from the area modules */
export const LIVE_SECTION_KEYS: TourSectionKey[] = [
  'location',
  'personnel',
  'safety',
  'equipment',
  'products',
  'gallery',
  'documents',
  'certifications',
];

export const SECTION_LABELS: Record<TourSectionKey, string> = {
  summary: 'Resumen',
  location: 'Ubicación',
  personnel: 'Personal',
  safety: 'Seguridad',
  equipment: 'Equipos y Maquinaria',
  products: 'Productos',
  gallery: 'Galería',
  documents: 'Documentos',
  certifications: 'Certificaciones',
  highlights: 'Datos destacados',
  custom: 'Sección propia',
};

export const SECTION_DESCRIPTIONS: Record<TourSectionKey, string> = {
  summary: 'Narrativa, puntos clave y preguntas frecuentes de esta parada',
  location: 'Plano de la planta y el interior del área con sus equipos',
  personnel: 'Nombre, puesto y foto del personal (sin correo ni teléfono)',
  safety: 'EPP requerido, riesgos y días sin accidentes',
  equipment: 'Herramientas y maquinaria del área con su estado',
  products: 'Productos que pasan por el área (excepto privados)',
  gallery: 'Fotos del área',
  documents: 'Documentos del área (excepto privados)',
  certifications: 'Certificaciones del área',
  highlights: 'Cifras clave que capturas en esta parada',
  custom: 'Contenido libre: bloques de texto y gráficas',
};

export interface StopContent {
  narrative?: Translations;
  keypoints?: Translations[];
  faq?: { q: Translations; a: Translations }[];
  highlights?: { label: Translations; value: string }[];
  narration_script?: Translations;
}

export interface BuilderStop {
  id: string;
  tour_id: string;
  order_index: number;
  organizational_area_id: string | null;
  title_translations: Translations;
  content: StopContent;
  sections: TourSection[];
  responsible_employee_id: string | null;
  image_url: string | null;
  qr_short_code: string | null;
  updated_at: string;
  area_name: string | null;
  area_code: string | null;
  area_color: string | null;
  area_description: string | null;
  area_available: boolean;
}

export interface BuilderTour {
  id: string;
  plant_id: string;
  plant_name: string;
  organization_id: string;
  organization_slug: string | null;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'link' | 'private';
  public_code: string | null;
  title_translations: Translations;
  description_translations: Translations;
  cover_image_url: string | null;
  languages: TourLanguage[];
  default_sections: TourSection[];
  max_publications_per_month: number;
  has_unpublished_changes: boolean;
}

export interface PublicationUsage {
  limit: number;
  used: number;
  remaining: number;
  resets_on: string;
  latest_version: number | null;
  last_published_at: string | null;
}

export interface TourBuilderData {
  tour: BuilderTour;
  stops: BuilderStop[];
  publications: PublicationUsage;
}

export type SectionCounts = Partial<Record<TourSectionKey, number | boolean>>;

export interface UpdateStopPayload {
  organizational_area_id?: string;
  title_translations?: Translations;
  content?: StopContent;
  sections?: TourSection[];
  responsible_employee_id?: string | null;
  image_url?: string | null;
}

export interface UpdateTourSettingsPayload {
  title_translations?: Translations;
  description_translations?: Translations;
  visibility?: 'link' | 'private';
  languages?: TourLanguage[];
  cover_image_url?: string | null;
  default_sections?: TourSection[];
}

export const getTourBuilder = async (tourId: string): Promise<TourBuilderData> => {
  const { data } = await apiClient.get(`/tours/${tourId}/builder`);
  return data;
};

export const updateTourSettings = async (tourId: string, payload: UpdateTourSettingsPayload): Promise<BuilderTour> => {
  const { data } = await apiClient.patch(`/tours/${tourId}/settings`, payload);
  return data.tour;
};

export const addTourStop = async (tourId: string, organizationalAreaId: string): Promise<BuilderStop> => {
  const { data } = await apiClient.post(`/tours/${tourId}/stops`, { organizational_area_id: organizationalAreaId });
  return data.stop;
};

export const reorderTourStops = async (tourId: string, stopIds: string[]): Promise<BuilderStop[]> => {
  const { data } = await apiClient.put(`/tours/${tourId}/stops/reorder`, { stop_ids: stopIds });
  return data.stops;
};

export const updateTourStop = async (stopId: string, payload: UpdateStopPayload): Promise<BuilderStop> => {
  const { data } = await apiClient.patch(`/tours/stops/${stopId}`, payload);
  return data.stop;
};

export const deleteTourStop = async (stopId: string): Promise<void> => {
  await apiClient.delete(`/tours/stops/${stopId}`);
};

export const getStopSectionCounts = async (stopId: string): Promise<SectionCounts | null> => {
  const { data } = await apiClient.get(`/tours/stops/${stopId}/section-counts`);
  return data.counts;
};
