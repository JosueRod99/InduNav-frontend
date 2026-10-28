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
import AuditLogPage from './pages/admin/AuditLogPage';
import TourStatsPage from './pages/tours/TourStatsPage';
import PlantWorkspacePage from './pages/plants/PlantWorkspacePage';
import LegacyPlantRedirect from './pages/plants/LegacyPlantRedirect';
import OrganizationWorkspacePage from './pages/organizations/OrganizationWorkspacePage';
import TourViewerRealPage from './pages/tourViewer/TourViewerRealPage';
import PublicTourPage, { StopQrRedirect } from './pages/tourViewer/PublicTourPage';
import TourQrSheetPage from './pages/tours/TourQrSheetPage';
import StopsPage from './pages/stops/StopsPage';
import ReportsPage from './pages/reports/ReportsPage';
import AreaDetailPage from './pages/areas/AreaDetailPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
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
            {/* Organization page (platform admins: any; organization owners: their own, "Mi empresa") */}
            {['organizations/:orgId', 'organizations/:orgId/:tab'].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner']}>
                    <OrganizationWorkspacePage />
                  </RoleProtectedRoute>
                }
              />
            ))}
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
                <PlantsPage />
              }
            />
            <Route path="tours" element={<ToursPage />} />
            <Route
              path="admin/audit"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin']}>
                  <AuditLogPage />
                </RoleProtectedRoute>
              }
            />
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
            <Route
              path="tours/:tourId/stats"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner']}>
                  <TourStatsPage />
                </RoleProtectedRoute>
              }
            />
            {/* Plant workspace: all sections of one plant behind tabs */}
            <Route path="plants/:plantId" element={<PlantWorkspacePage />} />
            <Route path="plants/:plantId/:tab" element={<PlantWorkspacePage />} />
            <Route path="stops" element={<StopsPage />} />
            {/* Old section pages: now tabs of each plant (redirect keeps old links working) */}
            <Route path="layouts" element={<LegacyPlantRedirect tab="layout" />} />
            <Route path="employees" element={<LegacyPlantRedirect tab="personal" />} />
            <Route path="areas" element={<LegacyPlantRedirect tab="areas" />} />
            <Route
              path="areas/:areaId"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner', 'plant_manager', 'supervisor']}>
                  <AreaDetailPage />
                </RoleProtectedRoute>
              }
            />
            <Route path="products" element={<LegacyPlantRedirect tab="productos" />} />
            <Route
              path="products/:productId"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner']}>
                  <ProductDetailPage />
                </RoleProtectedRoute>
              }
            />
            <Route path="equipment" element={<LegacyPlantRedirect tab="equipos" />} />
            <Route
              path="equipment/:id"
              element={
                <RoleProtectedRoute allowedRoles={['platform_admin', 'org_owner']}>
                  <EquipmentDetailPage />
                </RoleProtectedRoute>
              }
            />
            <Route path="org-chart" element={<LegacyPlantRedirect tab="personal" query="?vista=organigrama" />} />
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
