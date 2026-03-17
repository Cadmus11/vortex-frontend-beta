
import { Navigate } from "react-router"

type Props = {
  children: React.ReactNode
}

export default function AdminGuard({ children }: Props) {
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}