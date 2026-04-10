import { Navigate } from "react-router"
import { useAuth } from "@/hooks/useAuth"

type Props = {
  children: React.ReactNode
}

export default function AdminGuard({ children }: Props) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}