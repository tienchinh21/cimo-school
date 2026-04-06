import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  createLeaveRequest,
  type LeaveRequestApiResponse,
  type UpsertLeaveRequestApiPayload,
  updateLeaveRequest,
} from '@/pages/leave/service/get-leave-dashboard'
import { queryKeys } from '@/shared/api/query-keys'

export function useUpsertLeaveRequest(requestId?: string) {
  const queryClient = useQueryClient()

  return useMutation<LeaveRequestApiResponse, Error, UpsertLeaveRequestApiPayload>({
    mutationFn: (payload) => {
      if (requestId) {
        return updateLeaveRequest(requestId, payload)
      }

      return createLeaveRequest(payload)
    },
    onSuccess: async (response) => {
      const invalidationTasks = [
        queryClient.invalidateQueries({ queryKey: queryKeys.leave.all }),
      ]

      if (requestId) {
        invalidationTasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.leave.detail(requestId) }))
      }

      if (response.id) {
        invalidationTasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.leave.detail(response.id) }))
      }

      await Promise.all(invalidationTasks)
    },
  })
}
