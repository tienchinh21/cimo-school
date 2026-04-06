import { startTransition, useState } from 'react'

import { PageTitleHeader } from '@/app/components/page-title-header'
import { NewsView } from '@/pages/news/components/news-view'
import { useNewsFeed } from '@/pages/news/hooks/use-news-feed'
import type { NewsCategoryFilterValue } from '@/pages/news/types/news-page.types'

export function NewsPage() {
  const [category, setCategory] = useState<NewsCategoryFilterValue>(null)
  const newsQuery = useNewsFeed(category)

  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <PageTitleHeader title="Tin tức" />

      <div className="mt-4 flex flex-col gap-4">
        <NewsView
          category={category}
          errorMessage={newsQuery.isError ? newsQuery.errorMessage : undefined}
          hasNextPage={Boolean(newsQuery.hasNextPage)}
          isFetchingNextPage={newsQuery.isFetchingNextPage}
          isLoading={newsQuery.isPending}
          items={newsQuery.items}
          onCategoryChange={(nextCategory) => {
            startTransition(() => {
              setCategory(nextCategory)
            })
          }}
          onLoadMore={() => {
            void newsQuery.fetchNextPage()
          }}
          onRetry={() => {
            void newsQuery.refetch()
          }}
        />
      </div>
    </section>
  )
}
