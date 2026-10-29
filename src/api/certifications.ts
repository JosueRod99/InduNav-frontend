import apiClient from './client';

// Certifications (PLAN_LAB_KRAFT.md point 9): system ones (ISO 9001…) for the organization, a plant
// or an area; people ones (forklift…) checked per employee.

export type CertificationStatus = 'in_progress' | 'active' | 'expired' | 'suspended';
export type CertificationScope = 'organization' | 'plant' | 'area';
export type HolderState = 'valid' | 'expiring' | 'expired';

export const STATUS_LABELS: Record<CertificationStatus, string> = {
  in_progress: 'En proceso',
  active: 'Vigente',
  expired: 'Vencida',
  suspended: 'Suspendida',
};
export const STATUS_CLASSES: Record<CertificationStatus, string> = {
  in_progress: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-200 text-gray-700',
};

export interface CertificationType {
  id: string;
  organization_id: string;
  kind: 'system' | 'person';
  name: string;
  issuing_body: string | null;
  validity_months: number | null;
  description: string | null;
}

export interface SystemCertification {
  id: string;
  type_id: string;
  name: string;
  issuing_body: string | null;
  scope: CertificationScope;
  plant_id: string | null;
  plant_name: string | null;
  area_id: string | null;
  area_name: string | null;
  status: CertificationStatus;
  effective_status: CertificationStatus; // "active" past expiry → "expired"
  certificate_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  next_audit_date: string | null;
  notes: string | null;
  responsible_employee_id: string | null;
  responsible_name: string | null;
}

export interface PersonCertificationStats {
  id: string;
  name: string;
  issuing_body: string | null;
  validity_months: number | null;
  description: string | null;
  holders: number;
  expiring: number;
  expired: number;
}

export interface RosterRow {
  employee_id: string;
  name_prefix: string | null;
  first_name: string;
  last_name: string;
  position: string | null;
  area_name: string | null;
  holds: boolean;
  obtained_date: string | null;
  expiry_date: string | null;
  state: HolderState | null;
}

export const scopeLabel = (c: Pick<SystemCertification, 'scope' | 'plant_name' | 'area_name'>) =>
  c.scope === 'organization' ? 'Toda la empresa' : c.scope === 'plant' ? `Planta ${c.plant_name ?? ''}`.trim() : `Área ${c.area_name ?? ''}`.trim();

/** "2027-03-15" → "15 mar 2027" (dates without time zone shifts) */
export const formatDate = (iso: string | null) =>
  iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const getPlantCertifications = async (plantId: string): Promise<{ system: SystemCertification[]; person: PersonCertificationStats[] }> =>
  (await apiClient.get(`/certifications/plant/${plantId}`)).data;

export const getCertificationTypes = async (plantId: string, kind?: 'system' | 'person'): Promise<CertificationType[]> =>
  (await apiClient.get('/certifications/types', { params: { plant_id: plantId, kind } })).data.data;

export const createCertificationType = async (
  plantId: string,
  payload: { kind: 'system' | 'person'; name: string; issuing_body?: string | null; validity_months?: number | null; description?: string | null }
): Promise<CertificationType> => (await apiClient.post('/certifications/types', { plant_id: plantId, ...payload })).data;

export const updateCertificationType = async (
  id: string,
  payload: { name?: string; issuing_body?: string | null; validity_months?: number | null; description?: string | null }
): Promise<CertificationType> => (await apiClient.patch(`/certifications/types/${id}`, payload)).data;

export const deleteCertificationType = async (id: string) => {
  await apiClient.delete(`/certifications/types/${id}`);
};

export interface SystemCertificationInput {
  type_id: string;
  scope: CertificationScope;
  plant_id: string; // the plant the user is in (also the scope when scope = "plant")
  area_id?: string | null;
  status: CertificationStatus;
  certificate_number?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  next_audit_date?: string | null;
  responsible_employee_id?: string | null;
  notes?: string | null;
}

export const createSystemCertification = async (payload: SystemCertificationInput): Promise<SystemCertification> =>
  (await apiClient.post('/certifications/system', payload)).data;

export const updateSystemCertification = async (id: string, payload: SystemCertificationInput): Promise<SystemCertification> =>
  (await apiClient.put(`/certifications/system/${id}`, payload)).data;

export const deleteSystemCertification = async (id: string) => {
  await apiClient.delete(`/certifications/system/${id}`);
};

export const getRoster = async (typeId: string, plantId: string): Promise<{ type: CertificationType; data: RosterRow[] }> =>
  (await apiClient.get(`/certifications/types/${typeId}/holders`, { params: { plant_id: plantId } })).data;

export const saveHolders = async (typeId: string, changes: { employee_id: string; holds: boolean; obtained_date?: string | null }[]) => {
  await apiClient.put(`/certifications/types/${typeId}/holders`, { changes });
};

export const getEmployeeCertifications = async (
  employeeId: string
): Promise<{
  own: { id: string; type_id: string; name: string; issuing_body: string | null; obtained_date: string | null; expiry_date: string | null; state: HolderState }[];
  inherited: SystemCertification[];
}> => (await apiClient.get(`/certifications/employee/${employeeId}`)).data;

export const getAreaCertifications = async (
  areaId: string
): Promise<{ system: SystemCertification[]; person: PersonCertificationStats[]; staff: number }> =>
  (await apiClient.get(`/certifications/area/${areaId}`)).data;
