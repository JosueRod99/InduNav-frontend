import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import ConfirmDialog from './components/ui/ConfirmDialog';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import PermissionRoute from './components/PermissionRoute';
import AppLayout from './components/layout/AppLayout';

// Placeholder pages (we'll create these next)
import OrganizationsPage from './pages/organizations/OrganizationsPage';
import UsersPage from './pages/users/UsersPage';
import PlantsPage from './pages/plants/PlantsPage';
import ToursPage from './pages/tours/ToursPage';
import TourEditorPage from './pages/tours/TourEditorPage';
import NarrationUsagePage from './pages/admin/NarrationUsagePage';
import RolesPage from './pages/admin/RolesPage';
import RoleEditorPage from './pages/admin/RoleEditorPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import LanguagesPage from './pages/admin/LanguagesPage';
import TourStatsPage from './pages/tours/TourStatsPage';
import PlantWorkspacePage from './pages/plants/PlantWorkspacePage';
import LegacyPlantRedirect from './pages/plants/LegacyPlantRedirect';
import OrganizationWorkspacePage from './pages/organizations/OrganizationWorkspacePage';
import TourViewerRealPage from './pages/tourViewer/TourViewerRealPage';
import PublicTourPage, { StopQrRedirect } from './pages/tourViewer/PublicTourPage';
import TourQrSheetPage from './pages/tours/TourQrSheetPage';
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
      {/* Above the modals: many of these messages are shown from inside one */}
      <Toaster position="top-right" containerStyle={{ zIndex: 10000 }} />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />

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
                <PermissionRoute anyOf={['tours.share']}>
                  <TourQrSheetPage />
                </PermissionRoute>
              </PrivateRoute>
            }
          />

          {/* Real tours: draft preview (full screen, outside the app layout; demo above is separate) */}
          <Route
            path="/preview/tours/:tourId"
            element={
              <PrivateRoute>
                <PermissionRoute anyOf={['tours.read']}>
                  <TourViewerRealPage />
                </PermissionRoute>
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
                <PermissionRoute anyOf={['organizations.create']}>
                  <OrganizationsPage />
                </PermissionRoute>
              }
            />
            {/* Organization page (platform admins: any; organization owners: their own, "Mi empresa") */}
            {['organizations/:orgId', 'organizations/:orgId/:tab'].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <PermissionRoute anyOf={['organizations.read']}>
                    <OrganizationWorkspacePage />
                  </PermissionRoute>
                }
              />
            ))}
            <Route
              path="users"
              element={
                <PermissionRoute anyOf={['users.read']}>
                  <UsersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="plants"
              element={
                <PermissionRoute anyOf={['plants.read']}>
                  <PlantsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="tours"
              element={
                <PermissionRoute anyOf={['tours.read', 'tours.read_published']}>
                  <ToursPage />
                </PermissionRoute>
              }
            />
            <Route
              path="admin/audit"
              element={
                <PermissionRoute anyOf={['system.audit']}>
                  <AuditLogPage />
                </PermissionRoute>
              }
            />
            {['admin/roles', 'admin/roles/nuevo', 'admin/roles/:roleId'].map((path, index) => (
              <Route
                key={path}
                path={path}
                element={<PermissionRoute anyOf={['roles.manage']}>{index === 0 ? <RolesPage /> : <RoleEditorPage />}</PermissionRoute>}
              />
            ))}
            <Route
              path="admin/languages"
              element={
                <PermissionRoute anyOf={['system.languages']}>
                  <LanguagesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="admin/narration-usage"
              element={
                <PermissionRoute anyOf={['system.narration']}>
                  <NarrationUsagePage />
                </PermissionRoute>
              }
            />
            <Route
              path="tours/:tourId/edit"
              element={
                <PermissionRoute anyOf={['tours.update']}>
                  <TourEditorPage />
                </PermissionRoute>
              }
            />
            <Route
              path="tours/:tourId/stats"
              element={
                <PermissionRoute anyOf={['tours.stats']}>
                  <TourStatsPage />
                </PermissionRoute>
              }
            />
            {/* Plant workspace: all sections of one plant behind tabs */}
            {['plants/:plantId', 'plants/:plantId/:tab'].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <PermissionRoute anyOf={['plants.read']}>
                    <PlantWorkspacePage />
                  </PermissionRoute>
                }
              />
            ))}
            {/* Old section pages: now tabs of each plant (redirect keeps old links working) */}
            <Route path="layouts" element={<LegacyPlantRedirect tab="layout" />} />
            <Route path="employees" element={<LegacyPlantRedirect tab="personal" />} />
            <Route path="areas" element={<LegacyPlantRedirect tab="areas" />} />
            <Route
              path="areas/:areaId"
              element={
                <PermissionRoute anyOf={['areas.read']}>
                  <AreaDetailPage />
                </PermissionRoute>
              }
            />
            <Route path="products" element={<LegacyPlantRedirect tab="productos" />} />
            <Route
              path="products/:productId"
              element={
                <PermissionRoute anyOf={['products.read']}>
                  <ProductDetailPage />
                </PermissionRoute>
              }
            />
            <Route path="equipment" element={<LegacyPlantRedirect tab="equipos" />} />
            <Route
              path="equipment/:id"
              element={
                <PermissionRoute anyOf={['equipment.read']}>
                  <EquipmentDetailPage />
                </PermissionRoute>
              }
            />
            <Route path="org-chart" element={<LegacyPlantRedirect tab="personal" query="?vista=organigrama" />} />
            <Route
              path="reports"
              element={
                <PermissionRoute anyOf={['reports.documents', 'reports.certifications', 'reports.personnel', 'reports.visits']}>
                  <ReportsPage />
                </PermissionRoute>
              }
            />
          </Route>

          {/* 404: with a session to the dashboard, without one to the landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <ConfirmDialog />
    </>
  );
}

export default App;
