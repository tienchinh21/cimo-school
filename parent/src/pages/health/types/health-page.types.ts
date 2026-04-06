export interface HealthItem {
  label: string
  value: string
}


export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down'
  service: string
  timestamp: string
}
