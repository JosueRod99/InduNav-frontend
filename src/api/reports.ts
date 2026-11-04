import apiClient from './client';

// Downloadable reports of an organization or one of its plants

export interface ReportScope {
  organization_id?: string;
  plant_id?: string;
}

export interface DocumentReportRow {
  id: string;
  code: string | null;
  title: string;
  category: string;
  version: string;
  status: string;
  source: string;
  scope: string;
  area_name: string | null;
  plant_name: string | null;
  shared_areas: string[];
  shared_products: string[];
  shared_equipment: string[];
  is_private: boolean;
  effective_date: string | null;
  review_date: string | null;
  expiry_date: string | null;
  updated_at: string;
}

export type CertificationReportState = 'active' | 'expiring' | 'expired' | 'in_progress' | 'suspended';

export interface CertificationReportRow {
  id: string;
  kind: 'system' | 'person';
  name: string;
  issuing_body: string | null;
  scope: 'organization' | 'plant' | 'area' | null;
  holder: string | null;
  area_name: string | null;
  plant_name: string | null;
  certificate_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  next_audit_date: string | null;
  responsible: string | null;
  state: CertificationReportState;
}

export interface PersonnelReportRow {
  id: string;
  employee_number: string | null;
  name: string;
  position: string | null;
  email: string | null;
  hire_date: string | null;
  plant_name: string | null;
  manager: string | null;
  areas: string[];
  certifications: string[];
  certification_alerts: number;
}

export interface VisitsReportTour {
  id: string;
  title: string;
  status: string;
  plant_name: string;
  visits: number;
  completed: number;
  average_seconds: number;
}

export interface VisitsReport {
  tours: VisitsReportTour[];
  by_day: { day: string; visits: number }[];
  visits: number;
  completed: number;
  average_seconds: number;
  languages: Record<string, number>;
  devices: Record<string, number>;
}

export const getDocumentsReport = async (scope: ReportScope): Promise<DocumentReportRow[]> => (await apiClient.get('/reports/documents', { params: scope })).data.rows;

export const getCertificationsReport = async (scope: ReportScope): Promise<{ rows: CertificationReportRow[]; alert_days: number }> =>
  (await apiClient.get('/reports/certifications', { params: scope })).data;

export const getPersonnelReport = async (scope: ReportScope): Promise<PersonnelReportRow[]> => (await apiClient.get('/reports/personnel', { params: scope })).data.rows;

export const getVisitsReport = async (scope: ReportScope & { days: number; tour_id?: string }): Promise<VisitsReport> => (await apiClient.get('/reports/visits', { params: scope })).data;
