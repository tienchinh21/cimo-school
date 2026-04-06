import { httpRequest } from '@/shared/api/http-client'
import type {
  LeaveStatus,
  TeacherApproveLeavePayload,
  TeacherBlog,
  TeacherBulkCheckinItem,
  TeacherBulkCheckinResponse,
  TeacherClassSummary,
  TeacherCreateBlogPayload,
  TeacherCreateLeavePayload,
  TeacherStudent,
  TeacherStudentDailyCheckin,
  TeacherStudentLeave,
  TeacherStudentPayload,
  TeacherUpdateStudentPayload,
} from '@/shared/api/teacher.types'

export function getTeacherClasses() {
  return httpRequest<TeacherClassSummary[]>('/teachers/classes')
}

export function getClassStudents(classId: string) {
  return httpRequest<TeacherStudent[]>(`/teachers/classes/${classId}/students`)
}

export function createClassStudent(classId: string, payload: TeacherStudentPayload) {
  return httpRequest<TeacherStudent>(`/teachers/classes/${classId}/students`, {
    body: payload,
    method: 'POST',
  })
}

export function updateClassStudent(
  classId: string,
  studentId: string,
  payload: TeacherUpdateStudentPayload,
) {
  return httpRequest<void>(`/teachers/classes/${classId}/students/${studentId}`, {
    body: payload,
    method: 'PATCH',
  })
}

export function deleteClassStudent(classId: string, studentId: string) {
  return httpRequest<void>(`/teachers/classes/${classId}/students/${studentId}`, {
    method: 'DELETE',
  })
}

export function getClassCheckins(classId: string, date: string) {
  return httpRequest<TeacherStudentDailyCheckin[]>(`/teachers/classes/${classId}/checkins`, {
    query: { date },
  })
}

export function bulkUpsertClassCheckins(classId: string, items: TeacherBulkCheckinItem[]) {
  return httpRequest<TeacherBulkCheckinResponse>(`/teachers/classes/${classId}/checkins/bulk-upsert`, {
    body: { items },
    method: 'POST',
  })
}

export function deleteClassCheckin(classId: string, checkinId: string) {
  return httpRequest<void>(`/teachers/classes/${classId}/checkins/${checkinId}`, {
    method: 'DELETE',
  })
}

export function getClassBlogs(classId: string) {
  return httpRequest<TeacherBlog[]>(`/teachers/classes/${classId}/blogs`)
}

export function createClassBlog(classId: string, payload: TeacherCreateBlogPayload) {
  return httpRequest<TeacherBlog>(`/teachers/classes/${classId}/blogs`, {
    body: payload,
    method: 'POST',
  })
}

export function getClassStudentLeaves(
  classId: string,
  params?: {
    fromDate?: string
    status?: LeaveStatus
    toDate?: string
  },
) {
  return httpRequest<TeacherStudentLeave[]>(`/teachers/classes/${classId}/student-leaves`, {
    query: params,
  })
}

export function createClassStudentLeave(classId: string, payload: TeacherCreateLeavePayload) {
  return httpRequest<TeacherStudentLeave>(`/teachers/classes/${classId}/student-leaves`, {
    body: payload,
    method: 'POST',
  })
}

export function approveClassStudentLeave(
  classId: string,
  leaveId: string,
  payload: TeacherApproveLeavePayload,
) {
  return httpRequest<TeacherStudentLeave>(
    `/teachers/classes/${classId}/student-leaves/${leaveId}/approval`,
    {
      body: payload,
      method: 'PATCH',
    },
  )
}
