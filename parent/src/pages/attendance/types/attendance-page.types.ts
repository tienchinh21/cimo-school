export const attendanceStatuses = {
  ON_TIME: 'ON_TIME',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED',
  UNEXCUSED: 'UNEXCUSED',
} as const

export type AttendanceStatus = (typeof attendanceStatuses)[keyof typeof attendanceStatuses]

export const attendanceFilterKeys = {
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  CUSTOM: 'custom',
} as const

export type AttendanceFilterKey = (typeof attendanceFilterKeys)[keyof typeof attendanceFilterKeys]

export interface AttendanceStudent {
  id: string
  name: string
  grade: string
  avatarUrl: string
}

export interface AttendanceSummaryStat {
  id: string
  label: string
  shortLabel: string
  count: number
  status: AttendanceStatus
}

export interface AttendanceRecord {
  id: string
  sessionLabel: string
  status: AttendanceStatus
  timeline: string
  note: string
}

export interface AttendanceDayGroup {
  id: string
  heading: string
  records: AttendanceRecord[]
}

export interface AttendanceDashboard {
  student: AttendanceStudent
  updatedAtLabel: string
  attendanceRate: number
  stats: AttendanceSummaryStat[]
  groups: AttendanceDayGroup[]
}

export interface AttendanceFilterItem {
  key: AttendanceFilterKey
  label: string
}
