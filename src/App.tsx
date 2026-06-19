import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/dashboard-page';
import { LandingPage } from './pages/landing-page';
import { AuthPage } from './pages/auth-page';
import { ProtectedRoute } from './components/protected-route';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
