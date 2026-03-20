import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: Array<"admin" | "voter">;
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user } = useAuth();

  if (!user) {
    // user not logged in → redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (roles && user?.role && !roles.includes(user.role)) {
    // user does not have required role
    return <Navigate to="/login" replace />;
  }

  // user has required role → show the route
  return <>{children}</>;
};

export default ProtectedRoute;
