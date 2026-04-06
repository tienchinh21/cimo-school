import { useQuery } from '@tanstack/react-query'
import { mapValues, orderBy } from 'lodash'

import { getScheduleDashboard } from '@/pages/schedule/service/get-schedule-dashboard'
import type { ScheduleDashboardResponse } from '@/pages/schedule/types/schedule-page.types'
import { queryKeys } from '@/shared/api/query-keys'

function mapScheduleData(data: ScheduleDashboardResponse): ScheduleDashboardResponse {
  return {
    ...data,
    days: mapValues(data.days, (day) => ({
      ...day,
      periods: orderBy(day.periods, ['order'], ['asc']),
    })),
  }
}

export function useSchedulePage() {
  return useQuery({
    queryKey: queryKeys.schedule.dashboard(),
    queryFn: getScheduleDashboard,
    staleTime: 1000 * 30,
    select: mapScheduleData,
  })
}
