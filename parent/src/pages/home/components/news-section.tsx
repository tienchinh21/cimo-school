import { Link } from 'react-router-dom'

import { Card } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { Skeleton } from '@/components/ui/skeleton'
import type { HomeFeaturedNewsViewModel } from '@/pages/home/types/home-page.types'

interface NewsSectionProps {
  items: HomeFeaturedNewsViewModel[]
  isLoading?: boolean
  errorMessage?: string
  onRetry?: () => void
}

function NewsSectionSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

export function NewsSection({ items, isLoading = false, errorMessage, onRetry }: NewsSectionProps) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold">Tin nổi bật</h2>
        <Link to="/news" className="text-sm font-semibold text-blue-600">
          Tất cả
        </Link>
      </div>

      {isLoading ? (
        <Card className="ui-card p-4">
          <NewsSectionSkeleton />
        </Card>
      ) : null}

      {!isLoading && errorMessage ? (
        <Card className="ui-card p-4">
          <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
          <p className="mt-1 text-xs text-muted-foreground">Bạn có thể thử tải lại danh sách tin tức.</p>
          {onRetry ? (
            <button type="button" onClick={onRetry} className="mt-3 text-sm font-semibold text-blue-600">
              Thử lại
            </button>
          ) : null}
        </Card>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <Card className="ui-card p-4">
          <p className="text-sm font-semibold text-foreground">Chưa có tin tức mới</p>
          <p className="mt-1 text-xs text-muted-foreground">Tin tức từ nhà trường sẽ hiển thị tại đây khi có dữ liệu.</p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && items.length > 0 ? (
        <Carousel opts={{ align: 'start' }} className="w-full">
          <CarouselContent>
            {items.map((item) => (
              <CarouselItem key={item.id} className="basis-[88%]">
                <Card className="ui-card h-full overflow-hidden p-0 transition-shadow hover:shadow-md">
                  <Link to={`/news/${item.id}`} className="block h-full">
                    {item.imageUrl ? (
                      <div className="h-40 w-full">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    <div className="p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{item.createdAtLabel}</span>
                      </div>
                      <h3 className="mb-2 text-sm font-bold leading-snug">{item.title}</h3>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{item.summary}</p>
                    </div>
                  </Link>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : null}
    </section>
  )
}
