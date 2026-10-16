import apiClient from './client';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type EquipmentType = 'tool' | 'machinery' | 'vehicle' | 'computer' | 'other';
export type EquipmentStatus = 'active' | 'maintenance' | 'out_of_service' | 'retired';
export type AssignmentType = 'permanent' | 'temporary';

export interface Equipment {
  id: string;
  organization_id: string;
  plant_id: string;

  // Equipment Identification
  code: string;
  name: string;
  equipment_type: EquipmentType;

  // Technical Details
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  description: string | null;

  // Specifications
  specifications: Record<string, any>;

  // Status Management
  status: EquipmentStatus;
  acquisition_date: Date | null;
  warranty_expiry_date: Date | null;

  // Media
  primary_image_url: string | null;

  // Audit Trail
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
}

export interface EquipmentImage {
  id: string;
  equipment_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  is_primary: boolean;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
}

export interface EquipmentDocument {
  id: string;
  equipment_id: string;
  document_name: string;
  document_url: string;
  document_type: string | null;
  description: string | null;
  file_size: number | null;
  mime_type: string | null;
  display_order: number;
  uploaded_date: Date | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
}

export interface EquipmentAreaAssignment {
  id: string;
  equipment_id: string;
  organizational_area_id: string;
  assignment_type: AssignmentType;
  start_date: Date;
  end_date: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;

  // Populated from joins
  equipment_code?: string;
  equipment_name?: string;
  equipment_type?: string;
  area_name?: string;
  area_code?: string;
}

// Request DTOs
export interface CreateEquipmentRequest {
  organization_id: string;
  plant_id: string;
  code: string;
  name: string;
  equipment_type: EquipmentType;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  description?: string;
  specifications?: Record<string, any>;
  status?: EquipmentStatus;
  acquisition_date?: Date;
  warranty_expiry_date?: Date;
}

export interface UpdateEquipmentRequest {
  code?: string;
  name?: string;
  equipment_type?: EquipmentType;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  description?: string;
  specifications?: Record<string, any>;
  status?: EquipmentStatus;
  acquisition_date?: Date;
  warranty_expiry_date?: Date;
}

export interface CreateEquipmentImageRequest {
  image_url: string;
  caption?: string;
  display_order?: number;
  is_primary?: boolean;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
}

export interface UpdateEquipmentImageRequest {
  caption?: string;
  display_order?: number;
  is_primary?: boolean;
}

export interface CreateEquipmentDocumentRequest {
  document_name: string;
  document_url: string;
  document_type?: string;
  description?: string;
  file_size?: number;
  mime_type?: string;
  display_order?: number;
  uploaded_date?: Date;
}

export interface UpdateEquipmentDocumentRequest {
  document_name?: string;
  document_url?: string;
  document_type?: string;
  description?: string;
  file_size?: number;
  mime_type?: string;
  display_order?: number;
  uploaded_date?: Date;
}

export interface CreateEquipmentAreaAssignmentRequest {
  organizational_area_id: string;
  assignment_type?: AssignmentType;
  start_date?: Date;
  end_date?: Date;
  notes?: string;
}

export interface UpdateEquipmentAreaAssignmentRequest {
  organizational_area_id?: string;
  assignment_type?: AssignmentType;
  start_date?: Date;
  end_date?: Date;
  notes?: string;
}

// Labels for UI
export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  tool: 'Herramienta',
  machinery: 'Maquinaria',
  vehicle: 'Vehículo',
  computer: 'Equipo de Cómputo',
  other: 'Otro',
};

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  active: 'Activo',
  maintenance: 'En Mantenimiento',
  out_of_service: 'Fuera de Servicio',
  retired: 'Dado de Baja',
};

export const ASSIGNMENT_TYPE_LABELS: Record<AssignmentType, string> = {
  permanent: 'Permanente',
  temporary: 'Temporal',
};

// ============================================================
// API FUNCTIONS - EQUIPMENT CRUD
// ============================================================

/**
 * Get all equipment with optional filters
 */
export const getEquipment = async (params?: {
  organization_id?: string;
  plant_id?: string;
  equipment_type?: EquipmentType;
  status?: EquipmentStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<Equipment[]> => {
  const { data } = await apiClient.get('/equipment', { params });
  return data.equipment || [];
};

/**
 * Get equipment by ID
 */
export const getEquipmentById = async (id: string): Promise<Equipment> => {
  const { data } = await apiClient.get(`/equipment/${id}`);
  return data.equipment;
};

/**
 * Get equipment by code
 */
export const getEquipmentByCode = async (organizationId: string, code: string): Promise<Equipment> => {
  const { data } = await apiClient.get(`/equipment/code/${code}`, {
    params: { organization_id: organizationId },
  });
  return data.equipment;
};

/**
 * Get equipment by area
 */
export const getEquipmentByArea = async (areaId: string): Promise<Equipment[]> => {
  const { data } = await apiClient.get(`/equipment/by-area/${areaId}`);
  return data.equipment || [];
};

/**
 * Create new equipment
 */
export const createEquipment = async (payload: CreateEquipmentRequest): Promise<Equipment> => {
  const { data } = await apiClient.post('/equipment', payload);
  return data.equipment;
};

/**
 * Update equipment
 */
export const updateEquipment = async (id: string, payload: UpdateEquipmentRequest): Promise<Equipment> => {
  const { data } = await apiClient.patch(`/equipment/${id}`, payload);
  return data.equipment;
};

/**
 * Delete equipment
 */
export const deleteEquipment = async (id: string): Promise<void> => {
  await apiClient.delete(`/equipment/${id}`);
};

// ============================================================
// API FUNCTIONS - EQUIPMENT IMAGES
// ============================================================

/**
 * Get all images for equipment
 */
export const getEquipmentImages = async (equipmentId: string): Promise<EquipmentImage[]> => {
  const { data } = await apiClient.get(`/equipment/${equipmentId}/images`);
  return data.images || [];
};

/**
 * Get primary image for equipment
 */
export const getPrimaryEquipmentImage = async (equipmentId: string): Promise<EquipmentImage | null> => {
  try {
    const { data } = await apiClient.get(`/equipment/${equipmentId}/images/primary`);
    return data.image || null;
  } catch (error) {
    return null;
  }
};

/**
 * Create equipment image
 */
export const createEquipmentImage = async (
  equipmentId: string,
  payload: CreateEquipmentImageRequest
): Promise<EquipmentImage> => {
  const { data } = await apiClient.post(`/equipment/${equipmentId}/images`, payload);
  return data.image;
};

/**
 * Update equipment image
 */
export const updateEquipmentImage = async (
  imageId: string,
  payload: UpdateEquipmentImageRequest
): Promise<EquipmentImage> => {
  const { data } = await apiClient.patch(`/equipment/images/${imageId}`, payload);
  return data.image;
};

/**
 * Set image as primary
 */
export const setPrimaryEquipmentImage = async (imageId: string): Promise<EquipmentImage> => {
  const { data } = await apiClient.post(`/equipment/images/${imageId}/set-primary`);
  return data.image;
};

/**
 * Delete equipment image
 */
export const deleteEquipmentImage = async (imageId: string): Promise<void> => {
  await apiClient.delete(`/equipment/images/${imageId}`);
};

/**
 * Reorder equipment images
 */
export const reorderEquipmentImages = async (
  equipmentId: string,
  imageOrders: { id: string; display_order: number }[]
): Promise<void> => {
  await apiClient.post(`/equipment/${equipmentId}/images/reorder`, { imageOrders });
};

// ============================================================
// API FUNCTIONS - EQUIPMENT DOCUMENTS
// ============================================================

/**
 * Get all documents for equipment
 */
export const getEquipmentDocuments = async (equipmentId: string): Promise<EquipmentDocument[]> => {
  const { data } = await apiClient.get(`/equipment/${equipmentId}/documents`);
  return data.documents || [];
};

/**
 * Get document by ID
 */
export const getEquipmentDocument = async (documentId: string): Promise<EquipmentDocument> => {
  const { data } = await apiClient.get(`/equipment/documents/${documentId}`);
  return data.document;
};

/**
 * Create equipment document
 */
export const createEquipmentDocument = async (
  equipmentId: string,
  payload: CreateEquipmentDocumentRequest
): Promise<EquipmentDocument> => {
  const { data } = await apiClient.post(`/equipment/${equipmentId}/documents`, payload);
  return data.document;
};

/**
 * Update equipment document
 */
export const updateEquipmentDocument = async (
  documentId: string,
  payload: UpdateEquipmentDocumentRequest
): Promise<EquipmentDocument> => {
  const { data } = await apiClient.patch(`/equipment/documents/${documentId}`, payload);
  return data.document;
};

/**
 * Delete equipment document
 */
export const deleteEquipmentDocument = async (documentId: string): Promise<void> => {
  await apiClient.delete(`/equipment/documents/${documentId}`);
};

/**
 * Reorder equipment documents
 */
export const reorderEquipmentDocuments = async (
  equipmentId: string,
  documentOrders: { id: string; display_order: number }[]
): Promise<void> => {
  await apiClient.post(`/equipment/${equipmentId}/documents/reorder`, { documentOrders });
};

// ============================================================
// API FUNCTIONS - EQUIPMENT AREA ASSIGNMENTS
// ============================================================

/**
 * Get area assignments for equipment
 */
export const getEquipmentAreaAssignments = async (
  equipmentId: string,
  includeEnded = false
): Promise<EquipmentAreaAssignment[]> => {
  const { data } = await apiClient.get(`/equipment/${equipmentId}/area-assignments`, {
    params: { include_ended: includeEnded },
  });
  return data.assignments || [];
};

/**
 * Get equipment assigned to an area
 */
export const getAreaEquipment = async (
  areaId: string,
  includeEnded = false
): Promise<EquipmentAreaAssignment[]> => {
  const { data } = await apiClient.get(`/equipment/areas/${areaId}/equipment`, {
    params: { include_ended: includeEnded },
  });
  return data.assignments || [];
};

/**
 * Get assignment by ID
 */
export const getAreaAssignmentById = async (assignmentId: string): Promise<EquipmentAreaAssignment> => {
  const { data } = await apiClient.get(`/equipment/area-assignments/${assignmentId}`);
  return data.assignment;
};

/**
 * Create area assignment
 */
export const createAreaAssignment = async (
  equipmentId: string,
  payload: CreateEquipmentAreaAssignmentRequest
): Promise<EquipmentAreaAssignment> => {
  const { data } = await apiClient.post(`/equipment/${equipmentId}/area-assignments`, payload);
  return data.assignment;
};

/**
 * Update area assignment
 */
export const updateAreaAssignment = async (
  assignmentId: string,
  payload: UpdateEquipmentAreaAssignmentRequest
): Promise<EquipmentAreaAssignment> => {
  const { data } = await apiClient.patch(`/equipment/area-assignments/${assignmentId}`, payload);
  return data.assignment;
};

/**
 * End area assignment
 */
export const endAreaAssignment = async (
  assignmentId: string,
  endDate?: Date
): Promise<EquipmentAreaAssignment> => {
  const { data } = await apiClient.post(`/equipment/area-assignments/${assignmentId}/end`, {
    end_date: endDate,
  });
  return data.assignment;
};

/**
 * Delete area assignment
 */
export const deleteAreaAssignment = async (assignmentId: string): Promise<void> => {
  await apiClient.delete(`/equipment/area-assignments/${assignmentId}`);
};
