import {
  IconAlertCircle,
  IconArrowRight,
  IconCalendarCheck,
  IconClipboardList,
  IconNews,
  IconSchool,
  IconUsers,
} from '@tabler/icons-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { PageTitleHeader } from '@/app/components/page-title-header'
import { useTeacherClasses } from '@/app/hooks/use-teacher-classes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatDate, formatDateTime, usePageSeo } from '@/shared/lib'

const quickTouches = [
  {
    icon: IconCalendarCheck,
    label: 'Điểm danh',
    to: '/attendance',
    toneClassName: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  },
  {
    icon: IconUsers,
    label: 'Học sinh',
    to: '/students',
    toneClassName: 'border-sky-200 bg-sky-100 text-sky-700',
  },
  {
    icon: IconNews,
    label: 'Tin tức lớp',
    to: '/news',
    toneClassName: 'border-violet-200 bg-violet-100 text-violet-700',
  },
  {
    icon: IconClipboardList,
    label: 'Duyệt đơn nghỉ',
    to: '/leaves?mode=review&status=waiting',
    toneClassName: 'border-amber-200 bg-amber-100 text-amber-700',
  },
]

const vndCurrencyFormatter = new Intl.NumberFormat('vi-VN', {
  currency: 'VND',
  maximumFractionDigits: 0,
  style: 'currency',
})

function formatClassDateRange(fromDate?: string | null, toDate?: string | null) {
  if (fromDate && toDate) {
    return `${formatDate(fromDate)} - ${formatDate(toDate)}`
  }

  if (fromDate) {
    return `Từ ${formatDate(fromDate)}`
  }

  if (toDate) {
    return `Đến ${formatDate(toDate)}`
  }

  return 'Chưa cập nhật thời gian lớp'
}

function formatCostPerSession(costPerSession?: number | null) {
  if (typeof costPerSession !== 'number' || Number.isNaN(costPerSession) || costPerSession <= 0) {
    return 'Chưa cập nhật'
  }

  return vndCurrencyFormatter.format(costPerSession)
}

export function ClassesPage() {
  usePageSeo({
    title: 'Tổng quan lớp học',
    description:
      'Xem danh sách lớp phụ trách, sĩ số từng lớp và truy cập nhanh các nghiệp vụ theo lớp học.',
    keywords: ['lop hoc', 'si so', 'quan ly lop', 'teacher mobile'],
  })

  const { activeClassId, classes, classesQuery, setActiveClassId } = useTeacherClasses()
  const totalStudents = useMemo(() => classes.reduce((total, item) => total + item.studentCount, 0), [classes])
  const maxStudentCount = useMemo(
    () => classes.reduce((max, item) => Math.max(max, item.studentCount), 0),
    [classes],
  )
  const activeClass = classes.find((item) => item.id === activeClassId) ?? null

  return (
    <section className="page-shell mx-auto w-full max-w-md space-y-4">
      <div className="ui-section space-y-4 p-4">
        <PageTitleHeader title="Lớp học phụ trách" subtitle="Quản lý lớp giảng dạy và truy cập nhanh nghiệp vụ lớp" />

        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-blue-700 to-cyan-500 p-4 text-white">
          <span className="absolute -right-8 -top-8 size-24 rounded-full bg-white/10" />
          <span className="absolute -bottom-8 -left-8 size-20 rounded-full bg-white/10" />
          <div className="relative space-y-3">
            <div>
              <p className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
                <IconSchool className="size-3.5" />
                Lớp đang thao tác
              </p>
              <p className="mt-1 text-lg font-bold">{activeClass?.name ?? 'Chưa chọn lớp'}</p>
              <p className="text-sm text-white/85">
                {activeClass
                  ? `Thời gian lớp: ${formatClassDateRange(activeClass.fromDate, activeClass.toDate)}`
                  : 'Vui lòng chọn lớp để xem chi tiết'}
              </p>
              {activeClass ? (
                <p className="text-xs text-white/80">
                  Học phí / buổi: {formatCostPerSession(activeClass.costPerSession)}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/80">Số lớp</p>
                <p className="text-base font-bold">{classes.length}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/80">Tổng học sinh</p>
                <p className="text-base font-bold">{totalStudents}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Truy cập nhanh</p>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {quickTouches.map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
                    item.toneClassName,
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <section className="space-y-3">
        {classesQuery.isLoading ? (
          <>
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`classes-loading-${index}`} className="ui-section space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-44" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-9 w-full rounded-xl" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </>
        ) : classes.length === 0 ? (
          <div className="ui-section p-4 text-sm text-muted-foreground">
            Tài khoản giáo viên này chưa được phân công lớp nào.
          </div>
        ) : (
          classes.map((item) => {
            const isActive = item.id === activeClassId
            const studentDensity = maxStudentCount > 0 ? Math.round((item.studentCount / maxStudentCount) * 100) : 0

            return (
              <article
                key={item.id}
                className={cn(
                  'ui-section space-y-3 p-4',
                  isActive ? 'border-primary/30 bg-primary/5' : '',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-bold">{item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cập nhật: {formatDateTime(item.updatedDate ?? item.createdDate ?? null)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Thời gian lớp: {formatClassDateRange(item.fromDate, item.toDate)}
                    </p>
                  </div>
                  {isActive ? (
                    <Badge className="bg-primary text-primary-foreground">Lớp đang thao tác</Badge>
                  ) : (
                    <Badge variant="secondary">Lớp phụ trách</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="ui-subtle-panel flex items-center gap-2 p-3">
                    <span className="rounded-full bg-sky-100 p-2 text-sky-700">
                      <IconUsers className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">Sĩ số</p>
                      <p className="font-semibold">{item.studentCount} học sinh</p>
                    </div>
                  </div>
                  <div className="ui-subtle-panel flex items-center gap-2 p-3">
                    <span className="rounded-full bg-indigo-100 p-2 text-indigo-700">
                      <IconClipboardList className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">Học phí / buổi</p>
                      <p className="line-clamp-1 font-semibold">{formatCostPerSession(item.costPerSession)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Mật độ sĩ số so với các lớp</span>
                    <span>{studentDensity}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${studentDensity}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={isActive ? 'secondary' : 'default'}
                    onClick={() => setActiveClassId(item.id)}
                  >
                    {isActive ? 'Đang chọn' : 'Chọn lớp'}
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/attendance">
                      Điểm danh
                      <IconArrowRight className="ml-1 size-3.5" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/students">
                      Học sinh
                      <IconArrowRight className="ml-1 size-3.5" />
                    </Link>
                  </Button>
                </div>
              </article>
            )
          })
        )}
      </section>

      {classesQuery.isError ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <IconAlertCircle className="size-4" />
          <p>Không thể tải dữ liệu lớp học. Vui lòng thử lại sau.</p>
        </div>
      ) : null}
    </section>
  )
}
