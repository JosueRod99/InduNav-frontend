import apiClient from './client';

// Plant processes (PLAN_LAB_KRAFT.md point 5): processes across areas of a plant, step by step

export interface ProcessSummary {
  id: string;
  code: string | null;
  name: string;
  objective: string | null;
  status: 'draft' | 'active';
  owner_name: string | null;
  step_count: number;
  areas: string[];
  updated_at: string;
}

export interface ProcessStep {
  id: string;
  step_number: number;
  name: string;
  description: string | null;
  activities: string[];
  area_id: string | null;
  area_name: string | null;
  area_code: string | null;
  responsible_employee_id: string | null;
  responsible_name: string | null;
  responsible_position: string | null;
  documents: { id: string; code: string | null; title: string; file_url: string | null; document_type: string }[];
  equipment: { id: string; code: string; name: string }[];
}

export interface Process {
  id: string;
  plant_id: string;
  organization_id: string;
  code: string | null;
  name: string;
  objective: string | null;
  owner_employee_id: string | null;
  owner_name: string | null;
  status: 'draft' | 'active';
  updated_at: string;
  steps: ProcessStep[];
}

export interface ProcessStepInput {
  name: string;
  description?: string | null;
  area_id?: string | null;
  responsible_employee_id?: string | null;
  activities?: string[];
  document_ids?: string[];
  equipment_ids?: string[];
}

export interface ProcessInput {
  code?: string | null;
  name: string;
  objective?: string | null;
  owner_employee_id?: string | null;
  status?: 'draft' | 'active';
  steps: ProcessStepInput[];
}

/** A step of some process done in an area ("what happens here") */
export interface AreaProcessStep {
  id: string;
  step_number: number;
  total_steps: number;
  name: string;
  description: string | null;
  activities: string[];
  process_id: string;
  process_code: string | null;
  process_name: string;
  process_status: 'draft' | 'active';
  plant_id: string;
  responsible_name: string | null;
  documents: ProcessStep['documents'];
  equipment: ProcessStep['equipment'];
}

export const getProcesses = async (plantId: string): Promise<ProcessSummary[]> =>
  (await apiClient.get('/processes', { params: { plant_id: plantId } })).data.data;

export const getProcess = async (id: string): Promise<Process> => (await apiClient.get(`/processes/${id}`)).data;

export const createProcess = async (plantId: string, payload: ProcessInput): Promise<Process> =>
  (await apiClient.post('/processes', { plant_id: plantId, ...payload })).data;

export const updateProcess = async (id: string, payload: ProcessInput): Promise<Process> =>
  (await apiClient.put(`/processes/${id}`, payload)).data;

export const deleteProcess = async (id: string) => {
  await apiClient.delete(`/processes/${id}`);
};

export const getAreaProcessSteps = async (areaId: string): Promise<AreaProcessStep[]> =>
  (await apiClient.get(`/processes/by-area/${areaId}`)).data.data;
