import { Navigate, Outlet } from 'react-router-dom'
import { PageLoader } from '../components/ui/PageLoader'
import { useAuth } from '../hooks/useAuth'

export function PublicOnlyRoute() {
  const { authenticated, loading } = useAuth()
  if (loading) return <PageLoader />
  return authenticated ? <Navigate to="/app/orcamento" replace /> : <Outlet />
}
