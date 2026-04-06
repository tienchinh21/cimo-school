import { useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/app-shell';
import { Badge } from './components/ui/badge';
import { fetchMe } from './services/cms-api';
import { useAuthStore } from './store/auth-store';
import { DashboardPage } from './pages/dashboard-page';
import { LoginPage } from './pages/login-page';
import { ResourcePage } from './pages/resource-page';
import { StudentParentLinkPage } from './pages/student-parent-link-page';
import { WishesPage } from './pages/wishes-page';
import { StudentDetailPage } from './pages/student-detail-page';
import { ClassDetailPage } from './pages/class-detail-page';
import { getDefaultRouteForProfile, isTeacherAllowedPath, isTeacherProfile } from './lib/access-control';
import { TeacherOverviewPage } from './pages/teacher-overview-page';

function LoadingScreen() {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <Badge variant='secondary'>Đang tải hồ sơ đăng nhập...</Badge>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to='/login' replace />;
  }
  return <>{children}</>;
}

function AuthBootstrap({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const meQuery = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: fetchMe,
    enabled: Boolean(token) && !profile,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setProfile(meQuery.data);
    }
  }, [meQuery.data, setProfile]);

  useEffect(() => {
    if (meQuery.error) {
      clearAuth();
    }
  }, [clearAuth, meQuery.error]);

  if (token && !profile && meQuery.isPending) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

function RoleScopedShell() {
  const profile = useAuthStore((state) => state.profile);
  const location = useLocation();
  const defaultRoute = getDefaultRouteForProfile(profile);

  if (isTeacherProfile(profile) && !isTeacherAllowedPath(location.pathname)) {
    return <Navigate to={defaultRoute} replace />;
  }

  return <AppShell />;
}

function App() {
  const token = useAuthStore((state) => state.token);
  const profile = useAuthStore((state) => state.profile);
  const defaultRoute = getDefaultRouteForProfile(profile);
  const isTeacher = isTeacherProfile(profile);

  return (
    <AuthBootstrap>
      <Routes>
        <Route path='/login' element={token ? <Navigate to={defaultRoute} replace /> : <LoginPage />} />

        <Route
          element={
            <RequireAuth>
              <RoleScopedShell />
            </RequireAuth>
          }
        >
          <Route path='/' element={isTeacher ? <TeacherOverviewPage /> : <DashboardPage />} />
          <Route path='/users' element={<ResourcePage resourceKey='users' />} />
          <Route path='/roles' element={<ResourcePage resourceKey='roles' />} />
          <Route path='/classes' element={<ResourcePage resourceKey='classes' />} />
          <Route path='/classes/:id' element={<ClassDetailPage />} />
          <Route path='/students' element={<ResourcePage resourceKey='students' />} />
          <Route path='/students/:id' element={<StudentDetailPage />} />
          <Route path='/parents' element={<ResourcePage resourceKey='parents' />} />
          <Route path='/student-leaves' element={<ResourcePage resourceKey='student-leaves' />} />
          <Route path='/blogs' element={<ResourcePage resourceKey='blogs' />} />
          <Route path='/landing/page-seo' element={<ResourcePage resourceKey='landing-page-seo' />} />
          <Route path='/landing/courses' element={<ResourcePage resourceKey='landing-courses' />} />
          <Route path='/landing/testimonials' element={<ResourcePage resourceKey='landing-testimonials' />} />
          <Route path='/landing/trial-sessions' element={<ResourcePage resourceKey='landing-trial-sessions' />} />
          <Route path='/landing/social-metrics' element={<ResourcePage resourceKey='landing-social-metrics' />} />
          <Route path='/landing/method-steps' element={<ResourcePage resourceKey='landing-method-steps' />} />
          <Route path='/landing/team-milestones' element={<ResourcePage resourceKey='landing-team-milestones' />} />
          <Route path='/landing/about-metrics' element={<ResourcePage resourceKey='landing-about-metrics' />} />
          <Route path='/landing/about-pillars' element={<ResourcePage resourceKey='landing-about-pillars' />} />
          <Route path='/landing/recruitment-tracks' element={<ResourcePage resourceKey='landing-recruitment-tracks' />} />
          <Route path='/landing/blogs' element={<ResourcePage resourceKey='landing-blogs' />} />
          <Route path='/landing/assets' element={<ResourcePage resourceKey='landing-assets' />} />
          <Route path='/landing/registration-leads' element={<ResourcePage resourceKey='landing-registration-leads' />} />
          <Route path='/landing/contact-leads' element={<ResourcePage resourceKey='landing-contact-leads' />} />
          <Route path='/landing/recruitment-leads' element={<ResourcePage resourceKey='landing-recruitment-leads' />} />
          <Route path='/links' element={<StudentParentLinkPage />} />
          <Route path='/wishes' element={<WishesPage />} />
        </Route>

        <Route path='*' element={<Navigate to={token ? defaultRoute : '/login'} replace />} />
      </Routes>
    </AuthBootstrap>
  );
}

export default App;
