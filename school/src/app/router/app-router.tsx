import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { GuestOnlyRoute, ProtectedRoute } from '@/app/router/auth-routing'

const AttendancePage = lazy(() =>
  import('@/pages/attendance').then((module) => ({ default: module.AttendancePage })),
)
const ClassesPage = lazy(() => import('@/pages/classes').then((module) => ({ default: module.ClassesPage })))
const DashboardPage = lazy(() =>
  import('@/pages/dashboard').then((module) => ({ default: module.DashboardPage })),
)
const LeavesPage = lazy(() => import('@/pages/leaves').then((module) => ({ default: module.LeavesPage })))
const LoginPage = lazy(() => import('@/pages/login').then((module) => ({ default: module.LoginPage })))
const NewsPage = lazy(() => import('@/pages/news').then((module) => ({ default: module.NewsPage })))
const NotFoundPage = lazy(() =>
  import('@/pages/not-found').then((module) => ({ default: module.NotFoundPage })),
)
const ProfilePage = lazy(() =>
  import('@/pages/profile').then((module) => ({ default: module.ProfilePage })),
)
const StudentsPage = lazy(() =>
  import('@/pages/students').then((module) => ({ default: module.StudentsPage })),
)

function RouteFallback() {
  return (
    <div aria-live="polite" role="status" className="mx-auto w-full max-w-md space-y-4 px-4 pt-4">
      <div className="ui-section space-y-3 p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
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
          <Route path="/" element={<DashboardPage />} />
          <Route path="/home" element={<Navigate replace to="/" />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/leaves" element={<LeavesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
