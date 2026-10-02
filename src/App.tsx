import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Placeholder pages (we'll create these next)
import OrganizationsPage from './pages/organizations/OrganizationsPage';
import UsersPage from './pages/users/UsersPage';
import PlantsPage from './pages/plants/PlantsPage';
import ToursPage from './pages/tours/ToursPage';
import StopsPage from './pages/stops/StopsPage';
import LayoutsPage from './pages/layouts/LayoutsPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import OrgChartPage from './pages/org-chart/OrgChartPage';
import ReportsPage from './pages/reports/ReportsPage';
import AreasPage from './pages/areas/AreasPage';

function App() {
  const { checkAuth, isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    // Check authentication status on app load (only once)
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading while checking authentication
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            }
          />

          {/* Protected Routes with Layout */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route
              path="organizations"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin']}>
                  <OrganizationsPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin']}>
                  <UsersPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="plants"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner']}>
                  <PlantsPage />
                </RoleProtectedRoute>
              }
            />
            <Route path="tours" element={<ToursPage />} />
            <Route path="stops" element={<StopsPage />} />
            <Route path="layouts" element={<LayoutsPage />} />
            <Route
              path="employees"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner']}>
                  <EmployeesPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="areas"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner', 'plant_manager']}>
                  <AreasPage />
                </RoleProtectedRoute>
              }
            />
            <Route path="org-chart" element={<OrgChartPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          {/* 404 - Redirect to dashboard or login */}
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
