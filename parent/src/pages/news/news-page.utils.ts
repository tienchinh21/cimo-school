import { ApiError } from '@/shared/api/types'

import type {
  NewsArticleDetailViewModel,
  NewsArticleItemViewModel,
  NewsBlogCategory,
  NewsBlogDetailResponse,
  NewsBlogResponse,
  NewsCategoryFilterItem,
  NewsCategoryFilterValue,
} from '@/pages/news/types/news-page.types'
import { newsBlogCategories } from '@/pages/news/types/news-page.types'

export const newsCategoryFilterItems: NewsCategoryFilterItem[] = [
  {
    label: 'Tất cả',
    value: null,
  },
  {
    label: 'Toàn trường',
    value: newsBlogCategories.ALL,
  },
  {
    label: 'Theo lớp',
    value: newsBlogCategories.CLASS,
  },
  {
    label: 'Theo học sinh',
    value: newsBlogCategories.STUDENT,
  },
]

const newsCategoryLabels: Record<NewsBlogCategory, string> = {
  [newsBlogCategories.ALL]: 'Toàn trường',
  [newsBlogCategories.CLASS]: 'Theo lớp',
  [newsBlogCategories.STUDENT]: 'Theo học sinh',
}

export const newsCategoryBadgeClassNames: Record<NewsBlogCategory, string> = {
  [newsBlogCategories.ALL]: 'border-blue-200 bg-blue-50 text-blue-700',
  [newsBlogCategories.CLASS]: 'border-amber-200 bg-amber-50 text-amber-700',
  [newsBlogCategories.STUDENT]: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

export function getNewsCategoryLabel(category: NewsCategoryFilterValue) {
  if (!category) {
    return 'Tất cả'
  }

  return newsCategoryLabels[category]
}

export function getNewsBadgeClassName(category: NewsCategoryFilterValue) {
  if (!category) {
    return 'border-slate-200 bg-slate-50 text-slate-700'
  }

  return newsCategoryBadgeClassNames[category]
}

export function normalizeNewsImageUrl(url?: string) {
  const trimmed = url?.trim() ?? ''

  if (!trimmed) {
    return ''
  }

  if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return trimmed.slice(1, -1).trim()
  }

  return trimmed.replaceAll('`', '').trim()
}

export function mapNewsArticle(item: NewsBlogResponse): NewsArticleItemViewModel {
  return {
    id: item.id,
    title: item.name,
    summary: item.sumary,
    description: item.description,
    imageUrl: normalizeNewsImageUrl(item.imgs[0]),
    category: item.category,
    categoryLabel: getNewsCategoryLabel(item.category),
    relateIds: item.relateIds ?? [],
  }
}

export function formatNewsDate(dateIso?: string) {
  if (!dateIso) {
    return ''
  }

  const date = new Date(dateIso)

  if (Number.isNaN(date.getTime())) {
    return dateIso
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function mapNewsDetail(item: NewsBlogDetailResponse): NewsArticleDetailViewModel {
  return {
    ...mapNewsArticle(item),
    createdAtLabel: formatNewsDate(item.createdDate),
    images: item.imgs.map((imageUrl) => normalizeNewsImageUrl(imageUrl)).filter(Boolean),
    updatedAtLabel: formatNewsDate(item.updatedDate),
  }
}

export function getNewsErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}
