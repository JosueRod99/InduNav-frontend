import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, token, isInitialized } = useAuthStore();
  const location = useLocation();

  // Don't redirect while still checking authentication
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
