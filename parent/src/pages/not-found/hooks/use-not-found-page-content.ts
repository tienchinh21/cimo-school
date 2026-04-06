import type { NotFoundPageContent } from '@/pages/not-found/types/not-found-page.types'

export function useNotFoundPageContent(): NotFoundPageContent {
  return {
    title: '404',
    description: 'Page not found',
    actionLabel: 'Back to home',
  }
}
