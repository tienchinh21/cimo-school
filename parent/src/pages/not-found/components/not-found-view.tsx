import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import type { NotFoundPageContent } from '@/pages/not-found/types/not-found-page.types'

interface NotFoundViewProps {
  content: NotFoundPageContent
}

export function NotFoundView({ content }: NotFoundViewProps) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
      <h2 className="text-3xl font-semibold tracking-tight">{content.title}</h2>
      <p className="text-muted-foreground">{content.description}</p>
      <Button asChild variant="secondary">
        <Link to="/">{content.actionLabel}</Link>
      </Button>
    </section>
  )
}
