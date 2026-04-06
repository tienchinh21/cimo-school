export type CheckType = 'in' | 'out'

export interface TeacherClassSummary {
  costPerSession?: number | null
  createdDate?: string
  fromDate?: string | null
  id: string
  name: string
  studentCount: number
  toDate?: string | null
  updatedDate?: string
}

export interface TeacherStudent {
  address?: string
  avt?: string
  createdDate?: string
  dob: string
  email?: string
  gender: boolean
  id: string
  name: string
  nationalId?: string
  phone?: string
  parents?: TeacherStudentParent[]
  soClassId: string
  updatedDate?: string
}

export interface TeacherStudentParent {
  address?: string
  avt?: string
  createdDate?: string
  dob?: string
  email?: string
  gender?: boolean
  id: string
  job?: string
  name?: string
  nationalId?: string
  phone?: string
  relation?: string
  updatedDate?: string
}

export interface TeacherDailyCheckin {
  checkDate: string
  checkType: CheckType
  id: string
  note?: string
  soClassesId: string
  soStudentId: string
}

export interface TeacherStudentDailyCheckin {
  checkin?: TeacherDailyCheckin
  checkout?: TeacherDailyCheckin
  student: TeacherStudent
}

export interface TeacherBulkCheckinItem {
  checkDate: string
  checkType: CheckType
  note?: string
  soStudentId: string
}

export interface TeacherBulkCheckinResponse {
  created: number
  total: number
  updated: number
}

export interface TeacherBlog {
  category: 'all' | 'class' | 'student'
  createdDate?: string
  description: string
  id: string
  imgs?: string[]
  name: string
  relateIds?: string[]
  sumary: string
  updatedDate?: string
}

export interface TeacherCreateBlogPayload {
  description: string
  imgs?: string[]
  name: string
  sumary: string
}

export interface TeacherParentSummary {
  id: string
  name?: string
  phone?: string
  relation?: string
}

export interface TeacherUserSummary {
  id: string
  name?: string
}

export type LeaveStatus = 'waiting' | 'approved' | 'reject'

export interface TeacherStudentLeave {
  approvalNote?: string
  approvedDate?: string
  createdDate?: string
  id: string
  leaveEndDate: string
  leaveStartDate: string
  leaveStatus: LeaveStatus
  reason: string
  soParent?: TeacherParentSummary
  soParentId?: string
  soStudent?: TeacherStudent
  soStudentId: string
  soUser?: TeacherUserSummary
  soUserId?: string
}

export interface TeacherStudentPayload {
  address?: string
  avt?: string
  dob: string
  email?: string
  gender: boolean
  name: string
  nationalId?: string
  phone?: string
}

export type TeacherUpdateStudentPayload = Partial<TeacherStudentPayload>

export interface TeacherApproveLeavePayload {
  approvalNote?: string
  leaveStatus: 'approved' | 'reject'
}

export interface TeacherCreateLeavePayload {
  leaveEndDate: string
  leaveStartDate: string
  reason: string
  soParentId?: string
  soStudentId: string
}
