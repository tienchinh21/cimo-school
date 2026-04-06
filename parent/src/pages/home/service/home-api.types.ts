export interface HomeBlogResponse {
  id: string
  createdDate: string
  name: string
  sumary: string
  imgs: string[]
}

export type HomeBlogsResponse = HomeBlogResponse[]
