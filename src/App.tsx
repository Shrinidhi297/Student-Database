import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/dashboard-page';
import { LandingPage } from './pages/landing-page';
import { AuthPage } from './pages/auth-page';
import { StudentsListPage } from './pages/students-list-page';
import { ProtectedRoute } from './components/protected-route';
import { Component as SpotlightCursor } from '@/components/ui/spotlight-cursor';
import { TooltipProvider } from '@/components/ui/interfaces-tooltip';
import { ThemeProvider } from '@/lib/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="relative min-h-screen">
          <SpotlightCursor
            config={{ radius: 300, brightness: 0.12, color: '#a591ff' }}
          />
          <ThemeToggle />
          <div className="relative z-10">
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
              <Route
                path="/students"
                element={
                  <ProtectedRoute>
                    <StudentsListPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
