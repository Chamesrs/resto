import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "hooks/useAuth";
import { hasAllowedRole, normalizeRole, resolveHomePath } from "lib/accessControl";

const ProtectedRoute = ({ allowedRoles = [], fallback = null }) => {
  const location = useLocation();
  const { user, claims, isLoading } = useAuth();

  if (isLoading) {
    return fallback;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = normalizeRole(claims?.role);
  if (!claims?.approved || role === "employer") {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!hasAllowedRole(role, allowedRoles)) {
    return <Navigate to={resolveHomePath(role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
