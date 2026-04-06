import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { useAuthHydrated, useAuthStatus, useIsAuthenticated } from '@/app/contexts/AuthContext'
import { getCurrentPath, getRedirectPath, LOGIN_PATH } from '@/app/router/auth-routing.utils'

function AuthGateFallback() {
  return (
    <div aria-live="polite" role="status" className="mx-auto w-full max-w-md space-y-4 px-4 pt-4">
      <div className="ui-section space-y-3 p-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-[4.5rem] w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  )
}

export function GuestOnlyRoute() {
  const authStatus = useAuthStatus()
  const isHydrated = useAuthHydrated()
  const location = useLocation()

  if (!isHydrated || authStatus === 'authenticating') {
    return <AuthGateFallback />
  }

  if (authStatus === 'authenticated') {
    return <Navigate replace state={null} to={getRedirectPath(location.state)} />
  }

  return <Outlet />
}

export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated()
  const authStatus = useAuthStatus()
  const isHydrated = useAuthHydrated()
  const location = useLocation()

  if (!isHydrated || authStatus === 'authenticating') {
    return <AuthGateFallback />
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: getCurrentPath(location) }} to={LOGIN_PATH} />
  }

  return <Outlet />
}
