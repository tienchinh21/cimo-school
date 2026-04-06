import { useQuery } from '@tanstack/react-query'
import { orderBy } from 'lodash'

import { useAuthUser } from '@/app/contexts/AuthContext'
import { getDefaultLeaveStudent, mapLeaveRequestsToDashboard } from '@/pages/leave/leave-page.utils'
import { getLeaveRequests } from '@/pages/leave/service/get-leave-dashboard'
import { leaveRequestStatuses, type LeaveDashboard, type LeaveRequestItem } from '@/pages/leave/types/leave-page.types'
import { queryKeys } from '@/shared/api/query-keys'

const leaveStatusPriority = {
  [leaveRequestStatuses.PENDING]: 3,
  [leaveRequestStatuses.APPROVED]: 2,
  [leaveRequestStatuses.REJECTED]: 1,
} as const

function mapLeaveData(data: LeaveDashboard): LeaveDashboard {
  const sortedHistory = orderBy<LeaveRequestItem>(
    data.history,
    [(item) => leaveStatusPriority[item.status], (item) => item.id],
    ['desc', 'asc'],
  )

  return {
    ...data,
    history: sortedHistory,
  }
}

export function useLeavePage() {
  const user = useAuthUser()
  const student = getDefaultLeaveStudent(user)

  return useQuery({
    queryKey: queryKeys.leave.dashboard(),
    queryFn: () => getLeaveRequests(student?.id ?? ''),
    enabled: Boolean(student),
    staleTime: 1000 * 30,
    select: (data) => mapLeaveData(mapLeaveRequestsToDashboard(data, student!)),
  })
}
