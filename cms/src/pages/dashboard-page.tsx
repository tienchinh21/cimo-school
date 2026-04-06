import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ArrowUpRight, BookOpenText, ContactRound, FileHeart, GraduationCap, School, ShieldCheck, Users, ClipboardList, Link2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { fetchCollection, fetchCount, pingAuth } from '../services/cms-api';
import { formatDate } from '../lib/utils';

const metricConfig = [
  { key: 'users', label: 'Nhân sự', endpoint: '/so-users/count', icon: Users, href: '/users' },
  { key: 'students', label: 'Học sinh', endpoint: '/so-students/count', icon: GraduationCap, href: '/students' },
  { key: 'parents', label: 'Phụ huynh', endpoint: '/so-parents/count', icon: ContactRound, href: '/parents' },
  { key: 'classes', label: 'Lớp học', endpoint: '/so-classes/count', icon: School, href: '/classes' },
  { key: 'roles', label: 'Vai trò', endpoint: '/so-roles/count', icon: ShieldCheck, href: '/roles' },
  { key: 'blogs', label: 'Bài viết', endpoint: '/so-blogs/count', icon: BookOpenText, href: '/blogs' },
] as const;

const leaveStatusConfig = [
  { key: 'waiting', label: 'Đang chờ', variant: 'warning' as const },
  { key: 'approved', label: 'Đã duyệt', variant: 'success' as const },
  { key: 'reject', label: 'Từ chối', variant: 'danger' as const },
];

const quickActionConfig = [
  {
    key: 'students',
    label: 'Hồ sơ học sinh',
    description: 'Xem chi tiết, cập nhật thông tin và thao tác điểm danh.',
    href: '/students',
    icon: GraduationCap,
  },
  {
    key: 'classes',
    label: 'Lớp học',
    description: 'Theo dõi sĩ số, giáo viên chủ nhiệm và trạng thái điểm danh.',
    href: '/classes',
    icon: School,
  },
  {
    key: 'leaves',
    label: 'Đơn nghỉ phép',
    description: 'Duyệt nhanh các đơn nghỉ của học sinh theo trạng thái.',
    href: '/student-leaves',
    icon: ClipboardList,
  },
  {
    key: 'links',
    label: 'Liên kết PH-HS',
    description: 'Gán phụ huynh quản lý học sinh theo từng ngữ cảnh.',
    href: '/links',
    icon: Link2,
  },
  {
    key: 'blogs',
    label: 'Nội dung bài viết',
    description: 'Quản lý tin tức và truyền thông trong hệ thống CMS.',
    href: '/blogs',
    icon: BookOpenText,
  },
  {
    key: 'wishes',
    label: 'Lời chúc',
    description: 'Xem và xử lý nhanh các lời chúc mới gửi về hệ thống.',
    href: '/wishes',
    icon: FileHeart,
  },
] as const;

const toText = (value: unknown, fallback = '-') => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return fallback;
};

export function DashboardPage() {
  const metricQueries = useQueries({
    queries: metricConfig.map((item) => ({
      queryKey: ['dashboard', item.key],
      queryFn: () => fetchCount(item.endpoint),
    })),
  });

  const leaveStatusQueries = useQueries({
    queries: leaveStatusConfig.map((item) => ({
      queryKey: ['dashboard', 'leave-status', item.key],
      queryFn: () => fetchCount('/so-student-leaves/count', { leaveStatus: item.key }),
    })),
  });

  const pendingLeavesQuery = useQuery({
    queryKey: ['dashboard', 'pending-leaves'],
    queryFn: () =>
      fetchCollection('/so-student-leaves', {
        limit: 5,
        includeRelations: ['soStudent', 'soParent'],
        where: { leaveStatus: 'waiting' },
      }),
  });

  const latestBlogsQuery = useQuery({
    queryKey: ['dashboard', 'latest-blogs'],
    queryFn: () => fetchCollection('/so-blogs', { limit: 5 }),
  });

  const latestStudentsQuery = useQuery({
    queryKey: ['dashboard', 'latest-students'],
    queryFn: () => fetchCollection('/so-students', { limit: 5, includeRelations: ['soClass'], order: ['updatedDate DESC'] }),
  });

  const latestClassesQuery = useQuery({
    queryKey: ['dashboard', 'latest-classes'],
    queryFn: () => fetchCollection('/so-classes', { limit: 5, order: ['updatedDate DESC'] }),
  });

  const wishesQuery = useQuery({
    queryKey: ['dashboard', 'wishes'],
    queryFn: () => fetchCollection('/do-wishes', { limit: 5 }),
  });

  const pingQuery = useQuery({
    queryKey: ['dashboard', 'ping'],
    queryFn: pingAuth,
    refetchInterval: 30_000,
  });

  const summary = useMemo(
    () =>
      metricConfig.map((item, index) => ({
        ...item,
        value: metricQueries[index].data ?? 0,
      })),
    [metricQueries]
  );

  const leaveSummary = useMemo(
    () =>
      leaveStatusConfig.map((item, index) => ({
        ...item,
        value: leaveStatusQueries[index].data ?? 0,
      })),
    [leaveStatusQueries]
  );

  return (
    <div className='space-y-6'>
      <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {quickActionConfig.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.key} className='overflow-hidden'>
              <CardContent className='flex h-full flex-col gap-3 p-4'>
                <div className='flex items-start gap-3'>
                  <div className='rounded-xl bg-primary/15 p-2 text-primary'>
                    <Icon className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='font-semibold'>{item.label}</p>
                    <p className='mt-1 text-sm text-muted-foreground'>{item.description}</p>
                  </div>
                </div>
                <Button asChild size='sm' variant='secondary' className='mt-auto justify-between'>
                  <Link to={item.href}>
                    Mở nhanh
                    <ArrowUpRight className='h-4 w-4' />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.key} to={item.href} className='group'>
              <Card className='overflow-hidden transition group-hover:-translate-y-0.5 group-hover:shadow-lg'>
                <CardContent className='relative p-5'>
                  <div className='pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10' />
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='text-sm font-medium text-muted-foreground'>{item.label}</p>
                      <p className='mt-2 font-display text-3xl font-bold'>{item.value}</p>
                    </div>
                    <div className='rounded-xl bg-primary/15 p-2 text-primary'>
                      <Icon className='h-5 w-5' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <div className='flex items-center justify-between gap-2'>
              <CardTitle className='flex items-center gap-2'>
                Trạng thái hệ thống
                <Badge variant={pingQuery.data ? 'success' : 'danger'}>{pingQuery.data ? 'Token hợp lệ' : 'Mất phiên'}</Badge>
              </CardTitle>
              <Button asChild size='sm' variant='secondary'>
                <Link to='/student-leaves'>Đi tới đơn nghỉ</Link>
              </Button>
            </div>
            <CardDescription>Thống kê xử lý đơn xin nghỉ học theo trạng thái</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-3 sm:grid-cols-3'>
              {leaveSummary.map((item) => (
                <div key={item.key} className='rounded-xl border border-border/70 bg-muted/30 p-4'>
                  <p className='text-sm font-medium text-muted-foreground'>{item.label}</p>
                  <div className='mt-2 flex items-center gap-2'>
                    <p className='font-display text-3xl font-bold'>{item.value}</p>
                    <Badge variant={item.variant}>{item.label}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center justify-between gap-2'>
              <CardTitle className='flex items-center gap-2'>
                <ClipboardList className='h-5 w-5 text-primary' />
                Đơn chờ duyệt
              </CardTitle>
              <Button asChild size='sm' variant='ghost'>
                <Link to='/student-leaves'>Xem tất cả</Link>
              </Button>
            </div>
            <CardDescription>5 đơn mới nhất cần xử lý</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {pendingLeavesQuery.data && pendingLeavesQuery.data.length > 0 ? (
              pendingLeavesQuery.data.map((item) => {
                const student =
                  item.soStudent && typeof item.soStudent === 'object'
                    ? (item.soStudent as Record<string, unknown>)
                    : null;
                const parent =
                  item.soParent && typeof item.soParent === 'object'
                    ? (item.soParent as Record<string, unknown>)
                    : null;
                const studentId = toText((student?.id ?? item.soStudentId) as unknown, '');

                return (
                  <div key={item.id} className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                    <p className='font-medium'>{toText(student?.name, 'Không rõ học sinh')}</p>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {formatDate(item.leaveStartDate)} - {formatDate(item.leaveEndDate)}
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>Phụ huynh: {toText(parent?.name, 'Chưa rõ')}</p>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {studentId ? (
                        <Button asChild size='sm' variant='secondary'>
                          <Link to={`/students/${studentId}`}>Chi tiết học sinh</Link>
                        </Button>
                      ) : null}
                      <Button asChild size='sm' variant='ghost'>
                        <Link to='/student-leaves'>Xử lý đơn</Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className='text-sm text-muted-foreground'>Không có đơn chờ duyệt.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between gap-2'>
              <CardTitle>Học sinh cập nhật gần đây</CardTitle>
              <Button asChild size='sm' variant='secondary'>
                <Link to='/students'>Xem danh sách</Link>
              </Button>
            </div>
            <CardDescription>Điểm chạm nhanh vào hồ sơ chi tiết học sinh</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {latestStudentsQuery.data && latestStudentsQuery.data.length > 0 ? (
              latestStudentsQuery.data.map((item) => {
                const className =
                  item.soClass && typeof item.soClass === 'object' && 'name' in item.soClass
                    ? toText((item.soClass as Record<string, unknown>).name, 'Chưa phân lớp')
                    : 'Chưa phân lớp';

                return (
                  <div key={item.id} className='flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/30 p-3'>
                    <div>
                      <p className='font-medium'>{toText(item.name, 'Không rõ tên')}</p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {className} - Cập nhật: {formatDate(item.updatedDate ?? item.createdDate)}
                      </p>
                    </div>
                    <Button asChild size='sm' variant='secondary'>
                      <Link to={`/students/${String(item.id)}`}>Mở chi tiết</Link>
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className='text-sm text-muted-foreground'>Chưa có dữ liệu học sinh gần đây.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center justify-between gap-2'>
              <CardTitle>Lớp học cập nhật gần đây</CardTitle>
              <Button asChild size='sm' variant='secondary'>
                <Link to='/classes'>Xem danh sách</Link>
              </Button>
            </div>
            <CardDescription>Điểm chạm nhanh vào trang chi tiết lớp học</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {latestClassesQuery.data && latestClassesQuery.data.length > 0 ? (
              latestClassesQuery.data.map((item) => (
                <div key={item.id} className='flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/30 p-3'>
                  <div>
                    <p className='font-medium'>{toText(item.name, 'Không rõ tên lớp')}</p>
                    <p className='mt-1 text-xs text-muted-foreground'>Cập nhật: {formatDate(item.updatedDate ?? item.createdDate)}</p>
                  </div>
                  <Button asChild size='sm' variant='secondary'>
                    <Link to={`/classes/${String(item.id)}`}>Mở chi tiết</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className='text-sm text-muted-foreground'>Chưa có dữ liệu lớp học gần đây.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between gap-2'>
              <CardTitle>Bài viết gần đây</CardTitle>
              <Button asChild size='sm' variant='ghost'>
                <Link to='/blogs'>Xem tất cả</Link>
              </Button>
            </div>
            <CardDescription>5 bài viết mới nhất trên hệ thống</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {latestBlogsQuery.data && latestBlogsQuery.data.length > 0 ? (
              latestBlogsQuery.data.map((item) => (
                <div key={item.id} className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                  <p className='font-medium'>{String(item.name ?? 'Không tiêu đề')}</p>
                  <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>{String(item.sumary ?? '')}</p>
                  <p className='mt-2 text-xs text-muted-foreground'>{formatDate(item.createdDate)}</p>
                </div>
              ))
            ) : (
              <p className='text-sm text-muted-foreground'>Chưa có bài viết.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center justify-between gap-2'>
              <CardTitle className='flex items-center gap-2'>
                <FileHeart className='h-5 w-5 text-primary' />
                Lời chúc mới
              </CardTitle>
              <Button asChild size='sm' variant='ghost'>
                <Link to='/wishes'>Xem tất cả</Link>
              </Button>
            </div>
            <CardDescription>5 lời chúc gần nhất từ endpoint `/do-wishes`</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {wishesQuery.data && wishesQuery.data.length > 0 ? (
              wishesQuery.data.map((item) => (
                <div key={item.id} className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                  <p className='font-medium'>{String(item.name ?? '-')}</p>
                  <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>{String(item.content ?? '-')}</p>
                  <p className='mt-2 text-xs text-muted-foreground'>{formatDate(item.createdDate)}</p>
                </div>
              ))
            ) : (
              <p className='text-sm text-muted-foreground'>Chưa có lời chúc.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
