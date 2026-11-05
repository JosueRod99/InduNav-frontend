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
