import { NotFoundView } from '@/pages/not-found/components/not-found-view'
import { useNotFoundPageContent } from '@/pages/not-found/hooks/use-not-found-page-content'

export function NotFoundPage() {
  const content = useNotFoundPageContent()

  return <NotFoundView content={content} />
}
