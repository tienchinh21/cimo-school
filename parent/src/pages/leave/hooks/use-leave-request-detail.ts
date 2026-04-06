import { useQuery } from '@tanstack/react-query'

import { useAuthUser } from '@/app/contexts/AuthContext'
import { getDefaultLeaveStudent, mapLeaveRequestToDetail } from '@/pages/leave/leave-page.utils'
import { getLeaveRequestDetail } from '@/pages/leave/service/get-leave-request-detail'
import { queryKeys } from '@/shared/api/query-keys'

export function useLeaveRequestDetail(requestId: string | undefined) {
  const user = useAuthUser()
  const student = getDefaultLeaveStudent(user)

  return useQuery({
    queryKey: queryKeys.leave.detail(requestId ?? 'unknown'),
    queryFn: () => getLeaveRequestDetail(requestId ?? ''),
    enabled: Boolean(requestId && student),
    staleTime: 1000 * 30,
    select: (data) => {
      if (!data || !student) {
        return null
      }

      return mapLeaveRequestToDetail(data, student)
    },
  })
}
