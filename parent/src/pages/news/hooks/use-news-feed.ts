import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useAuthUser } from '@/app/contexts/AuthContext'
import {
  getNewsErrorMessage,
  mapNewsArticle,
} from '@/pages/news/news-page.utils'
import { getNewsFeed } from '@/pages/news/service/get-news-feed'
import type { NewsArticleItemViewModel, NewsBlogResponse, NewsCategoryFilterValue } from '@/pages/news/types/news-page.types'
import { queryKeys } from '@/shared/api/query-keys'

const NEWS_PAGE_SIZE = 10

export function useNewsFeed(category: NewsCategoryFilterValue) {
  const user = useAuthUser()

  const query = useInfiniteQuery<
    NewsBlogResponse[],
    Error,
    InfiniteData<NewsBlogResponse[], number>,
    ReturnType<typeof queryKeys.news.list>,
    number
  >({
    queryKey: queryKeys.news.list(category ?? 'null'),
    queryFn: ({ pageParam }) =>
      getNewsFeed({
        category,
        limit: NEWS_PAGE_SIZE,
        skip: pageParam * NEWS_PAGE_SIZE,
      }),
    enabled: Boolean(user),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < NEWS_PAGE_SIZE) {
        return undefined
      }

      return lastPageParam + 1
    },
    staleTime: 1000 * 60 * 5,
  })

  const items = useMemo<NewsArticleItemViewModel[]>(
    () => query.data?.pages.flatMap((page) => page.map(mapNewsArticle)) ?? [],
    [query.data],
  )

  return {
    ...query,
    errorMessage: getNewsErrorMessage(query.error, 'Không thể tải danh sách tin tức'),
    items,
  }
}
