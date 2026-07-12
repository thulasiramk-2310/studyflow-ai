import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * AuthLayout — wraps Login and Register pages.
 * If already authenticated, redirects straight to /dashboard.
 */
export function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Outlet />
    </div>
  );
}
