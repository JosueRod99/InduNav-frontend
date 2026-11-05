import apiClient from './client';

// "Roles y permisos" (platform only)

export interface ManagedRole {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system: boolean;
  scope: 'platform' | 'organization' | 'plant';
  users_count: number;
  permissions: string[];
}

export interface CatalogPermission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  platform_only: boolean;
  roles: string[];
}

export interface RoleInput {
  display_name: string;
  description: string | null;
  scope: 'organization' | 'plant';
  permissions: string[];
}

export const getManagedRoles = async (): Promise<ManagedRole[]> => (await apiClient.get('/roles')).data.roles;

export const getManagedRole = async (id: string): Promise<ManagedRole> => (await apiClient.get(`/roles/${id}`)).data.role;

export const createRole = async (input: RoleInput): Promise<ManagedRole> => (await apiClient.post('/roles', input)).data.role;

export const updateRole = async (id: string, input: Partial<RoleInput>): Promise<ManagedRole> =>
  (await apiClient.patch(`/roles/${id}`, input)).data.role;

export const deleteRole = async (id: string): Promise<void> => {
  await apiClient.delete(`/roles/${id}`);
};

export const getPermissionCatalog = async (): Promise<CatalogPermission[]> => (await apiClient.get('/roles/permissions')).data.permissions;

export const updatePermissionDescription = async (id: string, description: string): Promise<void> => {
  await apiClient.patch(`/roles/permissions/${id}`, { description });
};
