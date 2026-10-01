import apiClient from './client';

export interface Employee {
  id: string;
  organization_id: string;
  plant_id: string | null;
  area_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string;
  department: string;
  employee_number: string;
  hire_date: Date;
  reports_to: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;

  // Relations populated by backend
  organization?: {
    id: string;
    name: string;
  };
  plant?: {
    id: string;
    name: string;
  };
  area?: {
    id: string;
    name: string;
  };
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface OrgChartNode {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  employee_number: string;
  parentId: string | null;
  area?: string;
  plant?: string;
}

export interface CreateEmployeeRequest {
  organization_id: string;
  plant_id?: string;
  area_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  employee_number: string;
  hire_date: string;
  reports_to?: string;
}

export interface UpdateEmployeeRequest {
  plant_id?: string;
  area_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  employee_number?: string;
  hire_date?: string;
  reports_to?: string;
  is_active?: boolean;
}

export interface AssignAreaRequest {
  area_id: string;
}

export interface EmployeesResponse {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
}

// Get employees
export const getEmployees = async (params?: {
  organization_id?: string;
  plant_id?: string;
  area_id?: string;
  department?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<EmployeesResponse> => {
  const { data } = await apiClient.get('/employees', { params });
  // Backend returns { data: [], pagination: {} }
  // Map to expected format { employees: [], total, page, limit }
  return {
    employees: data.data || [],
    total: data.pagination?.total || 0,
    page: data.pagination?.page || 1,
    limit: data.pagination?.limit || 10,
  };
};

// Get single employee
export const getEmployee = async (id: string): Promise<Employee> => {
  const { data } = await apiClient.get(`/employees/${id}`);
  return data.employee || data;
};

// Get org chart data
export const getOrgChart = async (
  organizationId: string,
  plantId?: string
): Promise<OrgChartNode[]> => {
  const params = plantId ? { plant_id: plantId } : {};
  const { data } = await apiClient.get(`/employees/org-chart/${organizationId}`, { params });
  return data.orgChart || data;
};

// Get subordinates
export const getSubordinates = async (id: string): Promise<Employee[]> => {
  const { data } = await apiClient.get(`/employees/${id}/subordinates`);
  return data.subordinates || data;
};

// Create employee
export const createEmployee = async (payload: CreateEmployeeRequest): Promise<Employee> => {
  const { data } = await apiClient.post('/employees', payload);
  return data.employee || data;
};

// Update employee
export const updateEmployee = async (id: string, payload: UpdateEmployeeRequest): Promise<Employee> => {
  const { data } = await apiClient.patch(`/employees/${id}`, payload);
  return data.employee || data;
};

// Delete employee
export const deleteEmployee = async (id: string): Promise<void> => {
  await apiClient.delete(`/employees/${id}`);
};

// Assign area to employee
export const assignArea = async (id: string, payload: AssignAreaRequest): Promise<Employee> => {
  const { data } = await apiClient.post(`/employees/assign-area`, {
    employee_id: id,
    ...payload,
  });
  return data.employee || data;
};

// Check employee number availability
export const checkEmployeeNumber = async (organizationId: string, employeeNumber: string, excludeId?: string): Promise<boolean> => {
  const { data } = await apiClient.get('/employees/check-employee-number', {
    params: { organization_id: organizationId, employee_number: employeeNumber, exclude_id: excludeId },
  });
  return data.available;
};
