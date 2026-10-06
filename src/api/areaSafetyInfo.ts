import apiClient from './client';

export interface PPEItem {
  name: string;
  icon: string;
  required: boolean;
  notes?: string;
}

export interface Hazard {
  type: string; // 'chemical', 'physical', 'biological', 'ergonomic'
  name: string;
  severity: string; // 'low', 'medium', 'high', 'critical'
  cas_number?: string; // For chemicals
  level_db?: number; // For noise
  notes?: string;
  msds_url?: string;
}

export interface EmergencyContact {
  role: string;
  name: string;
  phone: string;
  ext?: string;
}

export interface AreaSafetyInfo {
  id: string;
  organizational_area_id: string;
  required_ppe?: PPEItem[];
  hazards?: Hazard[];
  evacuation_procedure?: string | null;
  emergency_assembly_point?: string | null;
  emergency_contacts?: EmergencyContact[];
  fire_extinguisher_locations?: string | null;
  first_aid_kit_location?: string | null;
  safety_shower_location?: string | null;
  eye_wash_station_location?: string | null;
  restricted_access: boolean;
  access_requirements?: string | null;
  last_inspection_date?: Date | null;
  next_inspection_date?: Date | null;
  last_incident_date?: Date | null;
  incident_count_ytd: number;
  special_instructions?: string | null;
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
}

export interface CreateAreaSafetyInfoRequest {
  required_ppe?: PPEItem[];
  hazards?: Hazard[];
  evacuation_procedure?: string | null;
  emergency_assembly_point?: string | null;
  emergency_contacts?: EmergencyContact[];
  fire_extinguisher_locations?: string | null;
  first_aid_kit_location?: string | null;
  safety_shower_location?: string | null;
  eye_wash_station_location?: string | null;
  restricted_access?: boolean;
  access_requirements?: string | null;
  last_inspection_date?: Date | null;
  next_inspection_date?: Date | null;
  last_incident_date?: Date | null;
  incident_count_ytd?: number;
  special_instructions?: string | null;
  metadata?: Record<string, any>;
}

export interface UpdateAreaSafetyInfoRequest {
  required_ppe?: PPEItem[];
  hazards?: Hazard[];
  evacuation_procedure?: string | null;
  emergency_assembly_point?: string | null;
  emergency_contacts?: EmergencyContact[];
  fire_extinguisher_locations?: string | null;
  first_aid_kit_location?: string | null;
  safety_shower_location?: string | null;
  eye_wash_station_location?: string | null;
  restricted_access?: boolean;
  access_requirements?: string | null;
  last_inspection_date?: Date | null;
  next_inspection_date?: Date | null;
  last_incident_date?: Date | null;
  incident_count_ytd?: number;
  special_instructions?: string | null;
  metadata?: Record<string, any>;
}

// Get safety info for an area
export const getSafetyInfoByArea = async (areaId: string): Promise<AreaSafetyInfo | null> => {
  try {
    const { data } = await apiClient.get(`/organizational-areas/${areaId}/safety`);
    return data.safetyInfo || null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Get areas with upcoming inspections
export const getUpcomingInspections = async (
  daysAhead: number = 30
): Promise<AreaSafetyInfo[]> => {
  const { data } = await apiClient.get('/area-safety/upcoming-inspections', {
    params: { days_ahead: daysAhead },
  });
  return data.inspections || [];
};

// Get restricted access areas
export const getRestrictedAreas = async (): Promise<AreaSafetyInfo[]> => {
  const { data } = await apiClient.get('/area-safety/restricted-areas');
  return data.areas || [];
};

// Get safety info by ID
export const getSafetyInfoById = async (id: string): Promise<AreaSafetyInfo> => {
  const { data } = await apiClient.get(`/area-safety/${id}`);
  return data.safetyInfo || data;
};

// Create safety info
export const createSafetyInfo = async (
  areaId: string,
  payload: CreateAreaSafetyInfoRequest
): Promise<AreaSafetyInfo> => {
  const { data } = await apiClient.post(`/organizational-areas/${areaId}/safety`, payload);
  return data.safetyInfo || data;
};

// Update safety info
export const updateSafetyInfo = async (
  id: string,
  payload: UpdateAreaSafetyInfoRequest
): Promise<AreaSafetyInfo> => {
  const { data } = await apiClient.patch(`/area-safety/${id}`, payload);
  return data.safetyInfo || data;
};

// Update safety info by area ID (convenience method)
export const updateSafetyInfoByAreaId = async (
  areaId: string,
  payload: UpdateAreaSafetyInfoRequest
): Promise<AreaSafetyInfo> => {
  const { data } = await apiClient.patch(`/organizational-areas/${areaId}/safety`, payload);
  return data.safetyInfo || data;
};

// Delete safety info
export const deleteSafetyInfo = async (id: string): Promise<void> => {
  await apiClient.delete(`/area-safety/${id}`);
};

// Record incident
export const recordIncident = async (
  areaId: string,
  incidentDate?: Date
): Promise<AreaSafetyInfo> => {
  const { data } = await apiClient.post(
    `/organizational-areas/${areaId}/safety/record-incident`,
    { incident_date: incidentDate }
  );
  return data.safetyInfo || data;
};

// Reset YTD incidents (admin only)
export const resetYTDIncidents = async (): Promise<void> => {
  await apiClient.post('/area-safety/reset-ytd-incidents');
};

// Constants
export const HAZARD_TYPES = {
  CHEMICAL: 'chemical',
  PHYSICAL: 'physical',
  BIOLOGICAL: 'biological',
  ERGONOMIC: 'ergonomic',
} as const;

export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type HazardType = typeof HAZARD_TYPES[keyof typeof HAZARD_TYPES];
export type SeverityLevel = typeof SEVERITY_LEVELS[keyof typeof SEVERITY_LEVELS];
