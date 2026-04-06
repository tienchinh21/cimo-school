export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  teacher: {
    all: ['teacher'] as const,
    blogs: (classId: string) => [...queryKeys.teacher.all, 'blogs', classId] as const,
    checkins: (classId: string, date: string) => [...queryKeys.teacher.all, 'checkins', classId, date] as const,
    classes: () => [...queryKeys.teacher.all, 'classes'] as const,
    leaves: (classId: string, status?: string) =>
      [...queryKeys.teacher.all, 'leaves', classId, status ?? 'all'] as const,
    students: (classId: string) => [...queryKeys.teacher.all, 'students', classId] as const,
  },
} as const
