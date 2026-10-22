import apiClient from './client';
import type { EquipmentStatus, EquipmentType } from './equipment';

// Equipment (tools/machinery) used in product process steps — see PLAN_PRODUCTOS_EQUIPOS.md

export type StepEquipmentUsageType = 'required' | 'optional';

export const USAGE_TYPE_LABELS: Record<StepEquipmentUsageType, string> = {
  required: 'Requerido',
  optional: 'Opcional',
};

export interface ProductStepEquipment {
  id: string;
  process_step_id: string;
  equipment_id: string;
  usage_type: StepEquipmentUsageType;
  notes: string | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;

  // Populated from joins
  equipment_code: string;
  equipment_name: string;
  equipment_type: EquipmentType;
  equipment_status: EquipmentStatus;
  equipment_image_url: string | null;
  in_step_area: boolean; // equipment is currently assigned to the step's area
  current_area_id: string | null;
  current_area_name: string | null;
  product_id: string;
  product_name: string;
  product_sku: string;
  step_number: number;
  step_name: string;
  step_area_id: string;
  step_area_name: string;
}

export interface StepEquipmentCandidate {
  id: string;
  code: string;
  name: string;
  equipment_type: EquipmentType;
  status: EquipmentStatus;
  primary_image_url: string | null;
  current_area_id: string | null;
  current_area_name: string | null;
}

export interface StepEquipmentCandidates {
  step_area_id: string;
  step_area_name: string;
  in_area: StepEquipmentCandidate[];
  other_in_plant: StepEquipmentCandidate[];
}

// Statuses that make a required equipment block its process step
export const BLOCKING_EQUIPMENT_STATUSES: EquipmentStatus[] = ['maintenance', 'out_of_service', 'retired'];

export const getProductEquipment = async (productId: string): Promise<ProductStepEquipment[]> => {
  const { data } = await apiClient.get(`/products/${productId}/equipment`);
  return data.links || [];
};

export const getStepEquipmentCandidates = async (stepId: string): Promise<StepEquipmentCandidates> => {
  const { data } = await apiClient.get(`/products/process-steps/${stepId}/equipment/candidates`);
  return data.candidates;
};

export const createStepEquipment = async (
  stepId: string,
  payload: { equipment_id: string; usage_type?: StepEquipmentUsageType; notes?: string | null }
): Promise<ProductStepEquipment> => {
  const { data } = await apiClient.post(`/products/process-steps/${stepId}/equipment`, payload);
  return data.link;
};

export const updateStepEquipment = async (
  linkId: string,
  payload: { usage_type?: StepEquipmentUsageType; notes?: string | null; display_order?: number }
): Promise<ProductStepEquipment> => {
  const { data } = await apiClient.patch(`/products/step-equipment/${linkId}`, payload);
  return data.link;
};

export const deleteStepEquipment = async (linkId: string): Promise<void> => {
  await apiClient.delete(`/products/step-equipment/${linkId}`);
};

export const getEquipmentProducts = async (equipmentId: string): Promise<ProductStepEquipment[]> => {
  const { data } = await apiClient.get(`/equipment/${equipmentId}/products`);
  return data.links || [];
};
