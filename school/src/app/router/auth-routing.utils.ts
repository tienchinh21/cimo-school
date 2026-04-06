import type { Location } from 'react-router-dom'

export const DEFAULT_AUTHENTICATED_PATH = '/'
export const LOGIN_PATH = '/login'

type RedirectState = {
  from?: string
}

export function isLoginPath(pathname: string) {
  return pathname.startsWith(LOGIN_PATH)
}

export function getCurrentPath(location: Pick<Location, 'hash' | 'pathname' | 'search'>) {
  const target = `${location.pathname}${location.search}${location.hash}`

  if (!target.startsWith('/') || target.startsWith('//') || isLoginPath(target)) {
    return DEFAULT_AUTHENTICATED_PATH
  }

  return target
}

export function getRedirectPath(state: unknown) {
  const candidate = typeof state === 'object' && state !== null ? (state as RedirectState).from : undefined

  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//') || isLoginPath(candidate)) {
    return DEFAULT_AUTHENTICATED_PATH
  }

  return candidate
}
