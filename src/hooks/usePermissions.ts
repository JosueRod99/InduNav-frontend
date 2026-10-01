import { useAuthStore } from '../store/authStore';

/**
 * Hook to check if the current user has a specific role
 * @param roles - Single role name or array of role names
 * @returns true if user has any of the specified roles
 */
export const useHasRole = (roles: string | string[]): boolean => {
  const { user } = useAuthStore();

  if (!user || !user.role) {
    return false;
  }

  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role.name);
};

/**
 * Hook to check if the current user has a specific permission
 * @param permission - Permission name (e.g., "organizations.create")
 * @returns true if user has the permission
 */
export const useHasPermission = (permission: string): boolean => {
  const { user } = useAuthStore();

  if (!user) {
    return false;
  }

  // Platform admin has all permissions
  if (user.role?.name === 'platform_admin') {
    return true;
  }

  // Check if user has the specific permission
  return user.permissions?.includes(permission) ?? false;
};

/**
 * Hook to check if user can manage a specific organization
 * @param organizationId - Organization ID to check
 * @returns true if user can manage the organization
 */
export const useCanManageOrganization = (organizationId?: string | null): boolean => {
  const { user } = useAuthStore();

  if (!user) {
    return false;
  }

  // Platform admin can manage all organizations
  if (user.role?.name === 'platform_admin') {
    return true;
  }

  // Org owner can only manage their own organization
  if (user.role?.name === 'org_owner' && user.organization_id === organizationId) {
    return true;
  }

  return false;
};

/**
 * Hook to check if the current user is a platform admin
 * @returns true if user is platform admin
 */
export const useIsPlatformAdmin = (): boolean => {
  return useHasRole('platform_admin');
};

/**
 * Hook to get all available permission utilities
 * @returns Object with permission checking functions
 */
export const usePermissions = () => {
  const { user } = useAuthStore();

  const hasRole = (roles: string | string[]): boolean => {
    if (!user || !user.role) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role.name);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role?.name === 'platform_admin') return true;
    return user.permissions?.includes(permission) ?? false;
  };

  const canManageOrganization = (organizationId?: string | null): boolean => {
    if (!user) return false;
    if (user.role?.name === 'platform_admin') return true;
    if (user.role?.name === 'org_owner' && user.organization_id === organizationId) {
      return true;
    }
    return false;
  };

  return {
    hasRole,
    hasPermission,
    canManageOrganization,
    isPlatformAdmin: user?.role?.name === 'platform_admin',
    isOrgOwner: user?.role?.name === 'org_owner',
    isPlantManager: user?.role?.name === 'plant_manager',
    isTourCreator: user?.role?.name === 'tour_creator',
    userRole: user?.role?.name,
    organizationId: user?.organization_id,
  };
};
