import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthHydrated, useAuthStatus, useIsAuthenticated } from '@/app/contexts/AuthContext'
import { getCurrentPath, getRedirectPath, LOGIN_PATH } from '@/app/router/auth-routing.utils'

function AuthGateFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div
        aria-live="polite"
        className="ui-card flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground"
        role="status"
      >
        <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-primary/60" />
        <span>Đang tải phiên đăng nhập...</span>
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
