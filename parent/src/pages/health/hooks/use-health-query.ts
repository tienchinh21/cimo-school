import { useQuery } from '@tanstack/react-query'

import { getHealth } from '@/pages/health/service/get-health'
import type { HealthResponse } from '@/pages/health/types/health-page.types'
import type { QueryConfig } from '@/shared/api/query-options'
import { queryKeys } from '@/shared/api/query-keys'

export function useHealthQuery(config?: QueryConfig<HealthResponse>) {
  return useQuery({
    queryKey: queryKeys.health.detail(),
    queryFn: getHealth,
    staleTime: 1000 * 20,
    ...config,
  })
}
