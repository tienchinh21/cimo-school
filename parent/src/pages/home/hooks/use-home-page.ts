import { useQuery } from '@tanstack/react-query'

import { mapHomeBlogs } from '@/pages/home/home-page.utils'
import { getHomeBlogs } from '@/pages/home/service/get-home-blogs'
import type { HomeBlogsResponse } from '@/pages/home/service/home-api.types'
import type { HomeFeaturedNewsViewModel } from '@/pages/home/types/home-page.types'
import { queryKeys } from '@/shared/api/query-keys'

export function useHomeBlogs() {
  return useQuery<HomeBlogsResponse, Error, HomeFeaturedNewsViewModel[]>({
    queryKey: queryKeys.home.blogs(),
    queryFn: getHomeBlogs,
    staleTime: 1000 * 60 * 5,
    select: mapHomeBlogs,
  })
}
