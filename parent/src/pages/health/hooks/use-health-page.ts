import { useMemo } from 'react'

import { useHealthQuery } from '@/pages/health/hooks/use-health-query'
import type { HealthItem } from '@/pages/health/types/health-page.types'
import { ApiError } from '@/shared/api/types'

export function useHealthPage() {
  const query = useHealthQuery()

  const items = useMemo<HealthItem[]>(() => {
    if (!query.data) {
      return []
    }

    return [
      { label: 'Service', value: query.data.service },
      { label: 'Status', value: query.data.status.toUpperCase() },
      { label: 'Timestamp', value: new Date(query.data.timestamp).toLocaleString() },
    ]
  }, [query.data])

  const errorMessage =
    query.error instanceof ApiError
      ? `${query.error.message} (status ${query.error.status})`
      : 'Failed to fetch health status'

  return {
    ...query,
    items,
    errorMessage,
  }
}
