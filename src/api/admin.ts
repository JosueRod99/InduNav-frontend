import apiClient from './client';

// Internal reports for the platform team (platform_admin)

export interface NarrationUsageAudio {
  id: string;
  publication_id: string;
  area_title: string;
  language: string;
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

/** Plan and characters used in the narration provider's account (ElevenLabs) */
export interface NarrationAccount {
  plan: string;
  characters_used: number;
  characters_limit: number;
  resets_at: string | null;
}

export const getNarrationAccount = async (): Promise<NarrationAccount> => (await apiClient.get('/admin/narration-account')).data.account;

/** Characters per target language: {ja: 5331, en: 6264} */
export type CharactersByLanguage = Record<string, number>;

export interface TranslationUsage {
  month: string;
  rates: { provider: string; free_characters: number; usd_per_1m_characters: number; usd_mxn: number; limit_per_organization: number };
  totals: { characters: number; requests: number; by_language: CharactersByLanguage; cost_usd: number };
  platform: { characters: number; by_language: CharactersByLanguage }; // fixed texts of the viewer
  organizations: { id: string; name: string; characters: number; limit: number; by_language: CharactersByLanguage }[];
  tours: {
    tour_id: string | null; // null: deleted tour
    tour_title: string | null;
    organization_name: string | null;
    characters: number;
    by_language: CharactersByLanguage;
    last_at: string;
  }[];
  live_review: LiveReview;
}

/** Hourly review that translates new live data of published tours (scheduled_jobs) */
export interface LiveReview {
  interval_minutes: number; // of the server that answered; 0: it does not run there
  last_started_at: string | null;
  last_finished_at: string | null;
  last_result: {
    tours: number;
    translated: number;
    characters: number;
    by_organization: { organization_id: string; organization_name: string | null; translated: number; characters: number }[];
    errors: { tour_id: string; tour_title: string | null; message: string }[];
  } | null;
  last_error: string | null;
}

export const getTranslationUsage = async (month?: string): Promise<TranslationUsage> => {
  const { data } = await apiClient.get('/admin/translation-usage', { params: month ? { month } : undefined });
  return data.usage;
};

// ---------------------------------------------------------------------------
// API audit log (changes, errors and logins; 90 days)
// ---------------------------------------------------------------------------

export interface AuditLogRow {
  id: string;
  method: string;
  url: string;
  status_code: number;
  response_time_ms: number | null;
  action: string | null;
  resource: string | null;
  resource_id: string | null;
  user_email: string | null;
  organization_name: string | null;
  error_message: string | null;
  created_at: string;
}

export interface AuditLogDetail extends AuditLogRow {
  request_body: unknown;
  user_id: string | null;
  organization_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

export interface AuditLogFilters {
  page: number;
  limit: number;
  search?: string;
  method?: string;
  status?: 'success' | 'error';
  from?: string;
  to?: string;
}

export interface AuditStats {
  total: number;
  today: number;
  errors: number;
  failed_logins_24h: number;
  table_size: string;
  methods: Record<string, number>;
  retention_days: number;
  logging_reads: boolean;
}

export const getAuditLogs = async (filters: AuditLogFilters) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''));
  const { data } = await apiClient.get('/admin/audit', { params });
  return data as { logs: AuditLogRow[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
};

export const getAuditStats = async (): Promise<AuditStats> => {
  const { data } = await apiClient.get('/admin/audit/stats');
  return data.stats;
};

export const getAuditLog = async (id: string): Promise<AuditLogDetail> => {
  const { data } = await apiClient.get(`/admin/audit/${id}`);
  return data.log;
};

// "Inicio" of the platform team
export interface PlatformHomeData {
  organizations: number;
  plants: number;
  tours_published: number;
  visits_30d: number;
  visits_prev_30d: number;
  publications_used: number;
  organizations_list: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    plan: string;
    is_active: boolean;
    publications_limit: number;
    publications_used: number;
    plants: number;
    tours_published: number;
    visits_30d: number;
  }[];
  recent_changes: {
    id: string;
    action: string | null;
    resource: string;
    resource_id: string | null;
    user_name: string | null;
    organization_name: string | null;
    entity_name: string | null;
    created_at: string;
  }[];
}

export const getPlatformHome = async (): Promise<PlatformHomeData> => {
  const { data } = await apiClient.get('/admin/home');
  return data;
};
