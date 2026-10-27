import apiClient from './client';

// Internal reports for the platform team (platform_admin)

export interface NarrationUsageAudio {
  id: string;
  publication_id: string;
  area_title: string;
  language: 'es' | 'en';
  characters: number;
  duration_seconds: number | null;
  cost_usd: number;
  is_test_mode: boolean;
  audio_url: string;
}

export interface NarrationUsagePublication {
  id: string;
  version: number;
  published_at: string;
  audio_generated_count: number;
  audio_characters: number;
  audio_cost_usd: number;
  counts_toward_limit: boolean;
  tts_test_mode: boolean;
  tour_id: string;
  tour_title: string;
  organization_id: string | null;
  organization_name: string | null;
  published_by: string | null;
  audios: NarrationUsageAudio[];
}

export interface NarrationUsage {
  month: string;
  rates: { usd_per_1k_characters: number; usd_mxn: number; model: string; test_mode: boolean };
  totals: { publications: number; counted: number; audios: number; characters: number; cost_usd: number };
  organizations: {
    id: string;
    name: string;
    limit: number;
    publications: number;
    counted: number;
    audios: number;
    characters: number;
    cost_usd: number;
  }[];
  publications: NarrationUsagePublication[];
}

export const getNarrationUsage = async (month?: string): Promise<NarrationUsage> => {
  const { data } = await apiClient.get('/admin/narration-usage', { params: month ? { month } : undefined });
  return data.usage;
};
