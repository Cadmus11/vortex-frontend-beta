import { Outlet, Navigate, useLocation } from "react-router"
import { useAuth } from "@/context/AuthContext";

const ProtectedRoute = ({ roles }: { roles?: Array<"admin" | "voter"> }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user?.role && !roles.includes(user.role)) {
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/voter/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
