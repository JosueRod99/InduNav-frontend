import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useHasRole } from '../hooks/usePermissions';
import { useAuthStore } from '../store/authStore';

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

/**
 * Component that protects routes based on user roles
 * Redirects to dashboard if user doesn't have required role
 */
const RoleProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = '/dashboard'
}: RoleProtectedRouteProps) => {
  const { user, isInitialized } = useAuthStore();
  const hasRole = useHasRole(allowedRoles);

  // Wait for auth to initialize
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // User doesn't have required role
  if (!user || !hasRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
