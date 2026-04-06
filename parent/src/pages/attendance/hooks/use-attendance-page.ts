import { useQuery } from '@tanstack/react-query'

import { getAttendanceDashboard } from '@/pages/attendance/service/get-attendance-dashboard'

export function useAttendancePage() {
  return useQuery({
    queryKey: ['attendance-dashboard'],
    queryFn: getAttendanceDashboard,
  })
}
