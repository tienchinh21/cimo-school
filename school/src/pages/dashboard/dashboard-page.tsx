import { useQuery } from '@tanstack/react-query'
import {
  IconAlertCircle,
  IconArrowRight,
  IconBook2,
  IconCalendarClock,
  IconCalendarCheck,
  IconClock,
  IconLogout2,
  IconNews,
  IconSchool,
  IconSpeakerphone,
  IconUserCircle,
  IconUsers,
} from '@tabler/icons-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { ClassSelector } from '@/app/components/class-selector'
import { useAuthActions, useAuthUser } from '@/app/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTeacherClasses } from '@/app/hooks/use-teacher-classes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toApiAssetUrl } from '@/shared/api/env'
import { queryKeys } from '@/shared/api/query-keys'
import { getClassBlogs, getClassCheckins, getClassStudentLeaves, getClassStudents } from '@/shared/api/teacher'
import { formatDate, formatDateTime, toDateInputValue, usePageSeo } from '@/shared/lib'

const quickTouches = [
  {
    icon: IconCalendarCheck,
    label: 'Điểm danh nhanh',
    to: '/attendance',
    toneClassName: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  },
  {
    icon: IconAlertCircle,
    label: 'Duyệt đơn chờ',
    to: '/leaves?mode=review&status=waiting',
    toneClassName: 'border-amber-200 bg-amber-100 text-amber-700',
  },
  {
    icon: IconClock,
    label: 'Tạo đơn giúp',
    to: '/leaves?mode=create',
    toneClassName: 'border-orange-200 bg-orange-100 text-orange-700',
  },
  {
    icon: IconSpeakerphone,
    label: 'Đăng bản tin',
    to: '/news',
    toneClassName: 'border-violet-200 bg-violet-100 text-violet-700',
  },
  {
    icon: IconUsers,
    label: 'Cập nhật học sinh',
    to: '/students',
    toneClassName: 'border-sky-200 bg-sky-100 text-sky-700',
  },
  {
    icon: IconSchool,
    label: 'Quản lý lớp',
    to: '/classes',
    toneClassName: 'border-blue-200 bg-blue-100 text-blue-700',
  },
  {
    icon: IconUserCircle,
    label: 'Quản lý Profile',
    to: '/profile',
    toneClassName: 'border-indigo-200 bg-indigo-100 text-indigo-700',
  },
]

function getInitials(name?: string | null) {
  const value = name?.trim()
  if (!value) {
    return 'GV'
  }

  const parts = value.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return `${first}${last}`.toUpperCase()
}

export function DashboardPage() {
  usePageSeo({
    title: 'Bảng điều hành giáo viên',
    description:
      'Theo dõi tổng quan lớp học, điểm danh, đơn nghỉ và bản tin ngay trên bảng điều hành giáo viên Cimo School.',
    keywords: ['cimo school', 'teacher app', 'tong quan giao vien', 'quan ly lop hoc'],
  })

  const user = useAuthUser()
  const { logout } = useAuthActions()
  const { activeClass, activeClassId, classes, classesQuery, setActiveClassId } = useTeacherClasses()

  const today = toDateInputValue(new Date())

  const studentsQuery = useQuery({
    enabled: Boolean(activeClassId),
    queryFn: () => getClassStudents(activeClassId),
    queryKey: queryKeys.teacher.students(activeClassId),
  })

  const checkinsQuery = useQuery({
    enabled: Boolean(activeClassId),
    queryFn: () => getClassCheckins(activeClassId, today),
    queryKey: queryKeys.teacher.checkins(activeClassId, today),
  })

  const waitingLeavesQuery = useQuery({
    enabled: Boolean(activeClassId),
    queryFn: () => getClassStudentLeaves(activeClassId, { status: 'waiting' }),
    queryKey: queryKeys.teacher.leaves(activeClassId, 'waiting'),
  })

  const blogsQuery = useQuery({
    enabled: Boolean(activeClassId),
    queryFn: () => getClassBlogs(activeClassId),
    queryKey: queryKeys.teacher.blogs(activeClassId),
  })

  const totalStudents = useMemo(
    () => classes.reduce((total, item) => total + item.studentCount, 0),
    [classes],
  )

  const studentsInActiveClass = studentsQuery.data?.length ?? activeClass?.studentCount ?? 0

  const attendanceStats = useMemo(() => {
    const rows = checkinsQuery.data ?? []
    const checkedIn = rows.filter((item) => Boolean(item.checkin)).length
    const checkedOut = rows.filter((item) => Boolean(item.checkout)).length

    return {
      checkedIn,
      checkedOut,
      total: rows.length,
    }
  }, [checkinsQuery.data])

  const attendanceRate =
    attendanceStats.total > 0 ? Math.round((attendanceStats.checkedIn / attendanceStats.total) * 100) : 0

  const attendanceTone =
    attendanceStats.total === 0
      ? {
          barClassName: 'bg-slate-300',
          chipClassName: 'bg-slate-100 text-slate-700 border border-slate-200',
          label: 'Chưa có dữ liệu',
        }
      : attendanceRate >= 95
        ? {
            barClassName: 'bg-emerald-500',
            chipClassName: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            label: 'Ổn định',
          }
        : attendanceRate >= 80
          ? {
              barClassName: 'bg-amber-500',
              chipClassName: 'bg-amber-100 text-amber-700 border border-amber-200',
              label: 'Cần theo dõi',
            }
          : {
              barClassName: 'bg-rose-500',
              chipClassName: 'bg-rose-100 text-rose-700 border border-rose-200',
              label: 'Cần ưu tiên',
            }

  const waitingLeaves = (waitingLeavesQuery.data ?? []).slice(0, 2)
  const latestBlog = (blogsQuery.data ?? [])[0] ?? null

  const greeting = user?.name ? `Chào mừng, ${user.name}` : 'Chào mừng giáo viên'
  const avatarUrl = toApiAssetUrl(user?.avt)
  const userHandle = user?.username ? `@${user.username}` : 'Giáo viên chủ nhiệm'

  return (
    <section className="page-shell mx-auto w-full max-w-md space-y-4">
      <div className="ui-section space-y-4 p-4">
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-11 border border-white/60 shadow-sm">
              <AvatarImage src={avatarUrl} alt={user?.name || 'Giáo viên'} />
              <AvatarFallback className="bg-indigo-100 text-sm font-bold text-indigo-700">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name || 'Giáo viên'}</p>
              <p className="truncate text-xs text-muted-foreground">{userHandle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild type="button" variant="secondary" size="icon" className="size-9 rounded-full">
              <Link to="/profile" aria-label="Mở hồ sơ giáo viên">
                <IconUserCircle className="size-4.5" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="size-9 rounded-full"
              onClick={logout}
              aria-label="Đăng xuất"
            >
              <IconLogout2 className="size-4.5" />
            </Button>
          </div>
        </header>

        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-blue-700 to-cyan-500 p-4 text-white">
          <span className="absolute -right-8 -top-8 size-24 rounded-full bg-white/10" />
          <span className="absolute -bottom-8 -left-8 size-20 rounded-full bg-white/10" />
          <div className="relative space-y-3">
            <div className="space-y-1">
              <p className="text-lg font-bold">{greeting}</p>
              <p className="text-sm text-white/85">
                {activeClass ? `${activeClass.name} đang là lớp mặc định thao tác` : 'Vui lòng chọn lớp để bắt đầu'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/80">Lớp phụ trách</p>
                <p className="text-base font-bold">{classes.length}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/80">Sĩ số lớp chọn</p>
                <p className="text-base font-bold">{studentsInActiveClass}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/80">Đơn chờ duyệt</p>
                <p className="text-base font-bold">{waitingLeavesQuery.data?.length ?? 0}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                <IconCalendarCheck className="size-3.5" />
                Check-in: {attendanceStats.checkedIn}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                <IconCalendarClock className="size-3.5" />
                Check-out: {attendanceStats.checkedOut}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                <IconBook2 className="size-3.5" />
                Tổng học sinh: {totalStudents}
              </span>
            </div>
          </div>
        </div>

        {classesQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-9 w-full rounded-full" />
            <Skeleton className="h-9 w-full rounded-full" />
          </div>
        ) : null}

        <ClassSelector
          activeClassId={activeClassId}
          classes={classes}
          isLoading={classesQuery.isLoading}
          onChange={setActiveClassId}
        />

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Truy cập nhanh</p>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {quickTouches.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${item.toneClassName}`}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <section className="ui-section space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold">Trọng tâm xử lý</h2>
          <Badge variant="secondary">{formatDate(new Date().toISOString())}</Badge>
        </div>

        <div className="space-y-3">
          <article className="ui-subtle-panel space-y-3 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Tình trạng điểm danh lớp hiện tại</p>
                <p className="text-xs text-muted-foreground">
                  {activeClass ? activeClass.name : 'Chưa chọn lớp'} • {attendanceStats.checkedIn}/{attendanceStats.total || studentsInActiveClass} đã check-in
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${attendanceTone.chipClassName}`}>
                {attendanceTone.label}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${attendanceTone.barClassName}`}
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                <IconCalendarCheck className="size-3.5" />
                Check-in: {attendanceStats.checkedIn}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 font-medium text-blue-700">
                <IconCalendarClock className="size-3.5" />
                Check-out: {attendanceStats.checkedOut}
              </span>
            </div>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to="/attendance">
                Cập nhật điểm danh ngay
                <IconArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </article>

          <article className="ui-subtle-panel p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Đơn nghỉ cần xử lý</p>
                <p className="text-xs text-muted-foreground">Ưu tiên duyệt đúng hạn trong ngày</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <IconAlertCircle className="size-3.5" />
                {waitingLeavesQuery.data?.length ?? 0} đơn chờ
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/leaves?mode=create">Tạo đơn giúp</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link to="/leaves?mode=review&status=waiting">Duyệt đơn chờ</Link>
              </Button>
            </div>
          </article>

          <article className="ui-subtle-panel p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Cập nhật truyền thông lớp</p>
                <p className="text-xs text-muted-foreground">
                  {latestBlog
                    ? `Tin mới: ${formatDateTime(latestBlog.createdDate ?? null)}`
                    : 'Chưa có bản tin mới trong lớp hiện tại'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                <IconSpeakerphone className="size-3.5" />
                {(blogsQuery.data ?? []).length} bản tin
              </span>
            </div>
            <Button asChild size="sm" variant="outline" className="mt-3 w-full">
              <Link to="/news">
                Đăng thông báo mới
                <IconArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </article>
        </div>
      </section>

      <section className="ui-section space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold">Mục cần xử lý ngay</h2>
          <Button asChild variant="secondary" size="sm">
            <Link to="/leaves">Xem tất cả</Link>
          </Button>
        </div>

        {waitingLeavesQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : waitingLeaves.length === 0 ? (
          <p className="ui-subtle-panel p-3 text-sm text-muted-foreground">
            Hiện tại chưa có đơn nghỉ chờ duyệt.
          </p>
        ) : (
          waitingLeaves.map((item) => (
            <div key={item.id} className="ui-subtle-panel p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.soStudent?.name ?? 'Học sinh'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(item.leaveStartDate)} - {formatDate(item.leaveEndDate)}
                  </p>
                </div>
                <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  Chờ duyệt
                </span>
              </div>
              <p className="mt-2 line-clamp-2">{item.reason || 'Không có mô tả lý do.'}</p>
              <Button asChild size="sm" variant="secondary" className="mt-3 w-full">
                <Link to="/leaves?mode=review&status=waiting">Mở duyệt nhanh</Link>
              </Button>
            </div>
          ))
        )}
      </section>

      {latestBlog || blogsQuery.isLoading ? (
        <section className="ui-section space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">Bản tin gần nhất</h2>
            <Button asChild variant="secondary" size="sm">
              <Link to="/news">Mở bản tin</Link>
            </Button>
          </div>

          {blogsQuery.isLoading ? (
            <article className="ui-subtle-panel space-y-2 p-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-6 w-36 rounded-full" />
            </article>
          ) : latestBlog ? (
            <article className="ui-subtle-panel space-y-2 p-3">
              <p className="font-semibold">{latestBlog.name}</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">{latestBlog.sumary}</p>
              <div className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                <IconNews className="size-3.5" />
                Cập nhật: {formatDateTime(latestBlog.createdDate ?? null)}
              </div>
            </article>
          ) : null}
        </section>
      ) : null}

      {studentsQuery.isError || checkinsQuery.isError || waitingLeavesQuery.isError || blogsQuery.isError ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <IconAlertCircle className="size-4" />
          <p>Một số dữ liệu chưa tải được. Vui lòng thử tải lại sau ít phút.</p>
        </div>
      ) : null}
    </section>
  )
}
