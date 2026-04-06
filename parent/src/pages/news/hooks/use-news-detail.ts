import { useQuery } from '@tanstack/react-query'

import { mapNewsDetail } from '@/pages/news/news-page.utils'
import { getNewsDetail } from '@/pages/news/service/get-news-detail'
import type { NewsArticleDetailViewModel, NewsBlogDetailResponse } from '@/pages/news/types/news-page.types'
import { queryKeys } from '@/shared/api/query-keys'

export function useNewsDetail(blogId: string | undefined) {
  return useQuery<NewsBlogDetailResponse, Error, NewsArticleDetailViewModel>({
    queryKey: queryKeys.news.detail(blogId ?? 'unknown'),
    queryFn: () => getNewsDetail(blogId ?? ''),
    enabled: Boolean(blogId),
    staleTime: 1000 * 60 * 5,
    select: mapNewsDetail,
  })
}
