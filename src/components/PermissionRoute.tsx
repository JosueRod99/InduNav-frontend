import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useCan } from '../hooks/usePermissions';
import type { PermissionName } from '../utils/permissions';
import { useAuthStore } from '../store/authStore';

interface PermissionRouteProps {
  children: ReactNode;
  anyOf: PermissionName[];
  redirectTo?: string;
}

/**
 * Protects a route: any of these permissions opens it
 * Redirects to dashboard without them
 */
const PermissionRoute = ({
  children,
  anyOf,
  redirectTo = '/dashboard'
}: PermissionRouteProps) => {
  const { user, isInitialized } = useAuthStore();
  const can = useCan();

  // Wait for auth to initialize
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !can(...anyOf)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default PermissionRoute;
