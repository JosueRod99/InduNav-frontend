// Area types: one list for every form and label (values stored in organizational_areas.area_type)
export const AREA_TYPES = [
  { value: 'production', label: 'Producción' },
  { value: 'quality', label: 'Calidad' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'warehouse', label: 'Almacén' },
  { value: 'logistics', label: 'Logística' },
  { value: 'shipping', label: 'Embarque' },
  { value: 'receiving', label: 'Recepción' },
  { value: 'laboratory', label: 'Laboratorio' },
  { value: 'administrative', label: 'Administrativa' },
  { value: 'office', label: 'Oficina' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Otro' },
];

const LEGACY_LABELS: Record<string, string> = { quality_control: 'Calidad' };

export const areaTypeLabel = (type: string | null | undefined) =>
  !type ? '' : AREA_TYPES.find((t) => t.value === type)?.label || LEGACY_LABELS[type] || type;
