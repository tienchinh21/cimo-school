import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AuthRole {
  id?: string;
  name?: string;
}

export interface AuthProfile {
  id?: string;
  username?: string;
  name?: string;
  soRoles?: AuthRole[];
  [key: string]: unknown;
}

interface AuthState {
  token: string | null;
  profile: AuthProfile | null;
  setToken: (token: string | null) => void;
  setProfile: (profile: AuthProfile | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      profile: null,
      setToken: (token) => {
        set({ token });
      },
      setProfile: (profile) => {
        set({ profile });
      },
      clearAuth: () => {
        set({ token: null, profile: null });
      },
    }),
    {
      name: 'cimo-cms-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
