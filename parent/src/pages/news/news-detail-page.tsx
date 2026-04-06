import { useParams } from 'react-router-dom'

import { PageTitleHeader } from '@/app/components/page-title-header'
import { NewsDetailContent } from '@/pages/news/components/news-detail-content'
import { useNewsDetail } from '@/pages/news/hooks/use-news-detail'

export function NewsDetailPage() {
  const { blogId } = useParams<{ blogId: string }>()
  const query = useNewsDetail(blogId)

  if (query.isLoading) {
    return (
      <section className="mx-auto w-full max-w-3xl py-8 text-center text-muted-foreground">
        Đang tải chi tiết bài viết...
      </section>
    )
  }

  if (query.isError || !query.data) {
    return (
      <section className="mx-auto w-full max-w-3xl py-8 text-center text-destructive">
        Không thể tải chi tiết bài viết.
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <PageTitleHeader title="Chi tiết tin tức" backTo="/news" />

      <div className="mt-4">
        <NewsDetailContent detail={query.data} />
      </div>
    </section>
  )
}
