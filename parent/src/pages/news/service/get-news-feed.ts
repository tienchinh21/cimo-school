import { httpRequest } from '@/shared/api/http-client'

import type { NewsBlogResponse, NewsCategoryFilterValue } from '@/pages/news/types/news-page.types'

const PARENTS_BLOG_PATH = '/blog'

interface GetNewsFeedParams {
  category: NewsCategoryFilterValue
  limit: number
  skip: number
}

function buildNewsFilter({ category, limit, skip }: GetNewsFeedParams) {
  return JSON.stringify({
    limit,
    skip,
    where: category
      ? {
          category,
        }
      : undefined,
  })
}

export function getNewsFeed(params: GetNewsFeedParams): Promise<NewsBlogResponse[]> {
  return httpRequest<NewsBlogResponse[]>(PARENTS_BLOG_PATH, {
    query: {
      filter: buildNewsFilter(params),
    },
  })
}
