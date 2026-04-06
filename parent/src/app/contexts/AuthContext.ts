import type { PropsWithChildren } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useAuthStore } from '@/app/contexts/auth-store'
import { getParentProfile } from '@/shared/api/auth'
import { queryKeys } from '@/shared/api/query-keys'

function useAuthSessionBootstrap() {
  const authStatus = useAuthStore((state) => state.authStatus)
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const token = useAuthStore((state) => state.token)

  useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      if (!token) {
        throw new Error('Missing auth token.')
      }

      try {
        const profile = await getParentProfile(token)
        useAuthStore.getState().actions.hydratePersistedUser(profile)
        return profile
      } catch (error) {
        useAuthStore.getState().actions.logout()
        throw error
      }
    },
    enabled: isHydrated && Boolean(token) && authStatus === 'authenticating',
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}

export function AuthProvider({ children }: PropsWithChildren) {
  useAuthSessionBootstrap()

  return children
}

export function useAuthActions() {
  return useAuthStore((state) => state.actions)
}

export function useAuthHydrated() {
  return useAuthStore((state) => state.isHydrated)
}

export function useAuthStatus() {
  return useAuthStore((state) => state.authStatus)
}

export function useAuthToken() {
  return useAuthStore((state) => state.token)
}

export function useAuthUser() {
  return useAuthStore((state) => state.user)
}

export function useIsAuthenticated() {
  return useAuthStore((state) => state.authStatus === 'authenticated' && Boolean(state.token))
}

export function usePendingPhone() {
  return useAuthStore((state) => state.pendingPhone)
}
