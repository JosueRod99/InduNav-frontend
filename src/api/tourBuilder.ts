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
  | 'processes'
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
  'processes',
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
  processes: 'Procesos',
  gallery: 'Galería',
  documents: 'Documentos',
  certifications: 'Certificaciones',
  highlights: 'Datos destacados',
  custom: 'Sección propia',
};

export const SECTION_DESCRIPTIONS: Record<TourSectionKey, string> = {
  summary: 'Narrativa, puntos clave y preguntas frecuentes de esta área',
  location: 'Plano de la planta y el interior del área con sus equipos',
  personnel: 'Nombre, puesto y foto del personal (sin correo ni teléfono)',
  safety: 'EPP requerido, riesgos y días sin accidentes',
  equipment: 'Herramientas y maquinaria del área con su estado',
  products: 'Productos que pasan por el área (excepto privados)',
  processes: 'Pasos de los procesos de la planta que se hacen en esta área (solo procesos vigentes)',
  gallery: 'Fotos del área',
  documents: 'Documentos del área (excepto privados)',
  certifications: 'Certificaciones del área',
  highlights: 'Cifras clave que capturas en esta área',
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
  narration_test_mode?: boolean; // TTS_TEST_MODE: only the first sentence of each script is synthesized
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

// ============================================================
// PUBLISH & SHARE
// ============================================================

export interface TourShareInfo {
  status: 'draft' | 'published' | 'archived';
  visibility: 'link' | 'private';
  public_code: string | null;
  organization_slug: string | null;
  slug: string;
  version: number | null;
  published_at: string | null;
  stops: { id: string; number: number; title: Translations; qr_short_code: string | null }[];
}

export interface PublishResult {
  version: number;
  published_at: string;
  public_code: string;
  audio_generated: number;
  counted_toward_limit: boolean;
  test_mode: boolean;
}

/** skipNewAudio: publish keeping the previous narration (when the monthly limit is reached) */
export const publishTour = async (tourId: string, options: { skipNewAudio?: boolean } = {}): Promise<PublishResult> => {
  const { data } = await apiClient.post(`/tours/${tourId}/publish`, { skip_new_audio: !!options.skipNewAudio });
  return data;
};

export interface NarrationItem {
  stop_id: string;
  stop_title: string;
  language: TourLanguage;
  script: string | null; // null = nothing to narrate in this language (visitors hear Spanish)
  synth_text: string | null; // text actually synthesized (first sentence in test mode)
  characters: number;
  text_hash: string | null;
  voice: string | null;
  audio_url: string | null; // already generated for this exact script
}

export interface PublishEstimate {
  items: NarrationItem[];
  test_mode: boolean;
  to_generate: number;
  reused: number;
  characters_to_generate: number;
  usage: PublicationUsage;
  limit_reached: boolean;
  counts_toward_limit: boolean;
}

export const getPublishEstimate = async (tourId: string): Promise<PublishEstimate> => {
  const { data } = await apiClient.get(`/tours/${tourId}/publish-estimate`);
  return data.estimate;
};

export const unpublishTour = async (tourId: string): Promise<void> => {
  await apiClient.post(`/tours/${tourId}/unpublish`);
};

export const getTourShareInfo = async (tourId: string): Promise<TourShareInfo> => {
  const { data } = await apiClient.get(`/tours/${tourId}/share`);
  return data.share;
};

/** Public links of a tour (absolute, for copying and QR codes) */
export const tourLinks = (share: Pick<TourShareInfo, 'public_code' | 'organization_slug' | 'slug'>) => {
  const origin = window.location.origin;
  return {
    short: share.public_code ? `${origin}/t/${share.public_code}` : null,
    readable: share.public_code && share.organization_slug ? `${origin}/t/${share.organization_slug}/${share.slug}` : null,
    stop: (qrShortCode: string) => `${origin}/s/${qrShortCode}`,
  };
};

// ---------------------------------------------------------------------------
// Visit statistics (anonymous visits of the published tour)
// ---------------------------------------------------------------------------

export interface TourStats {
  days: number;
  totals: { visits: number; started: number; completed: number; avg_seconds: number };
  by_day: { date: string; visits: number }[];
  languages: Record<string, number>;
  sources: Record<string, number>;
  devices: Record<string, number>;
  stops: {
    stop_id: string;
    order_index: number;
    title: string;
    views: number;
    avg_seconds: number;
    audio_listeners: number;
    avg_audio_seconds: number;
  }[];
}

export const getTourStats = async (tourId: string, days: number): Promise<TourStats> => {
  const { data } = await apiClient.get(`/tours/${tourId}/stats`, { params: { days } });
  return data.stats;
};
