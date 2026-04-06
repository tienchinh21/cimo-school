import {
  leaveActorRoles,
  leaveRequestStatuses,
  type LeaveDashboard,
  type LeaveRequestDetail,
  type LeaveRequestStatus,
  type LeaveStudent,
  type LeaveTimelineItem,
} from '@/pages/leave/types/leave-page.types'
import type { ParentProfileResponse, ParentStudentResponse } from '@/shared/api/auth.types'
import { ApiError } from '@/shared/api/types'

import type { LeaveRequestApiResponse, LeaveRequestApiStatus } from '@/pages/leave/service/get-leave-dashboard'

const leaveApiStatusToUiStatus: Record<LeaveRequestApiStatus, LeaveRequestStatus> = {
  approved: leaveRequestStatuses.APPROVED,
  waiting: leaveRequestStatuses.PENDING,
  reject: leaveRequestStatuses.REJECTED,
}

const leaveStatusLabels: Record<LeaveRequestStatus, string> = {
  [leaveRequestStatuses.APPROVED]: 'Đã duyệt',
  [leaveRequestStatuses.PENDING]: 'Chờ duyệt',
  [leaveRequestStatuses.REJECTED]: 'Từ chối',
}

const leaveReasonMetadataPrefix = '__CIMO_LEAVE_META__:'
const leaveReasonMetadataSeparator = '\n'

export function getLeaveErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}

export function formatLeaveDate(dateIso?: string) {
  if (!dateIso) {
    return ''
  }

  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) {
    return dateIso
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatLeaveDateTime(dateIso?: string) {
  if (!dateIso) {
    return ''
  }

  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) {
    return dateIso
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function normalizeImageUrl(url?: string) {
  const trimmed = url?.trim() ?? ''
  if (!trimmed) {
    return ''
  }

  if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return trimmed.slice(1, -1).trim()
  }

  return trimmed.replaceAll('`', '').trim()
}

export function mapParentStudentToLeaveStudent(student: ParentStudentResponse): LeaveStudent {
  return {
    id: student.id,
    name: student.name,
    grade: student.soClass?.name ?? student.soClassId,
    avatarUrl: normalizeImageUrl(student.avt),
  }
}

export function getDefaultLeaveStudent(user: ParentProfileResponse | null | undefined) {
  return user?.students[0]
}

export function getLeaveRecipientUserId(student: ParentStudentResponse | null | undefined) {
  return student?.soClass?.soUsers?.[0]?.id ?? ''
}

function mapApiStatus(status: LeaveRequestApiStatus): LeaveRequestStatus {
  return leaveApiStatusToUiStatus[status]
}

export function sanitizeLeaveReason(rawReason: string | undefined) {
  const normalizedReason = rawReason?.trim() ?? ''

  if (!normalizedReason) {
    return ''
  }

  const [firstLine, ...restLines] = normalizedReason.split(leaveReasonMetadataSeparator)

  if (!firstLine.startsWith(leaveReasonMetadataPrefix)) {
    return normalizedReason
  }

  try {
    return restLines.join(leaveReasonMetadataSeparator).trim()
  } catch {
    return normalizedReason
  }
}

function buildLeaveTitle(startDate: string, endDate: string) {
  const startLabel = formatLeaveDate(startDate)
  const endLabel = formatLeaveDate(endDate)

  if (!startLabel && !endLabel) {
    return 'Đơn nghỉ học'
  }

  if (startLabel === endLabel || !endLabel) {
    return `Nghỉ học - ${startLabel}`
  }

  return `Nghỉ học - ${startLabel} đến ${endLabel}`
}

function buildRequestCode(id: string) {
  return `LH-${id.slice(0, 8).toUpperCase()}`
}

export function mapLeaveRequestsToDashboard(
  requests: LeaveRequestApiResponse[],
  student: ParentStudentResponse,
): LeaveDashboard {
  const leaveStudent = mapParentStudentToLeaveStudent(student)
  const history = requests
    .filter((request) => request.soStudentId === student.id)
    .sort((left, right) => {
      const leftTime = new Date(left.leaveStartDate).getTime()
      const rightTime = new Date(right.leaveStartDate).getTime()

      return rightTime - leftTime
    })
    .map((request) => {
      const status = mapApiStatus(request.leaveStatus)

      return {
        id: request.id,
        requestCode: buildRequestCode(request.id),
        title: buildLeaveTitle(request.leaveStartDate, request.leaveEndDate),
        reason: sanitizeLeaveReason(request.reason),
        status,
        statusLabel: leaveStatusLabels[status],
        submittedAtLabel: formatLeaveDate(request.createdDate ?? request.leaveStartDate),
      }
    })

  const summaryStats = [
    { id: 'total', label: 'Đã gửi', count: history.length },
    {
      id: 'pending',
      label: 'Chờ duyệt',
      count: history.filter((item) => item.status === leaveRequestStatuses.PENDING).length,
      status: leaveRequestStatuses.PENDING,
    },
    {
      id: 'approved',
      label: 'Đã duyệt',
      count: history.filter((item) => item.status === leaveRequestStatuses.APPROVED).length,
      status: leaveRequestStatuses.APPROVED,
    },
    {
      id: 'rejected',
      label: 'Từ chối',
      count: history.filter((item) => item.status === leaveRequestStatuses.REJECTED).length,
      status: leaveRequestStatuses.REJECTED,
    },
  ]

  return {
    student: leaveStudent,
    summaryStats,
    history,
    policy: {
      title: 'Quy định nghỉ học',
      description: 'Vui lòng nộp đơn trước 7:30 sáng để nhà trường chủ động theo dõi và phản hồi kịp thời.',
      actionLabel: 'Xem chi tiết quy định',
    },
  }
}

export function mapLeaveRequestToDetail(
  request: LeaveRequestApiResponse,
  student: ParentStudentResponse,
): LeaveRequestDetail {
  const status = mapApiStatus(request.leaveStatus)
  const submittedAt = request.createdDate ?? request.updatedDate ?? request.leaveStartDate
  const reviewedAt = request.updatedDate ?? request.leaveStartDate
  const timeline: LeaveTimelineItem[] = [
    {
      id: `${request.id}-submitted`,
      title: 'Đã gửi đơn',
      actorLabel: 'Phụ huynh',
      actorRole: leaveActorRoles.PARENT,
      happenedAtLabel: formatLeaveDateTime(submittedAt),
    },
  ]

  if (status === leaveRequestStatuses.PENDING) {
    timeline.unshift({
      id: `${request.id}-processing`,
      title: 'Đang xử lý',
      actorLabel: 'Hệ thống',
      actorRole: leaveActorRoles.SYSTEM,
      happenedAtLabel: formatLeaveDateTime(reviewedAt),
    })
  } else {
    timeline.unshift({
      id: `${request.id}-reviewed`,
      title: status === leaveRequestStatuses.APPROVED ? 'Đã phê duyệt' : 'Đã từ chối',
      actorLabel: 'Nhà trường',
      actorRole: leaveActorRoles.HOMEROOM_TEACHER,
      happenedAtLabel: formatLeaveDateTime(reviewedAt),
    })
  }

  return {
    id: request.id,
    requestCode: buildRequestCode(request.id),
    status,
    statusLabel: leaveStatusLabels[status],
    student: mapParentStudentToLeaveStudent(student),
    submittedDateLabel: formatLeaveDate(submittedAt),
    leaveDateLabel: buildLeaveTitle(request.leaveStartDate, request.leaveEndDate).replace('Nghỉ học - ', ''),
    reason: sanitizeLeaveReason(request.reason),
    timeline,
  }
}
