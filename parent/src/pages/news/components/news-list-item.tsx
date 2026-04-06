import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  getNewsBadgeClassName,
} from '@/pages/news/news-page.utils'
import type { NewsArticleItemViewModel } from '@/pages/news/types/news-page.types'
import { cn } from '@/shared/lib'

interface NewsListItemProps {
  item: NewsArticleItemViewModel
}

function NewsImageFallback({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-100 via-sky-50 to-white px-4 text-center text-sm font-bold text-blue-700">
      <span className="line-clamp-3">{title}</span>
    </div>
  )
}

export function NewsListItem({ item }: NewsListItemProps) {
  return (
    <Card className="ui-card overflow-hidden p-0 transition-shadow hover:shadow-md">
      <Link to={`/news/${item.id}`} className="block">
        <article className="grid min-h-36 grid-cols-[104px_1fr] gap-4 p-3 md:grid-cols-[148px_1fr] md:p-4">
          <div className="overflow-hidden rounded-2xl bg-muted">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <NewsImageFallback title={item.title} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn('rounded-full border px-3 py-1 text-[11px] font-bold', getNewsBadgeClassName(item.category))}
              >
                {item.categoryLabel}
              </Badge>
            </div>

            <h2 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-foreground md:text-lg">
              {item.title}
            </h2>

            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {item.summary}
            </p>

            {item.description ? (
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/90 md:text-sm">
                {item.description}
              </p>
            ) : null}
          </div>
        </article>
      </Link>
    </Card>
  )
}
