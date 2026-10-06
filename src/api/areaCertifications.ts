import apiClient from './client';

export interface AreaCertification {
  id: string;
  organizational_area_id: string;
  certification_type: string;
  certification_name: string;
  certification_body?: string | null;
  certificate_number?: string | null;
  status: string;
  issue_date?: Date | null;
  expiry_date?: Date | null;
  next_audit_date?: Date | null;
  last_audit_date?: Date | null;
  last_audit_result?: string | null;
  last_audit_score?: number | null;
  audit_findings_count: number;
  corrective_actions_pending: number;
  certificate_url?: string | null;
  audit_report_url?: string | null;
  notes?: string | null;
  responsible_person_id?: string | null;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;

  // Relations populated by backend
  organizational_area?: {
    id: string;
    name: string;
    code: string | null;
    area_type: string;
  };
  responsible_person?: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    position: string;
    email?: string;
  };
}

export interface CreateAreaCertificationRequest {
  certification_type: string;
  certification_name: string;
  certification_body?: string | null;
  certificate_number?: string | null;
  status?: string;
  issue_date?: Date | null;
  expiry_date?: Date | null;
  next_audit_date?: Date | null;
  last_audit_date?: Date | null;
  last_audit_result?: string | null;
  last_audit_score?: number | null;
  audit_findings_count?: number;
  corrective_actions_pending?: number;
  certificate_url?: string | null;
  audit_report_url?: string | null;
  notes?: string | null;
  responsible_person_id?: string | null;
  metadata?: Record<string, any>;
}

export interface UpdateAreaCertificationRequest {
  certification_type?: string;
  certification_name?: string;
  certification_body?: string | null;
  certificate_number?: string | null;
  status?: string;
  issue_date?: Date | null;
  expiry_date?: Date | null;
  next_audit_date?: Date | null;
  last_audit_date?: Date | null;
  last_audit_result?: string | null;
  last_audit_score?: number | null;
  audit_findings_count?: number;
  corrective_actions_pending?: number;
  certificate_url?: string | null;
  audit_report_url?: string | null;
  notes?: string | null;
  responsible_person_id?: string | null;
  metadata?: Record<string, any>;
}

// Get all certifications for an area
export const getCertificationsByArea = async (areaId: string): Promise<AreaCertification[]> => {
  const { data } = await apiClient.get(`/organizational-areas/${areaId}/certifications`);
  return data.certifications || [];
};

// Get certifications by type
export const getCertificationsByType = async (
  areaId: string,
  certificationType: string
): Promise<AreaCertification[]> => {
  const { data } = await apiClient.get(
    `/organizational-areas/${areaId}/certifications/type/${certificationType}`
  );
  return data.certifications || [];
};

// Get active certifications for an area
export const getActiveCertifications = async (areaId: string): Promise<AreaCertification[]> => {
  const { data } = await apiClient.get(`/organizational-areas/${areaId}/certifications/active`);
  return data.certifications || [];
};

// Get certifications expiring soon (across all areas)
export const getExpiringSoon = async (daysAhead: number = 90): Promise<AreaCertification[]> => {
  const { data } = await apiClient.get('/area-certifications/expiring-soon', {
    params: { days_ahead: daysAhead },
  });
  return data.certifications || [];
};

// Get certifications with upcoming audits (across all areas)
export const getUpcomingAudits = async (daysAhead: number = 60): Promise<AreaCertification[]> => {
  const { data } = await apiClient.get('/area-certifications/upcoming-audits', {
    params: { days_ahead: daysAhead },
  });
  return data.certifications || [];
};

// Get certifications with pending corrective actions (across all areas)
export const getWithPendingActions = async (): Promise<AreaCertification[]> => {
  const { data } = await apiClient.get('/area-certifications/pending-actions');
  return data.certifications || [];
};

// Get certification by ID
export const getCertificationById = async (id: string): Promise<AreaCertification> => {
  const { data } = await apiClient.get(`/area-certifications/${id}`);
  return data.certification || data;
};

// Create certification
export const createCertification = async (
  areaId: string,
  payload: CreateAreaCertificationRequest
): Promise<AreaCertification> => {
  const { data } = await apiClient.post(
    `/organizational-areas/${areaId}/certifications`,
    payload
  );
  return data.certification || data;
};

// Update certification
export const updateCertification = async (
  id: string,
  payload: UpdateAreaCertificationRequest
): Promise<AreaCertification> => {
  const { data } = await apiClient.patch(`/area-certifications/${id}`, payload);
  return data.certification || data;
};

// Delete certification
export const deleteCertification = async (id: string): Promise<void> => {
  await apiClient.delete(`/area-certifications/${id}`);
};

// Mark certification as expired
export const markExpired = async (id: string): Promise<AreaCertification> => {
  const { data } = await apiClient.post(`/area-certifications/${id}/mark-expired`);
  return data.certification || data;
};

// Auto-expire certifications (admin only)
export const autoExpireCertifications = async (): Promise<{ count: number }> => {
  const { data } = await apiClient.post('/area-certifications/auto-expire');
  return data;
};

// Constants
export const CERTIFICATION_TYPES = {
  ISO_9001: 'ISO 9001',
  ISO_14001: 'ISO 14001',
  ISO_45001: 'ISO 45001',
  GMP: 'GMP',
  HACCP: 'HACCP',
  SIX_SIGMA: 'Six Sigma',
  OHSAS_18001: 'OHSAS 18001',
  ISO_27001: 'ISO 27001',
  ISO_50001: 'ISO 50001',
  OTHER: 'Other',
} as const;

export const CERTIFICATION_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
  UNDER_REVIEW: 'under_review',
} as const;

export const AUDIT_RESULTS = {
  PASSED: 'passed',
  PASSED_WITH_FINDINGS: 'passed_with_findings',
  FAILED: 'failed',
} as const;

export type CertificationType = typeof CERTIFICATION_TYPES[keyof typeof CERTIFICATION_TYPES];
export type CertificationStatus = typeof CERTIFICATION_STATUS[keyof typeof CERTIFICATION_STATUS];
export type AuditResult = typeof AUDIT_RESULTS[keyof typeof AUDIT_RESULTS];
