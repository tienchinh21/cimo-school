import { BottomNavigation } from '@/app/components/bottom-navigation'
import { useIsAuthenticated } from '@/app/contexts/AuthContext'
import { isLoginPath } from '@/app/router/auth-routing.utils'
import { AppRouter } from '@/app/router/app-router'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/shared/lib'
import { useLocation } from 'react-router-dom'

export default function App() {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()
  const shouldShowBottomNavigation = isAuthenticated && !isLoginPath(location.pathname)

  return (
    <>
      <main
        className={cn(
          'min-h-screen overflow-x-hidden px-4 py-8 md:px-6 md:py-10',
          !shouldShowBottomNavigation
            ? 'bg-background px-0 py-0 pb-0 md:px-0 md:py-0 md:pb-0'
            : 'bg-linear-to-b from-background via-background to-secondary/40 pb-[calc(env(safe-area-inset-bottom)+7rem)] md:pb-32',
        )}
      >
        <AppRouter />
      </main>
      {shouldShowBottomNavigation ? <BottomNavigation /> : null}
      <Toaster richColors position="top-center" />
    </>
  )
}
