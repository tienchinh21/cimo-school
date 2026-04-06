export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  health: {
    all: ['health'] as const,
    detail: () => [...queryKeys.health.all, 'detail'] as const,
  },
  home: {
    all: ['home'] as const,
    blogs: () => [...queryKeys.home.all, 'blogs'] as const,
  },
  news: {
    all: ['news'] as const,
    list: (category: string) => [...queryKeys.news.all, 'list', category] as const,
    detail: (blogId: string) => [...queryKeys.news.all, 'detail', blogId] as const,
  },
  schedule: {
    all: ['schedule'] as const,
    dashboard: () => [...queryKeys.schedule.all, 'dashboard'] as const,
  },
  leave: {
    all: ['leave'] as const,
    dashboard: () => [...queryKeys.leave.all, 'dashboard'] as const,
    detail: (requestId: string) => [...queryKeys.leave.all, 'detail', requestId] as const,
  },
  score: {
    all: ['score'] as const,
    dashboard: () => [...queryKeys.score.all, 'dashboard'] as const,
    detail: (subjectId: string) => [...queryKeys.score.all, 'detail', subjectId] as const,
  },
} as const
