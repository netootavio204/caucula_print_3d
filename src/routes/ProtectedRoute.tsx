import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageLoader } from '../components/ui/PageLoader'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { authenticated, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  return authenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />
}
