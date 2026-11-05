import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import type { PermissionName } from '../utils/permissions';

/**
 * What the current user can do, as the server says: can('tours.update'), or several names when any
 * of them is enough. It only decides what to show: the API checks every request again.
 */
export const useCan = () => {
  const permissions = useAuthStore((state) => state.user?.permissions);
  return useCallback(
    (...names: PermissionName[]) => names.some((name) => permissions?.includes(name)),
    [permissions]
  );
};
