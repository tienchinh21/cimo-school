export const newsBlogCategories = {
  ALL: 'all',
  CLASS: 'class',
  STUDENT: 'student',
} as const

export type NewsBlogCategory = (typeof newsBlogCategories)[keyof typeof newsBlogCategories]
export type NewsCategoryFilterValue = NewsBlogCategory | null

export interface NewsBlogResponse {
  id: string
  createdDate?: string
  updatedDate?: string
  name: string
  sumary: string
  imgs: string[]
  description: string
  category: NewsBlogCategory | null
  relateIds: string[] | null
}

export interface NewsBlogDetailResponse extends NewsBlogResponse {
  createdBy?: string
  updatedBy?: string
  isDeleted?: boolean
}

export interface NewsCategoryFilterItem {
  label: string
  value: NewsCategoryFilterValue
}

export interface NewsArticleItemViewModel {
  id: string
  title: string
  summary: string
  description: string
  imageUrl: string
  category: NewsCategoryFilterValue
  categoryLabel: string
  relateIds: string[]
}

export interface NewsArticleDetailViewModel extends NewsArticleItemViewModel {
  createdAtLabel: string
  images: string[]
  updatedAtLabel?: string
}
