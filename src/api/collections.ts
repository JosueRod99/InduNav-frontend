import apiClient from './client';

// Collections of tours of demo companies, for sales (platform). The page /c/:slug is public.

/** {es, en}: the collection's own texts are only in Spanish and English */
export type CollectionTexts = { es?: string; en?: string };

/** Card of a tour, from its latest publication */
export interface CollectionTour {
  public_code: string | null;
  source_language: string;
  languages: string[];
  cover_image_url: string | null;
  title_translations: Record<string, string>;
  description_translations: Record<string, string>;
  organization_name: string | null;
  organization_logo_url: string | null;
  plant_name: string;
  stops_count: number;
}

export type UnavailableReason = 'not_published' | 'private' | 'not_demo';

export interface CollectionEditorTour extends CollectionTour {
  tour_id: string;
  unavailable_reason: UnavailableReason | null; // not shown on the public page, and why
}

export interface CollectionSummary {
  id: string;
  slug: string;
  title_translations: CollectionTexts;
  is_active: boolean;
  updated_at: string;
  tours_count: number;
  visits_30d: number;
}

export interface Collection {
  id: string;
  slug: string;
  title_translations: CollectionTexts;
  description_translations: CollectionTexts;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tours: CollectionEditorTour[];
}

export interface PublicCollection {
  slug: string;
  title_translations: CollectionTexts;
  description_translations: CollectionTexts;
  tours: CollectionTour[];
}

export interface CollectionInput {
  slug?: string;
  title_translations?: CollectionTexts;
  description_translations?: CollectionTexts;
  is_active?: boolean;
}

export const getCollections = async (): Promise<CollectionSummary[]> => (await apiClient.get('/collections')).data.collections;
export const getCollection = async (id: string): Promise<Collection> => (await apiClient.get(`/collections/${id}`)).data.collection;
export const createCollection = async (input: CollectionInput): Promise<Collection> => (await apiClient.post('/collections', input)).data.collection;
export const updateCollection = async (id: string, input: CollectionInput): Promise<Collection> =>
  (await apiClient.patch(`/collections/${id}`, input)).data.collection;
export const deleteCollection = async (id: string) => {
  await apiClient.delete(`/collections/${id}`);
};
export const setCollectionTours = async (id: string, tourIds: string[]): Promise<Collection> =>
  (await apiClient.put(`/collections/${id}/tours`, { tour_ids: tourIds })).data.collection;
export const getCandidateTours = async (search?: string): Promise<CollectionEditorTour[]> =>
  (await apiClient.get('/collections/candidate-tours', { params: search ? { search } : undefined })).data.tours;
export const getPublicCollection = async (slug: string): Promise<PublicCollection> =>
  (await apiClient.get(`/public/collections/${encodeURIComponent(slug)}`)).data.collection;

/** Public link of a collection */
export const collectionUrl = (slug: string) => `${window.location.origin}/c/${slug}`;

/** Text in the language asked, else the other one */
export const collectionText = (texts: CollectionTexts | undefined, language: 'es' | 'en') =>
  texts?.[language]?.trim() || texts?.[language === 'es' ? 'en' : 'es']?.trim() || '';
