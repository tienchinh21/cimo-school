export const scheduleFilterKeys = {
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  THIS_WEEK: 'this_week',
  CUSTOM: 'custom',
} as const

export type ScheduleFilterKey = (typeof scheduleFilterKeys)[keyof typeof scheduleFilterKeys]

export interface ScheduleFilterItem {
  key: ScheduleFilterKey
  label: string
  helper: string
}

export interface ScheduleStudent {
  id: string
  name: string
  grade: string
  avatarUrl: string
}

export const schedulePeriodStatuses = {
  ONGOING: 'ONGOING',
  NORMAL: 'NORMAL',
  ROOM_CHANGED: 'ROOM_CHANGED',
  CANCELED: 'CANCELED',
} as const

export type SchedulePeriodStatus = (typeof schedulePeriodStatuses)[keyof typeof schedulePeriodStatuses]

export interface SchedulePeriod {
  id: string
  order: number
  periodLabel: string
  startTime: string
  endTime: string
  subjectName: string
  teacherName: string
  roomLabel: string
  tagLabel: string
  status: SchedulePeriodStatus
  note?: string
}

export interface ScheduleDayOverview {
  periodCount: number
  semesterLabel: string
  startAt: string
  endAt: string
  alertMessage?: string
}

export interface ScheduleDayData {
  dateLabel: string
  overview: ScheduleDayOverview
  periods: SchedulePeriod[]
}

export interface ScheduleDashboardResponse {
  student: ScheduleStudent
  days: Record<ScheduleFilterKey, ScheduleDayData>
}
