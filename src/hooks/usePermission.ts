export function usePermission(requiredRole: string) {
    const { user } = useAuth()
  
    return user?.role === requiredRole
  }