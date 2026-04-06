import { IconShare2 } from '@tabler/icons-react'
import { useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { PageTitleHeader } from '@/app/components/page-title-header'
import { ScoreSubjectDetailContent } from '@/pages/score/components/score-subject-detail-content'
import { useScoreSubjectDetail } from '@/pages/score/hooks/use-score-subject-detail'

export function ScoreSubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const query = useScoreSubjectDetail(subjectId)

  if (query.isLoading) {
    return <section className="mx-auto w-full max-w-3xl py-8 text-center text-muted-foreground">Đang tải chi tiết môn học...</section>
  }

  if (query.isError || !query.data) {
    return (
      <section className="mx-auto w-full max-w-3xl py-8 text-center text-destructive">
        Không thể tải chi tiết môn học.
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <PageTitleHeader
        title={`Chi tiết môn ${query.data.subjectName}`}
        backTo="/score"
        rightAction={
          <Button type="button" variant="secondary" size="icon" className="size-10 rounded-full">
            <IconShare2 />
          </Button>
        }
      />

      <div className="mt-4">
        <ScoreSubjectDetailContent detail={query.data} />
      </div>
    </section>
  )
}
