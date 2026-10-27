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
