import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type ClassActions = {
  clearActiveClass: () => void
  setActiveClassId: (classId: string) => void
}

type ClassStore = {
  actions: ClassActions
  activeClassId: string
}

export const useClassStore = create<ClassStore>()(
  persist(
    (set) => {
      const actions: ClassActions = {
        clearActiveClass: () =>
          set({
            activeClassId: '',
          }),
        setActiveClassId: (classId) =>
          set({
            activeClassId: classId,
          }),
      }

      return {
        actions,
        activeClassId: '',
      }
    },
    {
      name: 'teacher-class-context',
      partialize: (state) => ({
        activeClassId: state.activeClassId,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export function useActiveClassId() {
  return useClassStore((state) => state.activeClassId)
}

export function useClassActions() {
  return useClassStore((state) => state.actions)
}
