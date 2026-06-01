import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute.jsx';
import { AdminRoute } from '../components/layout/AdminRoute.jsx';
import { AppShell } from '../components/layout/AppShell.jsx';
import { RouteLoading } from '../components/ui/RouteLoading.jsx';

const LoginPage = lazy(() =>
  import('../pages/auth/LoginPage.jsx').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('../pages/auth/RegisterPage.jsx').then((m) => ({ default: m.RegisterPage })),
);
const DashboardPage = lazy(() =>
  import('../pages/employee/DashboardPage.jsx').then((m) => ({ default: m.DashboardPage })),
);
const AttendancePage = lazy(() =>
  import('../pages/employee/AttendancePage.jsx').then((m) => ({ default: m.AttendancePage })),
);
const ReportsPage = lazy(() =>
  import('../pages/employee/ReportsPage.jsx').then((m) => ({ default: m.ReportsPage })),
);
const ProfilePage = lazy(() =>
  import('../pages/profile/ProfilePage.jsx').then((m) => ({ default: m.ProfilePage })),
);
const AdminDashboardPage = lazy(() =>
  import('../pages/admin/AdminDashboardPage.jsx').then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminReportsPage = lazy(() =>
  import('../pages/admin/AdminReportsPage.jsx').then((m) => ({ default: m.AdminReportsPage })),
);
const EmployeesPage = lazy(() =>
  import('../pages/admin/EmployeesPage.jsx').then((m) => ({ default: m.EmployeesPage })),
);
const EmployeeDetailPage = lazy(() =>
  import('../pages/admin/EmployeeDetailPage.jsx').then((m) => ({ default: m.EmployeeDetailPage })),
);
const AdminAttendancePage = lazy(() =>
  import('../pages/admin/AdminAttendancePage.jsx').then((m) => ({ default: m.AdminAttendancePage })),
);
const AttendanceEditPage = lazy(() =>
  import('../pages/admin/AttendanceEditPage.jsx').then((m) => ({ default: m.AttendanceEditPage })),
);

function Lazy({ children }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Lazy>
            <LoginPage />
          </Lazy>
        }
      />
      <Route
        path="/register"
        element={
          <Lazy>
            <RegisterPage />
          </Lazy>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route
            path="/dashboard"
            element={
              <Lazy>
                <DashboardPage />
              </Lazy>
            }
          />
          <Route
            path="/attendance"
            element={
              <Lazy>
                <AttendancePage />
              </Lazy>
            }
          />
          <Route
            path="/reports"
            element={
              <Lazy>
                <ReportsPage />
              </Lazy>
            }
          />
          <Route
            path="/profile"
            element={
              <Lazy>
                <ProfilePage />
              </Lazy>
            }
          />
          <Route element={<AdminRoute />}>
            <Route
              path="/admin/dashboard"
              element={
                <Lazy>
                  <AdminDashboardPage />
                </Lazy>
              }
            />
            <Route
              path="/admin/employees"
              element={
                <Lazy>
                  <EmployeesPage />
                </Lazy>
              }
            />
            <Route
              path="/admin/employees/:uid"
              element={
                <Lazy>
                  <EmployeeDetailPage />
                </Lazy>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <Lazy>
                  <AdminAttendancePage />
                </Lazy>
              }
            />
            <Route
              path="/admin/attendance/edit"
              element={
                <Lazy>
                  <AttendanceEditPage />
                </Lazy>
              }
            />
            <Route
              path="/admin/attendance/:userId/:date"
              element={
                <Lazy>
                  <AttendanceEditPage />
                </Lazy>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <Lazy>
                  <AdminReportsPage />
                </Lazy>
              }
            />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
