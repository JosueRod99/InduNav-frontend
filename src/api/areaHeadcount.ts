import apiClient from './client';

// Unnamed staff of an area by position (PLAN_LAB_KRAFT.md point 3)

export interface HeadcountRow {
  id: string;
  area_id: string;
  position: string;
  quantity: number;
  shift: string | null;
  display_order: number;
}

export const getHeadcount = async (areaId: string): Promise<HeadcountRow[]> =>
  (await apiClient.get('/area-headcount', { params: { area_id: areaId } })).data.data;

export const addHeadcount = async (payload: { area_id: string; position: string; quantity: number; shift?: string | null }) =>
  (await apiClient.post('/area-headcount', payload)).data as HeadcountRow;

export const updateHeadcount = async (id: string, payload: { position?: string; quantity?: number; shift?: string | null }) =>
  (await apiClient.patch(`/area-headcount/${id}`, payload)).data as HeadcountRow;

export const removeHeadcount = async (id: string) => {
  await apiClient.delete(`/area-headcount/${id}`);
};
