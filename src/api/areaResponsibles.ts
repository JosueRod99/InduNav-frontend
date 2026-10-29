import apiClient from './client';

// Area responsibles (PLAN_LAB_KRAFT.md point 14): who is in charge of each area, apart from where
// people work. Several people per role; the first one is the area's main one.

export type ResponsibleRole = 'supervisor' | 'quality' | 'emergency';

export const RESPONSIBLE_ROLES: { role: ResponsibleRole; label: string; plural: string }[] = [
  { role: 'supervisor', label: 'Supervisor', plural: 'Supervisores' },
  { role: 'quality', label: 'Responsable de calidad', plural: 'Responsables de calidad' },
  { role: 'emergency', label: 'Contacto de emergencia', plural: 'Contactos de emergencia' },
];
export const roleLabel = (role: ResponsibleRole) => RESPONSIBLE_ROLES.find((r) => r.role === role)?.label || role;

export interface AreaResponsible {
  id: string;
  area_id: string;
  employee_id: string;
  role: ResponsibleRole;
  shift: string | null;
  display_order: number;
  area_name: string;
  area_code: string | null;
  plant_id: string | null;
  plant_name: string | null;
  name_prefix: string | null;
  first_name: string;
  last_name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  works_in: string | null; // name of the area where the person works (primary)
  works_here: boolean;
}

export const getResponsiblesByArea = async (areaId: string): Promise<AreaResponsible[]> =>
  (await apiClient.get('/area-responsibles', { params: { area_id: areaId } })).data.data;

export const getResponsibilitiesByEmployee = async (employeeId: string): Promise<AreaResponsible[]> =>
  (await apiClient.get('/area-responsibles', { params: { employee_id: employeeId } })).data.data;

export const addResponsible = async (payload: {
  employee_id: string;
  role: ResponsibleRole;
  area_ids: string[];
  shift?: string | null;
}): Promise<{ added: number; skipped: number }> => (await apiClient.post('/area-responsibles', payload)).data;

export const updateResponsible = async (id: string, payload: { shift?: string | null; make_primary?: true }) =>
  (await apiClient.patch(`/area-responsibles/${id}`, payload)).data as AreaResponsible;

export const removeResponsible = async (id: string) => {
  await apiClient.delete(`/area-responsibles/${id}`);
};

/** People of these areas without a manager, who could report to this person */
export const getUnmanaged = async (employeeId: string, areaIds: string[]) =>
  (await apiClient.get('/area-responsibles/unmanaged', { params: { employee_id: employeeId, area_ids: areaIds.join(',') } })).data
    .data as { id: string; name_prefix: string | null; first_name: string; last_name: string }[];

export const assignReports = async (employeeId: string, areaIds: string[]): Promise<{ updated: number }> =>
  (await apiClient.post('/area-responsibles/assign-reports', { employee_id: employeeId, area_ids: areaIds })).data;
