import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './components/layout/AppLayout';

// Placeholder pages (we'll create these next)
import OrganizationsPage from './pages/organizations/OrganizationsPage';
import PlantsPage from './pages/plants/PlantsPage';
import ToursPage from './pages/tours/ToursPage';
import StopsPage from './pages/stops/StopsPage';
import LayoutsPage from './pages/layouts/LayoutsPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import OrgChartPage from './pages/org-chart/OrgChartPage';
import ReportsPage from './pages/reports/ReportsPage';

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check authentication status on app load (only once)
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="plants" element={<PlantsPage />} />
            <Route path="tours" element={<ToursPage />} />
            <Route path="stops" element={<StopsPage />} />
            <Route path="layouts" element={<LayoutsPage />} />
            <Route path="employees" element={<EmployeesPage />} />
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
