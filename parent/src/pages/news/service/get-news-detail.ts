import { httpRequest } from '@/shared/api/http-client'

import type { NewsBlogDetailResponse } from '@/pages/news/types/news-page.types'

const PARENTS_BLOG_PATH = '/blog'

export function getNewsDetail(blogId: string): Promise<NewsBlogDetailResponse> {
  return httpRequest<NewsBlogDetailResponse>(`${PARENTS_BLOG_PATH}/${blogId}`)
}
