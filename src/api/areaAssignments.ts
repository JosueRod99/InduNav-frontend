import apiClient from './client';

export type AssignmentType = 'primary' | 'secondary' | 'temporary';

export interface EmployeeAreaAssignment {
  id: string;
  employee_id: string;
  organizational_area_id: string;
  assignment_type: AssignmentType;
  role_in_area: string | null;
  start_date: Date;
  end_date: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;

  // Relations populated by backend
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    employee_number: string;
    position: string;
  };
  organizational_area?: {
    id: string;
    name: string;
    code: string | null;
    area_type: string;
    full_path_name?: string;
  };
}

export interface CreateAssignmentRequest {
  organizational_area_id: string;
  assignment_type?: AssignmentType;
  role_in_area?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface UpdateAssignmentRequest {
  assignment_type?: AssignmentType;
  role_in_area?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface EndAssignmentRequest {
  end_date: string;
}

export interface BulkAssignRequest {
  employee_ids: string[];
  organizational_area_id: string;
  assignment_type?: AssignmentType;
  role_in_area?: string;
}

export interface AssignmentStats {
  total_employees: number;
  primary_assignments: number;
  secondary_assignments: number;
  temporary_assignments: number;
  employees_by_role: Record<string, number>;
}

// Get all assignments for an employee
export const getAssignmentsByEmployee = async (
  employeeId: string,
  includeHistory?: boolean
): Promise<EmployeeAreaAssignment[]> => {
  const params = includeHistory ? { include_history: true } : {};
  const { data } = await apiClient.get(`/employees/${employeeId}/area-assignments`, { params });
  return Array.isArray(data.assignments) ? data.assignments : (Array.isArray(data) ? data : []);
};

// Get employee's primary area
export const getEmployeePrimaryArea = async (employeeId: string): Promise<EmployeeAreaAssignment | null> => {
  const { data } = await apiClient.get(`/employees/${employeeId}/primary-area`);
  return data.primary_area || data.assignment || data || null;
};

// Get employee's secondary areas
export const getEmployeeSecondaryAreas = async (employeeId: string): Promise<EmployeeAreaAssignment[]> => {
  const { data } = await apiClient.get(`/employees/${employeeId}/secondary-areas`);
  return Array.isArray(data.secondary_areas) ? data.secondary_areas : (Array.isArray(data.assignments) ? data.assignments : (Array.isArray(data) ? data : []));
};

// Get all employees assigned to an area
export const getEmployeesByArea = async (
  areaId: string,
  includeHistory?: boolean
): Promise<EmployeeAreaAssignment[]> => {
  const params = includeHistory ? { include_history: true } : {};
  const { data } = await apiClient.get(`/organizational-areas/${areaId}/employees`, { params });
  return Array.isArray(data.assignments) ? data.assignments : (Array.isArray(data) ? data : []);
};

// Get assignment statistics for an area
export const getAreaAssignmentStats = async (areaId: string): Promise<AssignmentStats> => {
  const { data } = await apiClient.get(`/organizational-areas/${areaId}/assignment-stats`);
  return data.stats || data;
};

// Get single assignment by ID
export const getAssignment = async (id: string): Promise<EmployeeAreaAssignment> => {
  const { data } = await apiClient.get(`/area-assignments/${id}`);
  return data.assignment || data;
};

// Create new assignment
export const createAssignment = async (
  employeeId: string,
  payload: CreateAssignmentRequest
): Promise<EmployeeAreaAssignment> => {
  const { data } = await apiClient.post(`/employees/${employeeId}/area-assignments`, payload);
  return data.assignment || data;
};

// Update assignment
export const updateAssignment = async (
  id: string,
  payload: UpdateAssignmentRequest
): Promise<EmployeeAreaAssignment> => {
  const { data } = await apiClient.patch(`/area-assignments/${id}`, payload);
  return data.assignment || data;
};

// End assignment (set end_date)
export const endAssignment = async (
  id: string,
  payload: EndAssignmentRequest
): Promise<EmployeeAreaAssignment> => {
  const { data } = await apiClient.post(`/area-assignments/${id}/end`, payload);
  return data.assignment || data;
};

// Delete assignment
export const deleteAssignment = async (id: string): Promise<void> => {
  await apiClient.delete(`/area-assignments/${id}`);
};

// Bulk assign employees to an area
export const bulkAssignEmployees = async (
  areaId: string,
  payload: Omit<BulkAssignRequest, 'organizational_area_id'>
): Promise<EmployeeAreaAssignment[]> => {
  const { data } = await apiClient.post(`/organizational-areas/${areaId}/employees/bulk-assign`, payload);
  return Array.isArray(data.assignments) ? data.assignments : (Array.isArray(data) ? data : []);
};
