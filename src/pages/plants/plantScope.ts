import type { ReactNode } from 'react';

// Module pages (areas, equipment, products…) can render inside the plant workspace with a fixed
// plant: they hide their organization/plant selectors and page title.
export interface PlantScopedProps {
  plantId?: string;
  organizationId?: string;
  viewSwitch?: ReactNode; // shown right under the section header (e.g. Personal: Lista / Organigrama)
}
