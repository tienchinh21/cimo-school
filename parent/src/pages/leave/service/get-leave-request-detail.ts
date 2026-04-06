import { getLeaveRequestById } from '@/pages/leave/service/get-leave-dashboard'

export async function getLeaveRequestDetail(requestId: string) {
  return getLeaveRequestById(requestId)
}
