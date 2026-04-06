import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { GuestOnlyRoute, ProtectedRoute } from '@/app/router/auth-routing'

const AttendancePage = lazy(() =>
  import('@/pages/attendance').then((module) => ({ default: module.AttendancePage })),
)
const HealthPage = lazy(() => import('@/pages/health').then((module) => ({ default: module.HealthPage })))
const HomePage = lazy(() => import('@/pages/home').then((module) => ({ default: module.HomePage })))
const LeavePage = lazy(() => import('@/pages/leave').then((module) => ({ default: module.LeavePage })))
const LeaveCreatePage = lazy(() =>
  import('@/pages/leave').then((module) => ({ default: module.LeaveCreatePage })),
)
const LeaveDetailPage = lazy(() =>
  import('@/pages/leave').then((module) => ({ default: module.LeaveDetailPage })),
)
const LoginPage = lazy(() => import('@/pages/login').then((module) => ({ default: module.LoginPage })))
const NewsPage = lazy(() => import('@/pages/news').then((module) => ({ default: module.NewsPage })))
const NewsDetailPage = lazy(() =>
  import('@/pages/news').then((module) => ({ default: module.NewsDetailPage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/not-found').then((module) => ({ default: module.NotFoundPage })),
)
const ScorePage = lazy(() => import('@/pages/score').then((module) => ({ default: module.ScorePage })))
const ScoreSubjectDetailPage = lazy(() =>
  import('@/pages/score').then((module) => ({ default: module.ScoreSubjectDetailPage })),
)
const ProfilePage = lazy(() => import('@/pages/profile').then((module) => ({ default: module.ProfilePage })))
const SchedulePage = lazy(() =>
  import('@/pages/schedule').then((module) => ({ default: module.SchedulePage })),
)

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div
        aria-live="polite"
        className="ui-card flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground"
        role="status"
      >
        <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-primary/60" />
        <span>Dang tai trang...</span>
      </div>
    </div>
  )
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<Navigate replace to="/" />} />
          <Route path="/discover" element={<HealthPage />} />
          <Route path="/library" element={<HomePage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/prayer" element={<LeavePage />} />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/leave/create" element={<LeaveCreatePage />} />
          <Route path="/leave/:requestId/edit" element={<LeaveCreatePage />} />
          <Route path="/leave/:requestId" element={<LeaveDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:blogId" element={<NewsDetailPage />} />
          <Route path="/score" element={<ScorePage />} />
          <Route path="/score/subject/:subjectId" element={<ScoreSubjectDetailPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
