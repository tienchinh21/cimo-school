import { attendanceStatuses, type AttendanceStatus } from '@/pages/attendance/types/attendance-page.types'

export const attendanceStatusTones = {
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  INFO: 'INFO',
  DANGER: 'DANGER',
} as const

export type AttendanceStatusTone = (typeof attendanceStatusTones)[keyof typeof attendanceStatusTones]

interface AttendanceStatusUi {
  label: string
  tone: AttendanceStatusTone
  badgeClassName: string
  borderClassName: string
  statClassName: string
}

export const ATTENDANCE_STATUS_UI: Record<AttendanceStatus, AttendanceStatusUi> = {
  [attendanceStatuses.ON_TIME]: {
    label: 'Đúng giờ',
    tone: attendanceStatusTones.SUCCESS,
    badgeClassName: 'border-transparent bg-emerald-100 text-emerald-700',
    borderClassName: 'border-l-4 border-l-emerald-500',
    statClassName: 'bg-emerald-50 text-emerald-700',
  },
  [attendanceStatuses.LATE]: {
    label: 'Đi muộn',
    tone: attendanceStatusTones.WARNING,
    badgeClassName: 'border-transparent bg-orange-100 text-orange-700',
    borderClassName: 'border-l-4 border-l-orange-500',
    statClassName: 'bg-orange-50 text-orange-700',
  },
  [attendanceStatuses.EXCUSED]: {
    label: 'Vắng có phép',
    tone: attendanceStatusTones.INFO,
    badgeClassName: 'border-transparent bg-blue-100 text-blue-700',
    borderClassName: 'border-l-4 border-l-blue-500',
    statClassName: 'bg-blue-50 text-blue-700',
  },
  [attendanceStatuses.UNEXCUSED]: {
    label: 'Vắng không phép',
    tone: attendanceStatusTones.DANGER,
    badgeClassName: 'border-transparent bg-red-100 text-red-700',
    borderClassName: 'border-l-4 border-l-red-500',
    statClassName: 'bg-red-50 text-red-700',
  },
}
