import { httpRequest } from '@/shared/api/http-client'

import type { HomeBlogsResponse } from '@/pages/home/service/home-api.types'

const HOME_BLOGS_PATH = '/home/blogs'

export function getHomeBlogs(): Promise<HomeBlogsResponse> {
  return httpRequest<HomeBlogsResponse>(HOME_BLOGS_PATH)
}
