// Same list as backend/src/config/permissions.ts, so a misspelled name does not compile.
export const PERMISSIONS = [
  'organizations.read', 'organizations.create', 'organizations.update', 'organizations.delete',
  'company_profile.read', 'company_profile.update',
  'plants.read', 'plants.create', 'plants.update', 'plants.delete',
  'areas.read', 'areas.create', 'areas.update', 'areas.delete',
  'layouts.read', 'layouts.create', 'layouts.update', 'layouts.delete',
  'employees.read', 'employees.create', 'employees.update', 'employees.delete', 'employees.assign', 'employees.import',
  'equipment.read', 'equipment.create', 'equipment.update', 'equipment.delete',
  'products.read', 'products.create', 'products.update', 'products.delete',
  'processes.read', 'processes.create', 'processes.update', 'processes.delete',
  'certifications.read', 'certifications.create', 'certifications.update', 'certifications.delete',
  'documents.read', 'documents.read_public', 'documents.create', 'documents.update', 'documents.delete',
  'safety.read', 'safety.update', 'safety.delete',
  'tours.read', 'tours.read_published', 'tours.create', 'tours.update', 'tours.delete', 'tours.publish', 'tours.share', 'tours.stats',
  'comments.read', 'comments.moderate', 'comments.delete',
  'users.read', 'users.create', 'users.update', 'users.delete',
  'reports.visits', 'reports.personnel', 'reports.certifications', 'reports.documents',
  'files.upload', 'files.delete',
  'system.home', 'system.audit', 'system.narration', 'system.maintenance',
  'roles.manage',
] as const;

export type PermissionName = (typeof PERMISSIONS)[number];

// Names on screen; the description of each permission comes from the server and is editable
export const CATEGORY_LABELS: Record<string, string> = {
  organizations: 'Organizaciones',
  company_profile: 'Perfil de empresa',
  plants: 'Plantas',
  areas: 'Áreas',
  layouts: 'Planos',
  employees: 'Personal',
  equipment: 'Equipos',
  products: 'Productos',
  processes: 'Procesos',
  certifications: 'Certificaciones',
  documents: 'Documentos',
  safety: 'Seguridad',
  tours: 'Tours',
  comments: 'Comentarios',
  users: 'Usuarios',
  reports: 'Reportes',
  files: 'Archivos',
  system: 'Plataforma',
  roles: 'Roles',
};

export const ACTION_LABELS: Record<string, string> = {
  read: 'Ver',
  read_public: 'Ver no privados',
  read_published: 'Ver publicados',
  create: 'Crear',
  update: 'Editar',
  delete: 'Eliminar',
  assign: 'Asignar',
  import: 'Importar',
  publish: 'Publicar',
  share: 'Compartir',
  stats: 'Estadísticas',
  moderate: 'Moderar',
  upload: 'Subir',
  visits: 'Visitas',
  personnel: 'Personal',
  certifications: 'Certificaciones',
  documents: 'Documentos',
  home: 'Inicio de plataforma',
  audit: 'Auditoría',
  narration: 'Narración',
  maintenance: 'Mantenimiento',
  manage: 'Administrar',
};

/** Ver first, then the rest in the order above, as a person reads a category */
export const byAction = (a: { action: string }, b: { action: string }) => {
  const order = Object.keys(ACTION_LABELS);
  return order.indexOf(a.action) - order.indexOf(b.action);
};

export const SCOPE_LABELS: Record<string, string> = {
  platform: 'Toda la plataforma',
  organization: 'Toda su empresa',
  plant: 'Sus plantas',
};

// Reading everything includes the narrow reads: same rule as backend/src/services/roleService.ts
const INCLUDED_IN_FULL_READ: Record<string, string> = {
  'tours.read': 'tours.read_published',
  'documents.read': 'documents.read_public',
};

/** A permission brings the read of its category: changing something needs to see it */
export const withRequired = (names: Iterable<string>, catalog: Set<string>): Set<string> => {
  const result = new Set(names);
  for (const name of [...result]) {
    const [resource, action] = name.split('.');
    if (!action.startsWith('read') && catalog.has(`${resource}.read`)) result.add(`${resource}.read`);
  }
  for (const [full, narrow] of Object.entries(INCLUDED_IN_FULL_READ)) if (result.has(full)) result.add(narrow);
  return result;
};
