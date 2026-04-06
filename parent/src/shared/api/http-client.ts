import axios, { AxiosHeaders } from 'axios'

import { API_BASE_URL } from '@/shared/api/env'
import { ApiError, type ApiErrorPayload, type RequestConfig } from '@/shared/api/types'

type PersistedAuthState = {
  state?: {
    token?: string | null
  }
}

type AxiosRequestWithToken = RequestConfig & {
  token?: string
}

const AUTH_STORAGE_KEY = 'parent-auth'

const httpClient = axios.create({
  baseURL: API_BASE_URL,
})

function getStoredToken() {
  if (typeof window === 'undefined') {
    return null
  }

  const rawState = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawState) {
    return null
  }

  try {
    const parsedState = JSON.parse(rawState) as PersistedAuthState
    const token = parsedState.state?.token

    return typeof token === 'string' && token.trim() ? token.trim() : null
  } catch {
    return null
  }
}

function getApiErrorPayload(data: unknown) {
  if (!data || typeof data !== 'object') {
    return undefined
  }

  return data as ApiErrorPayload
}

httpClient.interceptors.request.use((config) => {
  const requestHeaders = AxiosHeaders.from(config.headers)
  const token = (config as AxiosRequestWithToken).token?.trim() || getStoredToken()

  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  config.headers = requestHeaders

  return config
})

export async function httpRequest<T>(path: string, config: RequestConfig = {}): Promise<T> {
  const { method = 'GET', body, query, token, ...restConfig } = config

  try {
    const response = await httpClient.request<T>({
      ...restConfig,
      url: path,
      method,
      data: body,
      params: query,
      token,
    } as AxiosRequestWithToken)

    if (response.status === 204) {
      return undefined as T
    }

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = getApiErrorPayload(error.response?.data)

      throw new ApiError(
        error.response?.status ?? 0,
        payload?.message || error.response?.statusText || error.message || 'Request failed',
        payload,
      )
    }

    throw error
  }
}
