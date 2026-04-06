import { Outlet } from "react-router"
import { useAuth } from "@/hooks/useAuth";

const ProtectedRoute = ({ roles }: { roles?: Array<"admin" | "voter"> }) => {
  const { user, isLoading, isSignedIn } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  if (roles && user?.role && !roles.includes(user.role)) {
    return null;
  }

  return <Outlet />;
};

export default ProtectedRoute;
