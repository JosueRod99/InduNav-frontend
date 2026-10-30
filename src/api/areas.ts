import apiClient from './client';

export interface OrganizationalArea {
  id: string;
  organization_id: string;
  plant_id: string;
  parent_area_id: string | null;
  hierarchy_path: string;
  hierarchy_level: number;
  name: string;
  code: string | null;
  description: string | null;
  area_type: string;
  color: string | null;
  icon: string | null;
  capacity: number | null;
  square_meters: number | null;
  cost_center: string | null;
  supervisor_id: string | null;

  // Phase 1 fields
  shift_schedule?: Record<string, any>;
  emergency_contact_id?: string | null;
  quality_manager_id?: string | null;
  days_without_accident?: number;

  metadata: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;

  // Relations populated by backend
  organization?: {
    id: string;
    name: string;
  };
  plant?: {
    id: string;
    name: string;
  };
  parent_area?: {
    id: string;
    name: string;
  };
  supervisor?: {
    id: string;
    first_name: string;
    last_name: string;
    position?: string;
    email?: string;
    phone?: string;
  };
  emergency_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    position?: string;
    email?: string;
    phone?: string;
  };
  quality_manager?: {
    id: string;
    first_name: string;
    last_name: string;
    position?: string;
    email?: string;
    phone?: string;
  };

  // Computed fields
  full_path_name?: string;
  employee_count?: number;
  sub_area_count?: number;
}

export interface AreaTreeNode extends OrganizationalArea {
  children?: AreaTreeNode[];
  ancestor_ids?: string[];
}

export interface AreaStatistics {
  area_id: string;
  area_name: string;
  employee_count: number;
  primary_employee_count: number;
  secondary_employee_count: number;
  sub_area_count: number;
  total_descendant_count: number;
  document_count: number;
  active_document_count: number;
  total_capacity: number;
  total_square_meters: number;
  utilization_rate: number;
}

export interface CreateAreaRequest {
  organization_id: string;
  plant_id: string;
  parent_area_id?: string | null;
  name: string;
  code?: string;
  description?: string;
  area_type?: string;
  color?: string;
  icon?: string;
  capacity?: number;
  square_meters?: number;
  cost_center?: string;
  supervisor_id?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAreaRequest {
  parent_area_id?: string | null;
  name?: string;
  code?: string;
  description?: string;
  area_type?: string;
  color?: string;
  icon?: string;
  capacity?: number;
  square_meters?: number;
  cost_center?: string;
  supervisor_id?: string;
  metadata?: Record<string, any>;
  is_active?: boolean;
}

export interface MoveAreaRequest {
  parent_area_id: string | null; // null: becomes a root area
}

export interface AreasResponse {
  areas: OrganizationalArea[];
  total: number;
  page: number;
  limit: number;
}

// Get all areas with pagination and filters
export const getAreas = async (params?: {
  organization_id?: string;
  plant_id?: string;
  parent_area_id?: string | null;
  area_type?: string;
  include_descendants?: boolean;
  include_geometry?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AreasResponse> => {
  const { data } = await apiClient.get('/organizational-areas', { params });
  return {
    areas: data.data || [],
    total: data.pagination?.total || 0,
    page: data.pagination?.page || 1,
    limit: data.pagination?.limit || 10,
  };
};

// Get area tree for organization/plant
export const getAreaTree = async (params: {
  organization_id: string;
  plant_id?: string;
  max_depth?: number;
}): Promise<AreaTreeNode[]> => {
  const { data } = await apiClient.get('/organizational-areas/tree', { params });
  return data.tree || data;
};

// Get single area by ID
export const getArea = async (id: string, includeRelations?: boolean): Promise<OrganizationalArea> => {
  const params = includeRelations ? { include_relations: true } : {};
  const { data } = await apiClient.get(`/organizational-areas/${id}`, { params });
  return data.area || data;
};

// Get immediate children of an area
export const getAreaChildren = async (parentId: string): Promise<OrganizationalArea[]> => {
  const { data } = await apiClient.get(`/organizational-areas/${parentId}/children`);
  return data.children || data;
};

// Get all descendants of an area (recursive)
export const getAreaDescendants = async (parentId: string): Promise<OrganizationalArea[]> => {
  const { data } = await apiClient.get(`/organizational-areas/${parentId}/descendants`);
  return data.descendants || data;
};

// Get ancestor chain (from area to root)
export const getAreaAncestors = async (areaId: string): Promise<OrganizationalArea[]> => {
  const { data } = await apiClient.get(`/organizational-areas/${areaId}/ancestors`);
  return data.ancestors || data;
};

// Get breadcrumb path from area to root
export const getAreaPath = async (areaId: string): Promise<OrganizationalArea[]> => {
  const { data } = await apiClient.get(`/organizational-areas/${areaId}/path`);
  return data.path || data;
};

// Get area statistics
export const getAreaStatistics = async (areaId: string): Promise<AreaStatistics> => {
  const { data } = await apiClient.get(`/organizational-areas/${areaId}/statistics`);
  return data.statistics || data;
};

// Create new area
export const createArea = async (payload: CreateAreaRequest): Promise<OrganizationalArea> => {
  const { data } = await apiClient.post('/organizational-areas', payload);
  return data.area || data;
};

// Update area
export const updateArea = async (id: string, payload: UpdateAreaRequest): Promise<OrganizationalArea> => {
  const { data } = await apiClient.patch(`/organizational-areas/${id}`, payload);
  return data.area || data;
};

// Move area to new parent
export const moveArea = async (id: string, payload: MoveAreaRequest): Promise<OrganizationalArea> => {
  const { data } = await apiClient.post(`/organizational-areas/${id}/move`, payload);
  return data.area || data;
};

// Delete area (soft delete)
export const deleteArea = async (id: string): Promise<void> => {
  await apiClient.delete(`/organizational-areas/${id}`);
};

// Get employees in an area
export const getAreaEmployees = async (areaId: string, includeHistory?: boolean): Promise<any[]> => {
  const params = includeHistory ? { include_history: true } : {};
  const { data } = await apiClient.get(`/organizational-areas/${areaId}/employees`, { params });
  return data.employees || data;
};

// Get assignment statistics for an area
export const getAreaAssignmentStats = async (areaId: string): Promise<any> => {
  const { data } = await apiClient.get(`/organizational-areas/${areaId}/assignment-stats`);
  return data.stats || data;
};

// "Áreas" tab: every area of a plant with its real figures (one request)
export interface AreaOverview {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
  area_type: string;
  description: string | null;
  parent_area_id: string | null;
  supervisor_id: string | null;
  supervisor_name: string | null;
  supervisor_position: string | null;
  employees: number;
  headcount: number;
  children: number;
  equipment: number;
  equipment_stopped: number;
  products: number;
  process_steps: number;
  documents: number;
  certification_alerts: number;
  people_certification_alerts: number;
  drawn: { floor_level: number; inside_area_id: string | null; zones: number }[];
  has_internal_layout: boolean;
}

export const getPlantAreasOverview = async (plantId: string): Promise<AreaOverview[]> => {
  const { data } = await apiClient.get(`/plants/${plantId}/areas-overview`);
  return data.areas || [];
};

/** What needs attention in an area (same signals as the plant summary) */
export const areaPending = (a: AreaOverview) => ({
  noSupervisor: !a.supervisor_id,
  notDrawn: a.drawn.length === 0,
  stoppedEquipment: a.equipment_stopped,
  certifications: a.certification_alerts + a.people_certification_alerts,
});

export const hasPending = (a: AreaOverview) => {
  const p = areaPending(a);
  return p.noSupervisor || p.notDrawn || p.stoppedEquipment > 0 || p.certifications > 0;
};
