/**
 * Protected Route Component - Handles route authentication and authorization
 * Redirects unauthenticated users to login and unauthorized users to appropriate pages
 */
import { Navigate, useLocation } from 'react-router-dom'
import { tokenUtils } from '../../services/api'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'customer'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const location = useLocation()
  const isAuthenticated = tokenUtils.isAuthenticated()
  const user = tokenUtils.getUser()

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    // If admin trying to access user routes or vice versa
    if (requiredRole === 'admin' && user?.role === 'customer') {
      return <Navigate to="/user/home" replace />
    }
    if (requiredRole === 'customer' && user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    // Default redirect to login for any other case
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
