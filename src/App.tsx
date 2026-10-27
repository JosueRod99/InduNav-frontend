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
import TourEditorPage from './pages/tours/TourEditorPage';
import NarrationUsagePage from './pages/admin/NarrationUsagePage';
import TourViewerRealPage from './pages/tourViewer/TourViewerRealPage';
import PublicTourPage, { StopQrRedirect } from './pages/tourViewer/PublicTourPage';
import TourQrSheetPage from './pages/tours/TourQrSheetPage';
import StopsPage from './pages/stops/StopsPage';
import LayoutsPage from './pages/layouts/LayoutsPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import OrgChartPage from './pages/org-chart/OrgChartPage';
import ReportsPage from './pages/reports/ReportsPage';
import AreasPage from './pages/areas/AreasPage';
import AreaDetailPage from './pages/areas/AreaDetailPage';
import ProductsPage from './pages/products/ProductsPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import EquipmentPage from './pages/equipment/EquipmentPage';
import EquipmentDetailPage from './pages/equipment/EquipmentDetailPage';

// Public Pages
import LandingPage from './pages/LandingPage';
import TourCatalogPage from './pages/tour/TourCatalogPage';
import TourViewerPage from './pages/tour/TourViewerPage';

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
          <Route path="/" element={<LandingPage />} />

          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            }
          />

          {/* Public Tour Demo Routes */}
          <Route path="/tour" element={<TourCatalogPage />} />
          <Route path="/tour/:tourSlug" element={<TourViewerPage />} />

          {/* Real tours, public (no login): short link, readable link and stop QR codes */}
          <Route path="/t/:code" element={<PublicTourPage />} />
          <Route path="/t/:orgSlug/:tourSlug" element={<PublicTourPage />} />
          <Route path="/s/:qrCode" element={<StopQrRedirect />} />

          {/* Printable QR sheet of a tour (full page, for printing) */}
          <Route
            path="/tours/:tourId/qr-sheet"
            element={
              <PrivateRoute>
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner']}>
                  <TourQrSheetPage />
                </RoleProtectedRoute>
              </PrivateRoute>
            }
          />

          {/* Real tours: draft preview (full screen, outside the app layout; demo above is separate) */}
          <Route
            path="/preview/tours/:tourId"
            element={
              <PrivateRoute>
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner']}>
                  <TourViewerRealPage />
                </RoleProtectedRoute>
              </PrivateRoute>
            }
          />

          {/* Protected Routes with Layout */}
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
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
            <Route
              path="admin/narration-usage"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin']}>
                  <NarrationUsagePage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="tours/:tourId/edit"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner']}>
                  <TourEditorPage />
                </RoleProtectedRoute>
              }
            />
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
            <Route
              path="areas/:areaId"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner', 'plant_manager', 'supervisor']}>
                  <AreaDetailPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="products"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner']}>
                  <ProductsPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="products/:productId"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner']}>
                  <ProductDetailPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="equipment"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner']}>
                  <EquipmentPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="equipment/:id"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner']}>
                  <EquipmentDetailPage />
                </RoleProtectedRoute>
              }
            />
            <Route path="org-chart" element={<OrgChartPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          {/* 404 - Redirect to dashboard or login */}
          {/* 
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
          />
          */}

          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? '/dashboard' : '/tour'} replace />}
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
