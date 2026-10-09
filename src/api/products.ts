import apiClient from './client';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type ProductCategory =
  | 'raw_material'     // Materia Prima
  | 'component'        // Componente
  | 'sub_assembly'     // Subensamble
  | 'finished_product' // Producto Final
  | 'packaging'        // Empaque
  | 'tooling';         // Herramental/Moldes

export type ProductStatus =
  | 'active'           // Activo
  | 'discontinued'     // Descontinuado
  | 'in_development';  // En Desarrollo

export interface Product {
  id: string;
  organization_id: string;
  plant_id: string;

  // Product Identification
  sku: string;
  name: string;
  revision: string;
  description: string | null;

  // Categorization
  category: ProductCategory;
  tags: string[] | null;

  // Media
  primary_image_url: string | null;

  // Technical Specifications
  specifications: Record<string, any>;
  technical_document_url: string | null;

  // Status Management
  status: ProductStatus;
  is_private: boolean;

  // Audit Trail
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;

  // Relations (populated by queries)
  process_steps?: ProductProcessStep[];
  process_steps_count?: number;
}

export interface ProductProcessStep {
  id: string;
  product_id: string;
  organizational_area_id: string;

  // Step Details
  step_number: number;
  step_name: string;
  description: string | null;

  // Time Tracking
  estimated_duration_hours: number | null;

  // Additional Information
  notes: string | null;
  metadata: Record<string, any>;

  // Audit Trail
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;

  // Relations
  product?: Product;
  organizational_area?: {
    id: string;
    name: string;
    code: string | null;
    color: string | null;
  };
  // Backend also includes area_name, area_code, area_color
  area_name?: string;
  area_code?: string;
  area_color?: string;
}

// Request DTOs
export interface CreateProductRequest {
  organization_id: string;
  plant_id: string;
  sku: string;
  name: string;
  revision?: string;
  description?: string;
  category?: ProductCategory;
  tags?: string[];
  primary_image_url?: string;
  specifications?: Record<string, any>;
  technical_document_url?: string;
  status?: ProductStatus;
  is_private?: boolean;
}

export interface UpdateProductRequest {
  sku?: string;
  name?: string;
  revision?: string;
  description?: string;
  category?: ProductCategory;
  tags?: string[];
  primary_image_url?: string;
  specifications?: Record<string, any>;
  technical_document_url?: string;
  status?: ProductStatus;
  is_private?: boolean;
}

export interface CreateProcessStepRequest {
  organizational_area_id: string;
  step_number: number;
  step_name: string;
  description?: string;
  estimated_duration_hours?: number;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateProcessStepRequest {
  organizational_area_id?: string;
  step_number?: number;
  step_name?: string;
  description?: string;
  estimated_duration_hours?: number;
  notes?: string;
  metadata?: Record<string, any>;
}

// Response types
export interface ProductsResponse {
  products: Product[];
}

export interface ProductResponse {
  product: Product;
}

export interface ProcessStepsResponse {
  processSteps: ProductProcessStep[];
}

export interface ProcessStepResponse {
  processStep: ProductProcessStep;
}

// Category labels for UI
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  raw_material: 'Materia Prima',
  component: 'Componente',
  sub_assembly: 'Subensamble',
  finished_product: 'Producto Final',
  packaging: 'Empaque',
  tooling: 'Herramental/Moldes',
};

// Status labels for UI
export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Activo',
  discontinued: 'Descontinuado',
  in_development: 'En Desarrollo',
};

// ============================================================
// API FUNCTIONS - PRODUCTS
// ============================================================

/**
 * Get all products with optional filters
 */
export const getProducts = async (params?: {
  organization_id?: string;
  plant_id?: string;
  category?: ProductCategory;
  status?: ProductStatus;
  tags?: string[];
  search?: string;
  include_process_steps?: boolean;
  page?: number;
  limit?: number;
}): Promise<Product[]> => {
  const queryParams = params ? {
    ...params,
    tags: params.tags?.join(','),
  } : {};

  const { data } = await apiClient.get('/products', { params: queryParams });
  return data.products || [];
};

/**
 * Get product by ID
 */
export const getProduct = async (id: string, includeProcessSteps = false): Promise<Product> => {
  const { data } = await apiClient.get(`/products/${id}`, {
    params: { include_process_steps: includeProcessSteps },
  });
  return data.product;
};

/**
 * Get product by SKU
 */
export const getProductBySku = async (organizationId: string, sku: string): Promise<Product> => {
  const { data } = await apiClient.get(`/products/sku/${sku}`, {
    params: { organization_id: organizationId },
  });
  return data.product;
};

/**
 * Get products that use a specific area in their process
 */
export const getProductsByArea = async (areaId: string): Promise<Product[]> => {
  const { data } = await apiClient.get(`/products/by-area/${areaId}`);
  return data.products || [];
};

/**
 * Create new product
 */
export const createProduct = async (payload: CreateProductRequest): Promise<Product> => {
  const { data } = await apiClient.post('/products', payload);
  return data.product;
};

/**
 * Update product
 */
export const updateProduct = async (id: string, payload: UpdateProductRequest): Promise<Product> => {
  const { data } = await apiClient.patch(`/products/${id}`, payload);
  return data.product;
};

/**
 * Delete product
 */
export const deleteProduct = async (id: string): Promise<void> => {
  await apiClient.delete(`/products/${id}`);
};

// ============================================================
// API FUNCTIONS - PROCESS STEPS
// ============================================================

/**
 * Get all process steps for a product
 */
export const getProcessSteps = async (productId: string): Promise<ProductProcessStep[]> => {
  const { data } = await apiClient.get(`/products/${productId}/process-steps`);
  return data.processSteps || [];
};

/**
 * Get process step by ID
 */
export const getProcessStep = async (stepId: string): Promise<ProductProcessStep> => {
  const { data } = await apiClient.get(`/products/process-steps/${stepId}`);
  return data.processStep;
};

/**
 * Create process step
 */
export const createProcessStep = async (
  productId: string,
  payload: CreateProcessStepRequest
): Promise<ProductProcessStep> => {
  const { data } = await apiClient.post(`/products/${productId}/process-steps`, payload);
  return data.processStep;
};

/**
 * Update process step
 */
export const updateProcessStep = async (
  stepId: string,
  payload: UpdateProcessStepRequest
): Promise<ProductProcessStep> => {
  const { data } = await apiClient.patch(`/products/process-steps/${stepId}`, payload);
  return data.processStep;
};

/**
 * Delete process step
 */
export const deleteProcessStep = async (stepId: string): Promise<void> => {
  await apiClient.delete(`/products/process-steps/${stepId}`);
};

/**
 * Reorder process steps
 */
export const reorderProcessSteps = async (
  productId: string,
  stepOrders: { id: string; step_number: number }[]
): Promise<void> => {
  await apiClient.put(`/products/${productId}/process-steps/reorder`, { stepOrders });
};
