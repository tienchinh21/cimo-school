import { IconCalendarMonth, IconEdit } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { PageTitleHeader } from '@/app/components/page-title-header'
import { useAuthUser } from '@/app/contexts/AuthContext'
import { StudentSelectorCard } from '@/pages/attendance/components/student-selector-card'
import { LeavePageSkeleton, LeaveStateCard } from '@/pages/leave/components/leave-page-state'
import { useUpsertLeaveRequest } from '@/pages/leave/hooks/use-upsert-leave-request'
import {
  getDefaultLeaveStudent,
  getLeaveErrorMessage,
  getLeaveRecipientUserId,
  mapParentStudentToLeaveStudent,
  sanitizeLeaveReason,
} from '@/pages/leave/leave-page.utils'
import { type LeaveRequestApiResponse, leaveApiStatuses } from '@/pages/leave/service/get-leave-dashboard'
import { getLeaveRequestDetail } from '@/pages/leave/service/get-leave-request-detail'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { queryKeys } from '@/shared/api/query-keys'

function getTodayInputValue() {
  const currentDate = new Date()
  const timezoneAdjustedDate = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60 * 1000)

  return timezoneAdjustedDate.toISOString().slice(0, 10)
}

function toLeaveApiDate(date: string) {
  return `${date}T00:00:00.000Z`
}

function toDateInputValue(dateIso?: string) {
  return dateIso?.slice(0, 10) ?? getTodayInputValue()
}

export function LeaveCreatePage() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const user = useAuthUser()
  const student = getDefaultLeaveStudent(user)
  const displayStudent = student ? mapParentStudentToLeaveStudent(student) : null
  const isEditMode = Boolean(requestId)
  const editQuery = useQuery<LeaveRequestApiResponse | null>({
    queryKey: queryKeys.leave.detail(requestId ?? 'new'),
    queryFn: () => getLeaveRequestDetail(requestId ?? ''),
    enabled: isEditMode,
    staleTime: 1000 * 30,
  })
  const saveMutation = useUpsertLeaveRequest(requestId)
  const [fromDate, setFromDate] = useState(getTodayInputValue())
  const [toDate, setToDate] = useState(getTodayInputValue())
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState('')
  const [hasHydratedEditValues, setHasHydratedEditValues] = useState(false)
  const assigneeUserId = getLeaveRecipientUserId(student)

  const isDateRangeInvalid = fromDate > toDate
  const isEditingWaitingRequest = editQuery.data?.leaveStatus === leaveApiStatuses.WAITING
  const isSubmitDisabled =
    !reason.trim() ||
    !user ||
    !student ||
    !assigneeUserId ||
    isDateRangeInvalid ||
    saveMutation.isPending ||
    (isEditMode && !isEditingWaitingRequest)

  useEffect(() => {
    if (!editQuery.data || hasHydratedEditValues) {
      return
    }

    setFromDate(toDateInputValue(editQuery.data.leaveStartDate))
    setToDate(toDateInputValue(editQuery.data.leaveEndDate))
    setReason(sanitizeLeaveReason(editQuery.data.reason))
    setHasHydratedEditValues(true)
  }, [editQuery.data, hasHydratedEditValues])

  const submitError = formError || (saveMutation.isError ? getLeaveErrorMessage(saveMutation.error, 'Không thể gửi đơn nghỉ.') : '')

  function handleBack() {
    navigate(requestId ? `/leave/${requestId}` : '/leave')
  }

  function handleSubmit() {
    if (!user || !student) {
      setFormError('Thông tin phụ huynh hoặc học sinh chưa sẵn sàng để gửi đơn nghỉ.')
      return
    }

    if (!assigneeUserId) {
      setFormError('Chưa xác định được giáo viên phụ trách để chuyển đơn nghỉ. Vui lòng thử lại sau.')
      return
    }

    if (fromDate > toDate) {
      setFormError('Ngày kết thúc không được sớm hơn ngày bắt đầu.')
      return
    }

    if (isEditMode && !isEditingWaitingRequest) {
      setFormError('Chỉ có thể chỉnh sửa đơn đang ở trạng thái chờ duyệt.')
      return
    }

    setFormError('')
    saveMutation.mutate(
      {
        leaveStatus: leaveApiStatuses.WAITING,
        leaveStartDate: toLeaveApiDate(fromDate),
        leaveEndDate: toLeaveApiDate(toDate),
        reason: reason.trim(),
        soParentId: user.id,
        soStudentId: student.id,
        soUserId: assigneeUserId,
      },
      {
        onSuccess: (response) => {
          navigate(response.id ? `/leave/${response.id}` : '/leave', { replace: true })
        },
      },
    )
  }

  if (isEditMode && editQuery.isLoading) {
    return <LeavePageSkeleton />
  }

  if (!user || !student || !displayStudent) {
    return (
      <section className="mx-auto w-full max-w-3xl py-8">
        <LeaveStateCard
          icon="error"
          title="Không thể tải dữ liệu học sinh"
          description="Thông tin học sinh chưa sẵn sàng nên hiện chưa thể khởi tạo đơn nghỉ."
          actionLabel="Quay lại danh sách"
          onAction={() => navigate('/leave')}
        />
      </section>
    )
  }

  if (isEditMode && editQuery.isError) {
    return (
      <section className="mx-auto w-full max-w-3xl py-8">
        <LeaveStateCard
          icon="error"
          title="Không thể tải đơn nghỉ để chỉnh sửa"
          description="Dữ liệu đơn nghỉ chưa đồng bộ hoặc kết nối đang gián đoạn. Vui lòng thử lại sau."
          actionLabel="Quay lại chi tiết"
          onAction={handleBack}
        />
      </section>
    )
  }

  if (isEditMode && (!editQuery.data || editQuery.data.leaveStatus !== leaveApiStatuses.WAITING)) {
    return (
      <section className="mx-auto w-full max-w-3xl py-8">
        <LeaveStateCard
          icon="empty"
          title="Đơn nghỉ này không thể chỉnh sửa"
          description="Phụ huynh chỉ có thể chỉnh sửa đơn đang ở trạng thái chờ duyệt."
          actionLabel="Quay lại chi tiết"
          onAction={handleBack}
        />
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <PageTitleHeader title={isEditMode ? 'Chỉnh sửa đơn nghỉ học' : 'Tạo đơn xin nghỉ học'} />

      <div className="mt-4 space-y-5">
        <StudentSelectorCard student={displayStudent} />
        <section className="rounded-3xl border border-primary/15 bg-primary/5 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Tóm tắt đơn nghỉ</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {fromDate === toDate ? `Ngày nghỉ: ${fromDate}` : `Từ ${fromDate} đến ${toDate}`}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {reason.trim()
              ? reason.trim()
              : 'Nhập lý do nghỉ để giáo viên nắm được tình hình và ưu tiên xử lý nhanh hơn.'}
          </p>
        </section>

        <section className="ui-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <IconCalendarMonth className="size-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Chọn ngày nghỉ</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block px-1 text-[10px] font-bold uppercase text-muted-foreground">Từ ngày</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-12 rounded-2xl border-0 bg-muted px-4 font-medium"
              />
            </div>
            <div>
              <label className="mb-1 block px-1 text-[10px] font-bold uppercase text-muted-foreground">Đến ngày</label>
              <Input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-12 rounded-2xl border-0 bg-muted px-4 font-medium"
              />
            </div>
          </div>
        </section>

        <section className="ui-card p-5">
          <div className="mb-2 flex items-center gap-2">
            <IconEdit className="size-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Lý do nghỉ</h3>
          </div>
          <div>
            <label className="mb-1 block px-1 text-[10px] font-bold uppercase text-muted-foreground">Lý do nghỉ *</label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ví dụ: Con bị ốm, việc gia đình..."
              className="rounded-2xl border-0 bg-muted px-4 py-3"
            />
          </div>
        </section>

        <div className="space-y-3 pb-2">
          {submitError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}
          <Button
            type="button"
            className="h-12 w-full rounded-2xl text-sm font-bold"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {saveMutation.isPending
              ? isEditMode
                ? 'Đang cập nhật đơn nghỉ...'
                : 'Đang gửi đơn nghỉ...'
              : isEditMode
                ? 'Cập nhật đơn nghỉ'
                : 'Gửi đơn xin nghỉ'}
          </Button>
          {isSubmitDisabled ? (
            <p className="px-1 text-center text-xs text-muted-foreground">
              {isDateRangeInvalid
                ? 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.'
                : 'Điền lý do nghỉ để bật nút gửi đơn.'}
            </p>
          ) : null}
          <Button type="button" variant="ghost" className="h-12 w-full rounded-2xl text-muted-foreground" onClick={handleBack}>
            Hủy bỏ
          </Button>
        </div>
      </div>
    </section>
  )
}
