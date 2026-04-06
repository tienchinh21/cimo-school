export const leaveRequestStatuses = {
  APPROVED: 'APPROVED',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
} as const

export type LeaveRequestStatus = (typeof leaveRequestStatuses)[keyof typeof leaveRequestStatuses]

export interface LeaveStudent {
  id: string
  name: string
  grade: string
  avatarUrl: string
}

export interface LeaveSummaryStat {
  id: string
  label: string
  count: number
  status?: LeaveRequestStatus
}

export interface LeaveRequestItem {
  id: string
  requestCode: string
  title: string
  reason: string
  status: LeaveRequestStatus
  statusLabel: string
  submittedAtLabel: string
  reviewerLabel?: string
  feedback?: string
}

export interface LeavePolicyInfo {
  title: string
  description: string
  actionLabel: string
}

export const leaveActorRoles = {
  PARENT: 'PARENT',
  SYSTEM: 'SYSTEM',
  HOMEROOM_TEACHER: 'HOMEROOM_TEACHER',
} as const

export type LeaveActorRole = (typeof leaveActorRoles)[keyof typeof leaveActorRoles]

export interface LeaveTimelineItem {
  id: string
  title: string
  actorLabel: string
  actorRole: LeaveActorRole
  happenedAtLabel: string
  note?: string
}

export interface LeaveAttachment {
  id: string
  imageUrl: string
}

export interface LeaveRequestDetail {
  id: string
  requestCode: string
  status: LeaveRequestStatus
  statusLabel: string
  student: LeaveStudent
  submittedDateLabel: string
  leaveDateLabel: string
  reason: string
  attachment?: LeaveAttachment
  reviewerLabel?: string
  timeline: LeaveTimelineItem[]
}

export interface LeaveDashboard {
  student: LeaveStudent
  summaryStats: LeaveSummaryStat[]
  history: LeaveRequestItem[]
  policy: LeavePolicyInfo
}
