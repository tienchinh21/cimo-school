import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { NewsFilterTabs } from '@/pages/news/components/news-filter-tabs'
import { NewsListItem } from '@/pages/news/components/news-list-item'
import { newsCategoryFilterItems } from '@/pages/news/news-page.utils'
import type { NewsArticleItemViewModel, NewsCategoryFilterValue } from '@/pages/news/types/news-page.types'

interface NewsViewProps {
  category: NewsCategoryFilterValue
  errorMessage?: string
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isLoading: boolean
  items: NewsArticleItemViewModel[]
  onCategoryChange: (value: NewsCategoryFilterValue) => void
  onLoadMore: () => void
  onRetry: () => void
}

function NewsListSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="ui-card p-3 md:p-4">
          <div className="grid grid-cols-[104px_1fr] gap-4 md:grid-cols-[148px_1fr]">
            <Skeleton className="h-28 rounded-2xl" />
            <div className="grid gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function NewsView({
  category,
  errorMessage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  items,
  onCategoryChange,
  onLoadMore,
  onRetry,
}: NewsViewProps) {
  return (
    <section className="space-y-4">
      <NewsFilterTabs items={newsCategoryFilterItems} value={category} onChange={onCategoryChange} />

      {isLoading ? <NewsListSkeleton /> : null}

      {!isLoading && errorMessage ? (
        <Card className="ui-card p-4">
          <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
          <p className="mt-1 text-xs text-muted-foreground">Bạn có thể thử tải lại danh sách tin tức.</p>
          <Button type="button" variant="secondary" className="mt-4" onClick={onRetry}>
            Thử lại
          </Button>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <Card className="ui-card p-4">
          <h2 className="text-base font-bold text-foreground">Chưa có bài viết phù hợp</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hãy thử chuyển sang nhóm tin khác hoặc quay lại sau.
          </p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <NewsListItem key={item.id} item={item} />
          ))}

          {hasNextPage ? (
            <div className="pt-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full rounded-2xl"
                disabled={isFetchingNextPage}
                onClick={onLoadMore}
              >
                {isFetchingNextPage ? 'Đang tải thêm...' : 'Xem thêm'}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
