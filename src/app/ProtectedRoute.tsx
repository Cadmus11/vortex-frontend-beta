import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useAuth();

  if (!user) {
    // user not logged in → redirect to login page
    return <Navigate to="/login" replace />;
  }

  // user logged in → show the route
  return children;
};

export default ProtectedRoute;