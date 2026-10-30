import type { QueryClient } from '@tanstack/react-query';
import apiClient from './client';

// Who a document applies to: one area · several areas · the whole plant · the whole organization.
export type DocumentScope = 'area' | 'areas' | 'plant' | 'organization';

export interface AreaDocument {
  id: string;
  organizational_area_id: string | null; // the area of an "area" scope document
  organization_id: string;
  plant_id: string | null; // null for "organization" scope
  scope: DocumentScope;
  area_name?: string | null;
  plant_name?: string | null;
  shared_areas?: { id: string; name: string }[];
  title: string;
  description?: string | null;
  document_code?: string | null;
  category: string;
  tags: string[];
  version: string;
  parent_document_id?: string | null;
  is_latest_version: boolean;
  document_type: 'uploaded' | 'external_link' | 'pending'; // pending = registered without file yet
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size?: number | null;
  status: string;
  effective_date?: string | null;
  review_date?: string | null;
  expiry_date?: string | null;
  is_private: boolean;
  metadata: Record<string, any>;
  uploaded_by?: string | null;
  uploader?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentRequest {
  organizational_area_id?: string | null;
  plant_id?: string | null;
  organization_id?: string | null;
  scope?: DocumentScope;
  shared_area_ids?: string[];
  title: string;
  description?: string;
  document_code?: string;
  category: string;
  tags?: string[];
  document_type?: 'uploaded' | 'external_link' | 'pending';
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  status?: string;
  /** Automatic code TYPE-KEY-NNN (instead of document_code) */
  code_prefix?: string;
  code_key?: string;
  effective_date?: Date | string;
  review_date?: Date | string;
  expiry_date?: Date | string;
  is_private?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateDocumentRequest {
  scope?: DocumentScope;
  organizational_area_id?: string | null;
  plant_id?: string | null;
  shared_area_ids?: string[];
  title?: string;
  description?: string;
  document_code?: string;
  category?: string;
  tags?: string[];
  status?: string;
  effective_date?: Date | string;
  review_date?: Date | string;
  expiry_date?: Date | string;
  is_private?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateVersionRequest {
  file_url: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  description?: string;
  effective_date?: Date | string;
}

export interface DocumentsQueryOptions {
  includeArchived?: boolean;
  includeAllVersions?: boolean;
  category?: string;
  status?: string;
  search?: string;
  includePrivate?: boolean;
}

export interface DocumentStats {
  total_active_documents: number;
  draft_count: number;
  pending_review_count: number;
  category_count: number;
  total_size_bytes: number;
}

/**
 * Get all documents for an organizational area
 */
export const getDocumentsByArea = async (
  areaId: string,
  options?: DocumentsQueryOptions
): Promise<AreaDocument[]> => {
  const params = new URLSearchParams();

  if (options?.includeArchived) params.append('includeArchived', 'true');
  if (options?.includeAllVersions) params.append('includeAllVersions', 'true');
  if (options?.category) params.append('category', options.category);
  if (options?.status) params.append('status', options.status);
  if (options?.search) params.append('search', options.search);
  if (options?.includePrivate) params.append('includePrivate', 'true');

  const queryString = params.toString();
  const url = `/organizational-areas/${areaId}/documents${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get(url);
  return response.data.data;
};

/**
 * Get single document by ID
 */
export const getDocumentById = async (documentId: string): Promise<AreaDocument> => {
  const response = await apiClient.get(`/area-documents/${documentId}`);
  return response.data.data;
};

/**
 * Get all versions of a document
 */
export const getDocumentVersions = async (documentId: string): Promise<AreaDocument[]> => {
  const response = await apiClient.get(`/area-documents/${documentId}/versions`);
  return response.data.data;
};

/**
 * Create new document (version 1.0)
 */
export const createDocument = async (
  areaId: string,
  data: CreateDocumentRequest
): Promise<AreaDocument> => {
  const response = await apiClient.post(`/organizational-areas/${areaId}/documents`, data);
  return response.data.data;
};

/** New document; where it applies: { scope, organizational_area_id | plant_id | organization_id, shared_area_ids } */
export const createGeneralDocument = async (data: CreateDocumentRequest): Promise<AreaDocument> => {
  const response = await apiClient.post('/documents', data);
  return response.data.data;
};

/** Fields that say where a document applies, for create and update */
export const scopeFields = (value: { scope: DocumentScope; areaId: string | null; sharedAreaIds: string[] }, plantId: string, organizationId: string) => ({
  scope: value.scope,
  organizational_area_id: value.scope === 'area' ? value.areaId : null,
  plant_id: value.scope === 'organization' ? null : plantId,
  organization_id: organizationId,
  shared_area_ids: value.scope === 'areas' ? value.sharedAreaIds : [],
});

/** Documents that apply to an area besides its own: several areas including it, the plant, the organization */
export const getApplicableDocuments = async (areaId: string): Promise<AreaDocument[]> => {
  const response = await apiClient.get(`/organizational-areas/${areaId}/documents/applicable`);
  return response.data.data;
};

/** Library of a plant: documents of its areas, of the plant and of the organization */
export const getPlantDocuments = async (plantId: string, options: { includeArchived?: boolean } = {}): Promise<AreaDocument[]> => {
  const response = await apiClient.get(`/plants/${plantId}/documents`, { params: options.includeArchived ? { includeArchived: 'true' } : {} });
  return response.data.data;
};

/**
 * Code the next document of this type and key would get, e.g. PROC-RH-003.
 * Numbers are per organization, so any area or plant of it gives the same answer.
 */
export const getNextDocumentCode = async (codeSource: { areaId?: string; plantId?: string }, prefix: string, key: string): Promise<string> => {
  const url = codeSource.areaId ? `/organizational-areas/${codeSource.areaId}/documents/next-code` : `/plants/${codeSource.plantId}/documents/next-code`;
  const response = await apiClient.get(url, { params: { prefix, key } });
  return response.data.data.code;
};

/** Every document list changes together (a general document shows in many places) */
export const invalidateDocumentLists = (queryClient: QueryClient) => {
  for (const key of ['area-documents-active', 'area-documents-archived', 'area-documents-applicable', 'plant-documents']) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
};

export const SCOPE_OPTIONS: { value: DocumentScope; label: string; hint: string }[] = [
  { value: 'area', label: 'Un área', hint: 'Solo el área que elijas' },
  { value: 'areas', label: 'Varias áreas', hint: 'Las áreas que elijas' },
  { value: 'plant', label: 'Toda la planta', hint: 'Todas las áreas de la planta' },
  { value: 'organization', label: 'Toda la empresa', hint: 'Todas las áreas de todas las plantas' },
];

/** Who it applies to: "Calidad", "Línea 1, Línea 2", "5 áreas", "Toda la planta", "Toda la empresa" */
export const scopeLabel = (doc: Pick<AreaDocument, 'scope' | 'shared_areas' | 'area_name'>) => {
  if (doc.scope === 'organization') return 'Toda la empresa';
  if (doc.scope === 'plant') return 'Toda la planta';
  if (doc.scope === 'area') return doc.area_name || 'Un área';
  const names = (doc.shared_areas || []).map((a) => a.name);
  return names.length <= 2 ? names.join(', ') : `${names.length} áreas`;
};

/** Does the document apply to this area? */
export const appliesToArea = (doc: Pick<AreaDocument, 'scope' | 'organizational_area_id' | 'shared_areas'>, areaId: string) =>
  doc.scope === 'organization' ||
  doc.scope === 'plant' ||
  (doc.scope === 'area' && doc.organizational_area_id === areaId) ||
  (doc.scope === 'areas' && !!doc.shared_areas?.some((a) => a.id === areaId));

/**
 * Update document metadata (not file)
 */

// Quality-system document types used in codes (TYPE-KEY-NNN)
export const DOCUMENT_CODE_TYPES = [
  { prefix: 'MAN', label: 'Manual' },
  { prefix: 'POL', label: 'Política' },
  { prefix: 'PROC', label: 'Procedimiento' },
  { prefix: 'IT', label: 'Instrucción de trabajo' },
  { prefix: 'FOR', label: 'Formato' },
  { prefix: 'REG', label: 'Registro' },
  { prefix: 'PLAN', label: 'Plan' },
];

/** Suggested code type for a category */
export const codeTypeForCategory = (category: string) =>
  ({
    SOP: 'PROC',
    QUALITY_PROCEDURE: 'PROC',
    SAFETY_PROCEDURE: 'PROC',
    WORK_INSTRUCTION: 'IT',
    MANUAL: 'MAN',
    FORM_TEMPLATE: 'FOR',
    AUDIT_REPORT: 'REG',
    REPORT: 'REG',
  })[category] || null;

export const updateDocument = async (
  documentId: string,
  data: UpdateDocumentRequest
): Promise<AreaDocument> => {
  const response = await apiClient.patch(`/area-documents/${documentId}`, data);
  return response.data.data;
};

/**
 * Create new version of existing document
 */
export const createDocumentVersion = async (
  documentId: string,
  data: CreateVersionRequest
): Promise<AreaDocument> => {
  const response = await apiClient.post(`/area-documents/${documentId}/new-version`, data);
  return response.data.data;
};

/**
 * Delete (archive) document
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  await apiClient.delete(`/area-documents/${documentId}`);
};

/**
 * Get document statistics for an area
 */
export const getDocumentStats = async (areaId: string): Promise<DocumentStats> => {
  const response = await apiClient.get(`/organizational-areas/${areaId}/documents/stats`);
  return response.data.data;
};

/**
 * Get file icon based on MIME type
 */
export const getFileIcon = (mimeType: string | null | undefined): string => {
  if (!mimeType) return '🗂️'; // registered without file
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('image')) return '🖼️';
  return '📁';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes?: number | null): string => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Get category label in Spanish
 */
export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    SOP: 'SOP',
    WORK_INSTRUCTION: 'Instrucción de Trabajo',
    MANUAL: 'Manual de Equipo',
    QUALITY_PROCEDURE: 'Procedimiento de Calidad',
    AUDIT_REPORT: 'Reporte de Auditoría',
    SAFETY_PROCEDURE: 'Procedimiento de Seguridad',
    MSDS: 'Hoja de Seguridad (MSDS)',
    RISK_ANALYSIS: 'Análisis de Riesgos',
    DIAGRAM: 'Diagrama/Plano',
    FORM_TEMPLATE: 'Formato/Plantilla',
    REPORT: 'Reporte General',
    OTHER: 'Otro',
  };
  return labels[category] || category;
};

/**
 * Get status label in Spanish
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    active: 'Activo',
    under_review: 'En Revisión',
    archived: 'Archivado',
  };
  return labels[status] || status;
};

/**
 * Get status color for badges
 */
export const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
  const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
    draft: 'default',
    active: 'success',
    under_review: 'warning',
    archived: 'danger',
  };
  return colors[status] || 'default';
};
