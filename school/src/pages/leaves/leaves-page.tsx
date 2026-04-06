import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  IconAlertCircle,
  IconArrowRight,
  IconCalendarClock,
  IconChecks,
  IconClock,
  IconFileText,
  IconX,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ClassSelector } from '@/app/components/class-selector'
import { PageTitleHeader } from '@/app/components/page-title-header'
import { useTeacherClasses } from '@/app/hooks/use-teacher-classes'
import { Badge } from '@/components/ui/badge'
import { BottomModal } from '@/components/ui/bottom-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { queryKeys } from '@/shared/api/query-keys'
import {
  approveClassStudentLeave,
  createClassStudentLeave,
  getClassStudentLeaves,
  getClassStudents,
} from '@/shared/api/teacher'
import type { LeaveStatus } from '@/shared/api/teacher.types'
import { cn, formatDate, toDateInputValue, usePageSeo } from '@/shared/lib'

const statusOptions: Array<{ label: string; value: 'all' | LeaveStatus }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ duyệt', value: 'waiting' },
  { label: 'Đã duyệt', value: 'approved' },
  { label: 'Từ chối', value: 'reject' },
]

function getLeaveTone(status: LeaveStatus) {
  if (status === 'approved') {
    return {
      badgeClassName: 'border-emerald-200 bg-emerald-100 text-emerald-700',
      label: 'Đã duyệt',
    }
  }

  if (status === 'reject') {
    return {
      badgeClassName: 'border-rose-200 bg-rose-100 text-rose-700',
      label: 'Từ chối',
    }
  }

  return {
    badgeClassName: 'border-amber-200 bg-amber-100 text-amber-700',
    label: 'Chờ duyệt',
  }
}

function resolveReviewStatus(value: string | null): 'all' | LeaveStatus {
  if (value === 'waiting' || value === 'approved' || value === 'reject') {
    return value
  }

  return 'all'
}

type LeaveApprovalPayload = {
  approvalNote?: string
  leaveId: string
  leaveStatus: 'approved' | 'reject'
}

export function LeavesPage() {
  usePageSeo({
    title: 'Đơn xin nghỉ',
    description:
      'Tạo đơn xin nghỉ giúp học sinh và duyệt đơn nghỉ theo lớp với trạng thái xử lý rõ ràng.',
    keywords: ['don xin nghi', 'duyet don nghi', 'hoc sinh', 'giao vien'],
  })

  const { activeClass, activeClassId, classes, classesQuery, setActiveClassId } = useTeacherClasses()
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = searchParams.get('mode') === 'review' ? 'review' : 'create'
  const reviewStatus = resolveReviewStatus(searchParams.get('status'))
  const [leaveStartDate, setLeaveStartDate] = useState(() => toDateInputValue(new Date()))
  const [leaveEndDate, setLeaveEndDate] = useState(() => toDateInputValue(new Date()))
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [reason, setReason] = useState('')
  const [approvalNote, setApprovalNote] = useState('')
  const [approvalModal, setApprovalModal] = useState<Pick<LeaveApprovalPayload, 'leaveId' | 'leaveStatus'> | null>(
    null,
  )
  const queryClient = useQueryClient()

  const updateMode = (nextMode: 'create' | 'review') => {
    const next = new URLSearchParams(searchParams)
    next.set('mode', nextMode)
    if (nextMode === 'create') {
      next.delete('status')
    } else {
      next.set('status', reviewStatus)
    }
    setSearchParams(next, { replace: true })
  }

  const updateReviewStatus = (nextStatus: 'all' | LeaveStatus) => {
    const next = new URLSearchParams(searchParams)
    next.set('mode', 'review')
    next.set('status', nextStatus)
    setSearchParams(next, { replace: true })
  }

  const studentsQuery = useQuery({
    enabled: Boolean(activeClassId) && mode === 'create',
    queryFn: () => getClassStudents(activeClassId),
    queryKey: queryKeys.teacher.students(activeClassId),
  })

  const leavesQuery = useQuery({
    enabled: Boolean(activeClassId) && mode === 'review',
    queryFn: () =>
      getClassStudentLeaves(activeClassId, {
        status: reviewStatus === 'all' ? undefined : reviewStatus,
      }),
    queryKey: queryKeys.teacher.leaves(activeClassId, reviewStatus),
  })

  const approveMutation = useMutation({
    mutationFn: async (payload: LeaveApprovalPayload) => {
      if (!activeClassId) {
        throw new Error('Vui lòng chọn lớp trước khi duyệt đơn nghỉ.')
      }

      await approveClassStudentLeave(activeClassId, payload.leaveId, {
        approvalNote: payload.approvalNote?.trim() || undefined,
        leaveStatus: payload.leaveStatus,
      })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật đơn nghỉ.'
      toast.error(message)
    },
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái đơn nghỉ.')
      setApprovalModal(null)
      setApprovalNote('')
      void queryClient.invalidateQueries({
        queryKey: queryKeys.teacher.all,
      })
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeClassId) {
        throw new Error('Vui lòng chọn lớp trước khi tạo đơn nghỉ.')
      }

      const students = studentsQuery.data ?? []
      const effectiveStudentId =
        selectedStudentId && students.some((item) => item.id === selectedStudentId)
          ? selectedStudentId
          : students[0]?.id

      if (!effectiveStudentId) {
        throw new Error('Lớp chưa có học sinh để tạo đơn nghỉ.')
      }

      const start = new Date(`${leaveStartDate}T00:00:00`)
      const end = new Date(`${leaveEndDate}T23:59:59`)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error('Ngày nghỉ không hợp lệ.')
      }

      if (end.getTime() < start.getTime()) {
        throw new Error('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.')
      }

      const normalizedReason = reason.trim()
      if (!normalizedReason) {
        throw new Error('Vui lòng nhập lý do nghỉ.')
      }

      await createClassStudentLeave(activeClassId, {
        leaveEndDate: end.toISOString(),
        leaveStartDate: start.toISOString(),
        reason: normalizedReason,
        soStudentId: effectiveStudentId,
      })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Không thể tạo đơn nghỉ.'
      toast.error(message)
    },
    onSuccess: () => {
      toast.success('Đã tạo đơn nghỉ cho học sinh.')
      setReason('')
      void queryClient.invalidateQueries({
        queryKey: queryKeys.teacher.all,
      })
    },
  })

  const stats = useMemo(() => {
    const rows = leavesQuery.data ?? []

    return {
      approved: rows.filter((item) => item.leaveStatus === 'approved').length,
      reject: rows.filter((item) => item.leaveStatus === 'reject').length,
      waiting: rows.filter((item) => item.leaveStatus === 'waiting').length,
    }
  }, [leavesQuery.data])

  const students = studentsQuery.data ?? []
  const effectiveStudentId =
    selectedStudentId && students.some((item) => item.id === selectedStudentId)
      ? selectedStudentId
      : students[0]?.id ?? ''
  const approvalActionLabel = approvalModal?.leaveStatus === 'approved' ? 'duyệt' : 'từ chối'
  const approvalButtonLabel = approvalModal?.leaveStatus === 'approved' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'

  return (
    <section className="page-shell mx-auto w-full max-w-md space-y-4">
      <div className="ui-section space-y-4 p-4">
        <PageTitleHeader
          title="Đơn xin nghỉ"
          subtitle={mode === 'create' ? 'Tạo đơn giúp học sinh nhanh, chuẩn thông tin' : 'Duyệt đơn nghỉ theo lớp và trạng thái'}
        />

        <ClassSelector
          activeClassId={activeClassId}
          classes={classes}
          isLoading={classesQuery.isLoading}
          onChange={setActiveClassId}
        />

        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-600 via-amber-500 to-yellow-500 p-4 text-white">
          <span className="absolute -right-8 -top-8 size-24 rounded-full bg-white/10" />
          <span className="absolute -bottom-8 -left-8 size-20 rounded-full bg-white/10" />
          <div className="relative space-y-3">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
                <IconFileText className="size-3.5" />
                Quy trình đơn nghỉ
              </p>
              <p className="text-base font-bold">
                {activeClass ? `Đang thao tác lớp ${activeClass.name}` : 'Vui lòng chọn lớp trước khi xử lý đơn'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/85">Chờ duyệt</p>
                <p className="text-base font-bold">{stats.waiting}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/85">Đã duyệt</p>
                <p className="text-base font-bold">{stats.approved}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/85">Từ chối</p>
                <p className="text-base font-bold">{stats.reject}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={cn(
              'rounded-xl border px-4 py-2 text-sm font-semibold transition-colors',
              mode === 'create'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground',
            )}
            onClick={() => updateMode('create')}
          >
            Tạo đơn giúp
          </button>
          <button
            type="button"
            className={cn(
              'rounded-xl border px-4 py-2 text-sm font-semibold transition-colors',
              mode === 'review'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground',
            )}
            onClick={() => updateMode('review')}
          >
            Duyệt đơn
          </button>
        </div>
      </div>

      {mode === 'create' ? (
        <section className="ui-section space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">Tạo đơn nghỉ thay phụ huynh</h2>
            <Badge variant="secondary">Tạo nhanh</Badge>
          </div>

          {studentsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full rounded-full" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : students.length === 0 ? (
            <p className="ui-subtle-panel p-3 text-sm text-muted-foreground">Lớp chưa có học sinh để tạo đơn nghỉ.</p>
          ) : (
            <>
              <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                {students.map((student) => {
                  const isActive = student.id === effectiveStudentId
                  return (
                    <button
                      key={student.id}
                      type="button"
                      className={cn(
                        'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-muted-foreground',
                      )}
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      {student.name}
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Từ ngày</p>
                  <Input
                    type="date"
                    value={leaveStartDate}
                    onChange={(event) => setLeaveStartDate(event.target.value)}
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Đến ngày</p>
                  <Input
                    type="date"
                    value={leaveEndDate}
                    onChange={(event) => setLeaveEndDate(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lý do nghỉ</p>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ví dụ: học sinh sốt cao, cần nghỉ theo dõi sức khỏe tại nhà..."
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  className="w-full"
                  disabled={createMutation.isPending || !effectiveStudentId || !reason.trim()}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending ? 'Đang tạo đơn...' : 'Xác nhận tạo đơn'}
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/leaves?mode=review&status=waiting">
                    Mở duyệt đơn
                    <IconArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {mode === 'review' ? (
        <>
          <section className="ui-section space-y-4 p-4">
            <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
              {statusOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                    reviewStatus === item.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                  onClick={() => updateReviewStatus(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="ui-subtle-panel p-2 text-center">
                <p className="inline-flex items-center gap-1 text-xs text-amber-700">
                  <IconClock className="size-3.5" />
                  Chờ duyệt
                </p>
                <p className="text-xl font-bold">{stats.waiting}</p>
              </div>
              <div className="ui-subtle-panel p-2 text-center">
                <p className="inline-flex items-center gap-1 text-xs text-emerald-700">
                  <IconChecks className="size-3.5" />
                  Đã duyệt
                </p>
                <p className="text-xl font-bold">{stats.approved}</p>
              </div>
              <div className="ui-subtle-panel p-2 text-center">
                <p className="inline-flex items-center gap-1 text-xs text-rose-700">
                  <IconX className="size-3.5" />
                  Từ chối
                </p>
                <p className="text-xl font-bold">{stats.reject}</p>
              </div>
            </div>
          </section>

          {leavesQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <article key={`leaves-loading-${index}`} className="ui-section space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3.5 w-40" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-10/12" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-9 w-full rounded-xl" />
                    <Skeleton className="h-9 w-full rounded-xl" />
                  </div>
                </article>
              ))}
            </div>
          ) : (leavesQuery.data ?? []).length === 0 ? (
            <div className="ui-section p-4 text-sm text-muted-foreground">Không có đơn nghỉ nào phù hợp bộ lọc.</div>
          ) : (
            <div className="space-y-3">
              {(leavesQuery.data ?? []).map((item) => {
                const tone = getLeaveTone(item.leaveStatus)

                return (
                  <article key={item.id} className="ui-section space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{item.soStudent?.name ?? 'Học sinh'}</p>
                        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <IconCalendarClock className="size-3.5" />
                          {formatDate(item.leaveStartDate)} - {formatDate(item.leaveEndDate)}
                        </p>
                      </div>
                      <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', tone.badgeClassName)}>
                        {tone.label}
                      </span>
                    </div>

                    <p className="text-sm">{item.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Phụ huynh: {item.soParent?.name ?? 'Không rõ'} {item.soParent?.phone ? `• ${item.soParent.phone}` : ''}
                    </p>
                    {item.approvalNote ? (
                      <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        Ghi chú duyệt: {item.approvalNote}
                      </p>
                    ) : null}

                    {item.leaveStatus === 'waiting' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="bg-rose-50 text-rose-700 hover:bg-rose-100"
                          disabled={approveMutation.isPending}
                          onClick={() => {
                            setApprovalModal({
                              leaveId: item.id,
                              leaveStatus: 'reject',
                            })
                            setApprovalNote('')
                          }}
                        >
                          <IconX className="mr-1 size-4" />
                          Từ chối
                        </Button>
                        <Button
                          type="button"
                          className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                          disabled={approveMutation.isPending}
                          onClick={() => {
                            setApprovalModal({
                              leaveId: item.id,
                              leaveStatus: 'approved',
                            })
                            setApprovalNote('')
                          }}
                        >
                          <IconChecks className="mr-1 size-4" />
                          Duyệt đơn
                        </Button>
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
        </>
      ) : null}

      <BottomModal
        open={Boolean(approvalModal)}
        onClose={() => {
          if (approveMutation.isPending) {
            return
          }

          setApprovalModal(null)
          setApprovalNote('')
        }}
      >
        <div className="space-y-4 p-4">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-muted" />

          <div className="space-y-1">
            <p className="text-base font-bold">
              {approvalModal?.leaveStatus === 'approved' ? 'Duyệt đơn xin nghỉ' : 'Từ chối đơn xin nghỉ'}
            </p>
            <p className="text-sm text-muted-foreground">
              Xác nhận thao tác {approvalActionLabel} và ghi chú nếu cần để phụ huynh theo dõi.
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ghi chú duyệt (tùy chọn)
            </p>
            <Textarea
              value={approvalNote}
              onChange={(event) => setApprovalNote(event.target.value)}
              placeholder="Ví dụ: đã xác minh với phụ huynh qua điện thoại"
              className="min-h-24"
              disabled={approveMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setApprovalModal(null)
                setApprovalNote('')
              }}
              disabled={approveMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className={cn(
                approvalModal?.leaveStatus === 'approved'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-600/90'
                  : 'bg-rose-600 text-white hover:bg-rose-600/90',
              )}
              onClick={() => {
                if (!approvalModal) {
                  return
                }

                approveMutation.mutate({
                  leaveId: approvalModal.leaveId,
                  leaveStatus: approvalModal.leaveStatus,
                  approvalNote,
                })
              }}
              disabled={!approvalModal || approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Đang cập nhật...' : approvalButtonLabel}
            </Button>
          </div>
        </div>
      </BottomModal>

      {studentsQuery.isError || leavesQuery.isError ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <IconAlertCircle className="size-4" />
          <p>Một số dữ liệu đơn nghỉ chưa tải được. Vui lòng thử lại sau.</p>
        </div>
      ) : null}
    </section>
  )
}
