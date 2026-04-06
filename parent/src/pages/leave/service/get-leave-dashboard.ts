import { httpRequest } from '@/shared/api/http-client'

export const leaveApiStatuses = {
  APPROVED: 'approved',
  WAITING: 'waiting',
  REJECT: 'reject',
} as const

export type LeaveRequestApiStatus = (typeof leaveApiStatuses)[keyof typeof leaveApiStatuses]

export interface LeaveRequestApiResponse {
  id: string
  createdDate?: string
  updatedDate?: string
  leaveStatus: LeaveRequestApiStatus
  leaveStartDate: string
  leaveEndDate: string
  reason: string
  soParentId: string
  soStudentId: string
  soUserId: string
}

const PARENTS_STUDENT_LEAVE_PATH = '/student-leave'
const PARENTS_STUDENT_LEAVE_COLLECTION_PATH = '/student-leave/so-student-leaves'

export interface UpsertLeaveRequestApiPayload {
  leaveStatus: LeaveRequestApiStatus
  leaveStartDate: string
  leaveEndDate: string
  reason: string
  soParentId: string
  soStudentId: string
  soUserId: string
}

function buildLeaveListFilter(studentId: string) {
  return JSON.stringify({
    limit: 100,
    skip: 0,
    order: 'leaveStartDate DESC',
    where: {
      soStudentId: studentId,
    },
    fields: {
      id: true,
      createdDate: true,
      updatedDate: true,
      leaveStatus: true,
      leaveStartDate: true,
      leaveEndDate: true,
      reason: true,
      soParentId: true,
      soStudentId: true,
      soUserId: true,
    },
  })
}

function buildLeaveDetailFilter(requestId: string) {
  return JSON.stringify({
    limit: 1,
    skip: 0,
    where: {
      id: requestId,
    },
    fields: {
      id: true,
      createdDate: true,
      updatedDate: true,
      leaveStatus: true,
      leaveStartDate: true,
      leaveEndDate: true,
      reason: true,
      soParentId: true,
      soStudentId: true,
      soUserId: true,
    },
  })
}

export function getLeaveRequests(studentId: string): Promise<LeaveRequestApiResponse[]> {
  return httpRequest<LeaveRequestApiResponse[]>(PARENTS_STUDENT_LEAVE_PATH, {
    query: {
      filter: buildLeaveListFilter(studentId),
    },
  })
}

export async function getLeaveRequestById(requestId: string) {
  const items = await httpRequest<LeaveRequestApiResponse[]>(PARENTS_STUDENT_LEAVE_PATH, {
    query: {
      filter: buildLeaveDetailFilter(requestId),
    },
  })

  return items[0] ?? null
}

export function createLeaveRequest(payload: UpsertLeaveRequestApiPayload) {
  return httpRequest<LeaveRequestApiResponse>(PARENTS_STUDENT_LEAVE_COLLECTION_PATH, {
    method: 'POST',
    body: payload,
  })
}

export function updateLeaveRequest(requestId: string, payload: UpsertLeaveRequestApiPayload) {
  return httpRequest<LeaveRequestApiResponse>(`${PARENTS_STUDENT_LEAVE_COLLECTION_PATH}/${requestId}`, {
    method: 'PATCH',
    body: payload,
  })
}
