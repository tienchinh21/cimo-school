import { httpRequest } from '@/shared/api/http-client'

import type { HealthResponse } from '@/pages/health/types/health-page.types'

export function getHealth() {
  return httpRequest<HealthResponse>('/health')
}
