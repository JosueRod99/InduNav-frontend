/**
 * Lista de departamentos comunes en organizaciones industriales
 */
export const COMMON_DEPARTMENTS = [
  'Administración',
  'Almacén',
  'Calidad',
  'Compras',
  'Contabilidad',
  'Control de Producción',
  'Diseño',
  'Finanzas',
  'Ingeniería',
  'Legal',
  'Logística',
  'Mantenimiento',
  'Manufactura',
  'Mercadotecnia',
  'Planeación',
  'Producción',
  'Recursos Humanos',
  'Seguridad',
  'Sistemas / TI',
  'Ventas',
] as const;

export const DEPARTMENT_OPTIONS = COMMON_DEPARTMENTS.map(dept => ({
  value: dept,
  label: dept,
}));
