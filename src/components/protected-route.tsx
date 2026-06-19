import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
        Loading secure workspace...
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
