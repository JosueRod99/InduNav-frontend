import apiClient from './client';

export interface AreaDocument {
  id: string;
  organizational_area_id: string;
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
  organizational_area_id: string;
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

/**
 * Update document metadata (not file)
 */
/** Code the next document of this type and key would get, e.g. PROC-RH-003 */
export const getNextDocumentCode = async (areaId: string, prefix: string, key: string): Promise<string> => {
  const response = await apiClient.get(`/organizational-areas/${areaId}/documents/next-code`, { params: { prefix, key } });
  return response.data.data.code;
};

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
