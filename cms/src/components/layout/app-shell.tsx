import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookMarked,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  FileHeart,
  FileSearch,
  FileText,
  Globe,
  GraduationCap,
  House,
  IdCard,
  ImagePlus,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Menu,
  Milestone,
  Newspaper,
  Route,
  SendHorizontal,
  Shield,
  type LucideIcon,
  Users,
  X,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth-store';
import { pingAuth } from '../../services/cms-api';
import { useConfirmDialog } from '../ui/confirm-dialog-provider';
import { isTeacherProfile } from '../../lib/access-control';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const mainNavItems: NavItem[] = [
  { to: '/', label: 'Tổng quan', icon: LayoutGrid },
  { to: '/users', label: 'Nhân sự', icon: Users },
  { to: '/roles', label: 'Vai trò', icon: Shield },
  { to: '/classes', label: 'Lớp học', icon: House },
  { to: '/students', label: 'Học sinh', icon: GraduationCap },
  { to: '/parents', label: 'Phụ huynh', icon: IdCard },
  { to: '/student-leaves', label: 'Xin nghỉ học', icon: ClipboardList },
  { to: '/blogs', label: 'Bài viết', icon: Newspaper },
];

const landingNavItems: NavItem[] = [
  { to: '/landing/page-seo', label: 'SEO trang', icon: Globe },
  { to: '/landing/courses', label: 'Khóa học', icon: GraduationCap },
  { to: '/landing/testimonials', label: 'Cảm nhận phụ huynh', icon: MessageSquare },
  { to: '/landing/trial-sessions', label: 'Buổi học thử', icon: CalendarClock },
  { to: '/landing/social-metrics', label: 'Chỉ số mạng xã hội', icon: BarChart3 },
  { to: '/landing/method-steps', label: 'Các bước phương pháp', icon: Route },
  { to: '/landing/team-milestones', label: 'Cột mốc đội ngũ', icon: Milestone },
  { to: '/landing/about-metrics', label: 'Chỉ số giới thiệu', icon: BarChart3 },
  { to: '/landing/about-pillars', label: 'Trụ cột giới thiệu', icon: FileText },
  { to: '/landing/recruitment-tracks', label: 'Lộ trình tuyển sinh', icon: FileSearch },
  { to: '/landing/blogs', label: 'Bài viết landing', icon: Newspaper },
  { to: '/landing/assets', label: 'Tệp và hình ảnh', icon: ImagePlus },
  { to: '/landing/registration-leads', label: 'Lead đăng ký', icon: SendHorizontal },
  { to: '/landing/contact-leads', label: 'Lead liên hệ', icon: SendHorizontal },
  { to: '/landing/recruitment-leads', label: 'Lead tuyển sinh', icon: SendHorizontal },
];

const utilityNavItems: NavItem[] = [
  { to: '/links', label: 'Liên kết PH-HS', icon: BookMarked },
  { to: '/wishes', label: 'Lời chúc', icon: FileHeart },
];

const teacherNavItems: NavItem[] = [
  { to: '/', label: 'Tổng quan', icon: LayoutGrid },
  { to: '/classes', label: 'Lớp học', icon: House },
  { to: '/students', label: 'Học sinh', icon: GraduationCap },
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const profile = useAuthStore((state) => state.profile);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const confirmDialog = useConfirmDialog();
  const [landingMenuOpen, setLandingMenuOpen] = useState(() => location.pathname.startsWith('/landing'));
  const pingQuery = useQuery({
    queryKey: ['shell', 'ping'],
    queryFn: pingAuth,
    refetchInterval: 30_000,
  });
  const isLandingRoute = location.pathname.startsWith('/landing');
  const isTeacher = useMemo(() => isTeacherProfile(profile), [profile]);
  const visibleMainNavItems = isTeacher ? teacherNavItems : mainNavItems;
  const visibleUtilityNavItems = isTeacher ? [] : utilityNavItems;

  const roleText = useMemo(() => {
    const roles = profile?.soRoles;
    if (!Array.isArray(roles) || roles.length === 0) {
      return 'Quản trị viên';
    }

    return roles
      .map((role) => role.name)
      .filter(Boolean)
      .join(', ');
  }, [profile?.soRoles]);

  return (
    <div className='relative min-h-screen'>
      <div className='pointer-events-none fixed inset-0 -z-10'>
        <div className='absolute -left-24 top-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl' />
        <div className='absolute -right-24 top-40 h-80 w-80 rounded-full bg-accent/15 blur-3xl' />
      </div>

      <div className='mx-auto flex min-h-screen w-full max-w-[1700px]'>
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-72 border-r border-border/80 bg-card/95 p-5 shadow-xl backdrop-blur transition-transform duration-200 md:static md:translate-x-0 md:shadow-none',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-mono text-xs uppercase tracking-[0.24em] text-primary'>Cimo</p>
              <h1 className='font-display text-2xl font-bold'>CMS Panel</h1>
            </div>
            <Button className='md:hidden' size='icon' variant='ghost' onClick={() => setOpen(false)}>
              <X className='h-5 w-5' />
            </Button>
          </div>

          <div className='mt-6 rounded-2xl border border-border/70 bg-muted/60 p-4'>
            <p className='text-sm font-semibold'>{profile?.name ?? 'Quản trị viên'}</p>
            <p className='mt-1 text-xs text-muted-foreground'>{profile?.username}</p>
            <Badge className='mt-3 w-fit' variant='secondary'>
              {roleText}
            </Badge>
          </div>

          <nav className='mt-6 flex flex-col gap-1.5'>
            {visibleMainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                      isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' : 'hover:bg-muted'
                    )
                  }
                >
                  <Icon className='h-4 w-4' />
                  {item.label}
                </NavLink>
              );
            })}

            {isTeacher ? null : (
              <div className='mt-1'>
                <button
                  type='button'
                  onClick={() => setLandingMenuOpen((previous) => !previous)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isLandingRoute ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  )}
                >
                  <span className='flex items-center gap-3'>
                    <Globe className='h-4 w-4' />
                    Trang Landing
                  </span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform', landingMenuOpen ? 'rotate-180' : '')} />
                </button>

                {landingMenuOpen ? (
                  <div className='ml-4 mt-1 flex flex-col gap-1 border-l border-border/70 pl-2'>
                    {landingNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                              isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' : 'hover:bg-muted'
                            )
                          }
                        >
                          <Icon className='h-4 w-4' />
                          {item.label}
                        </NavLink>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}

            {visibleUtilityNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                      isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' : 'hover:bg-muted'
                    )
                  }
                >
                  <Icon className='h-4 w-4' />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <Button
            variant='secondary'
            className='mt-6 w-full justify-start'
            onClick={async () => {
              const confirmed = await confirmDialog({
                title: 'Đăng xuất',
                description: 'Bạn muốn đăng xuất khỏi CMS?',
                confirmText: 'Đăng xuất',
              });
              if (!confirmed) return;
              clearAuth();
            }}
          >
            <LogOut className='h-4 w-4' />
            Đăng xuất
          </Button>
        </aside>

        {open ? <div className='fixed inset-0 z-30 bg-black/30 md:hidden' onClick={() => setOpen(false)} /> : null}

        <div className='flex min-w-0 flex-1 flex-col'>
          <header className='sticky top-0 z-20 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur md:px-8'>
            <div className='flex items-center justify-between gap-3'>
              <Button size='icon' variant='secondary' className='md:hidden' onClick={() => setOpen(true)}>
                <Menu className='h-5 w-5' />
              </Button>

              <div>
                <h2 className='font-display text-lg font-semibold'>Quản trị Cimo School</h2>
                <p className='text-xs text-muted-foreground'>Endpoint: https://api.cimoschool.xyz</p>
              </div>

              <Badge variant={pingQuery.data ? 'success' : 'danger'}>{pingQuery.data ? 'Online' : 'Mất phiên'}</Badge>
            </div>
          </header>

          <main className='flex-1 p-4 md:p-8'>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
