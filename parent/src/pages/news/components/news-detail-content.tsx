import { IconCalendarEvent, IconTags } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import {
  getNewsBadgeClassName,
} from '@/pages/news/news-page.utils'
import type { NewsArticleDetailViewModel } from '@/pages/news/types/news-page.types'
import { cn } from '@/shared/lib'

interface NewsDetailContentProps {
  detail: NewsArticleDetailViewModel
}

function NewsHeroFallback({ title }: { title: string }) {
  return (
    <div className="flex h-full min-h-72 items-center justify-center bg-linear-to-br from-blue-100 via-sky-50 to-white px-6 text-center text-xl font-bold text-blue-700">
      <span className="line-clamp-3">{title}</span>
    </div>
  )
}

export function NewsDetailContent({ detail }: NewsDetailContentProps) {
  return (
    <div className="space-y-4">
      <Card className="ui-card overflow-hidden p-0">
        {detail.images.length > 0 ? (
          <Carousel opts={{ align: 'start', loop: detail.images.length > 1 }} className="w-full">
            <CarouselContent className="-ml-0">
              {detail.images.map((imageUrl, index) => (
                <CarouselItem key={`${detail.id}-${index}`} className="pl-0">
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt={`${detail.title} - ảnh ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <NewsHeroFallback title={detail.title} />
        )}

        <div className="space-y-4 p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-bold',
                getNewsBadgeClassName(detail.category),
              )}
            >
              {detail.categoryLabel}
            </Badge>

            {detail.createdAtLabel ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <IconCalendarEvent className="size-4" />
                {detail.createdAtLabel}
              </span>
            ) : null}
          </div>

          <div>
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
              {detail.title}
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              {detail.summary}
            </p>
          </div>

          <div className="space-y-3 text-sm leading-7 text-foreground/90 md:text-base">
            {detail.description
              .split('\n')
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={`${detail.id}-paragraph-${index}`}>{paragraph}</p>
              ))}
          </div>
        </div>
      </Card>

      {detail.relateIds.length > 0 ? (
        <Card className="ui-card p-4 md:p-5">
          <div className="flex items-center gap-2">
            <IconTags className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Mã liên quan</h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.relateIds.map((relateId) => (
              <Badge key={relateId} variant="secondary" className="rounded-full px-3 py-1">
                {relateId}
              </Badge>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
