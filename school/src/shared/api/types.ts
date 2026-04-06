import type { AxiosRequestConfig } from 'axios'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiErrorPayload {
  message?: string
  code?: string
  details?: unknown
}

export class ApiError extends Error {
  public readonly payload?: ApiErrorPayload
  public readonly status: number

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export interface RequestConfig
  extends Omit<AxiosRequestConfig, 'baseURL' | 'data' | 'method' | 'params' | 'url'> {
  body?: unknown
  method?: HttpMethod
  query?: Record<string, string | number | boolean | undefined | null>
  token?: string
}
