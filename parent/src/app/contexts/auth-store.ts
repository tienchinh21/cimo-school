import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { ParentProfileResponse } from '@/shared/api/auth.types'

export type AuthStatus = 'anonymous' | 'otp-pending' | 'authenticating' | 'authenticated'

type PersistedAuthState = {
  pendingPhone: string
  token: string | null
  user: ParentProfileResponse | null
}

type AuthActions = {
  backToPhoneEntry: () => void
  completeAuthentication: (payload: { token: string; user: ParentProfileResponse }) => void
  finishHydration: () => void
  hydratePersistedUser: (user: ParentProfileResponse) => void
  logout: () => void
  markOtpRequested: (phone: string) => void
  setPendingPhone: (phone: string) => void
}

type AuthStore = PersistedAuthState & {
  actions: AuthActions
  authStatus: AuthStatus
  isHydrated: boolean
}

const initialPersistedState: PersistedAuthState = {
  pendingPhone: '',
  token: null,
  user: null,
}

function deriveAuthStatus(state: PersistedAuthState): AuthStatus {
  if (state.token) {
    return 'authenticating'
  }

  if (state.pendingPhone) {
    return 'otp-pending'
  }

  return 'anonymous'
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => {
      const actions: AuthActions = {
        backToPhoneEntry: () =>
          set((state) => ({
            authStatus: 'anonymous',
            pendingPhone: state.pendingPhone,
            token: null,
            user: null,
          })),
        completeAuthentication: ({ token, user }) =>
          set({
            authStatus: 'authenticated',
            pendingPhone: '',
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
            pendingPhone: '',
            token: null,
            user: null,
          }),
        markOtpRequested: (phone) =>
          set({
            authStatus: 'otp-pending',
            pendingPhone: phone,
            token: null,
            user: null,
          }),
        setPendingPhone: (phone) =>
          set({
            pendingPhone: phone,
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
      name: 'parent-auth',
      onRehydrateStorage: () => (state) => {
        state?.actions.finishHydration()
      },
      partialize: (state) => ({
        pendingPhone: state.pendingPhone,
        token: state.token,
        user: state.user,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
