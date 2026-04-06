import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { TeacherProfileResponse } from '@/shared/api/auth.types'

export type AuthStatus = 'anonymous' | 'authenticating' | 'authenticated'

type PersistedAuthState = {
  token: string | null
  user: TeacherProfileResponse | null
}

type AuthActions = {
  completeAuthentication: (payload: { token: string; user: TeacherProfileResponse }) => void
  finishHydration: () => void
  hydratePersistedUser: (user: TeacherProfileResponse) => void
  logout: () => void
}

type AuthStore = PersistedAuthState & {
  actions: AuthActions
  authStatus: AuthStatus
  isHydrated: boolean
}

const initialPersistedState: PersistedAuthState = {
  token: null,
  user: null,
}

function deriveAuthStatus(state: PersistedAuthState): AuthStatus {
  if (state.token) {
    return 'authenticating'
  }

  return 'anonymous'
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => {
      const actions: AuthActions = {
        completeAuthentication: ({ token, user }) =>
          set({
            authStatus: 'authenticated',
            token,
            user,
          }),
        finishHydration: () =>
          set((state) => ({
            authStatus: deriveAuthStatus(state),
            isHydrated: true,
          })),
        hydratePersistedUser: (user) =>
          set((state) => ({
            authStatus: state.token ? 'authenticated' : 'anonymous',
            user,
          })),
        logout: () =>
          set({
            authStatus: 'anonymous',
            token: null,
            user: null,
          }),
      }

      return {
        ...initialPersistedState,
        actions,
        authStatus: 'anonymous',
        isHydrated: false,
      }
    },
    {
      name: 'teacher-auth',
      onRehydrateStorage: () => (state) => {
        state?.actions.finishHydration()
      },
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
