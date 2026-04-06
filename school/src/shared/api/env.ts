const apiBaseUrlFromEnv = import.meta.env.VITE_API_BASE_URL?.trim()
const runtimeApiBaseUrl =
  typeof window !== 'undefined'
    ? (window as Window & { __CIMO_API_BASE_URL?: string }).__CIMO_API_BASE_URL?.trim()
    : undefined

// Vercel production fallback to avoid broken API calls when env is missing.
const defaultApiBaseUrl = import.meta.env.DEV ? '/api' : 'https://api.cimoschool.xyz'

export const API_BASE_URL = apiBaseUrlFromEnv || runtimeApiBaseUrl || defaultApiBaseUrl

const absoluteUrlPattern = /^[a-z][a-z\d+\-.]*:\/\//i

export function toApiAssetUrl(value?: string | null) {
  const input = value?.trim()
  if (!input) {
    return undefined
  }

  if (absoluteUrlPattern.test(input) || input.startsWith('data:') || input.startsWith('blob:')) {
    return input
  }

  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  const path = input.startsWith('/') ? input : `/${input}`

  return `${baseUrl}${path}`
}
