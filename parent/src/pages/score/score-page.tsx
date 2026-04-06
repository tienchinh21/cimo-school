import { useState } from 'react'

import { ScoreOverviewCard } from '@/pages/score/components/score-overview-card'
import { ScoreSubjectList } from '@/pages/score/components/score-subject-list'
import { ScoreTermTabs } from '@/pages/score/components/score-term-tabs'
import { useScorePage } from '@/pages/score/hooks/use-score-page'
import { scoreTermKeys, type ScoreTermKey } from '@/pages/score/types/score-page.types'

export function ScorePage() {
  const [activeTerm, setActiveTerm] = useState<ScoreTermKey>(scoreTermKeys.TERM_1)
  const query = useScorePage()

  if (query.isLoading) {
    return <section className="mx-auto w-full max-w-3xl py-8 text-center text-muted-foreground">Đang tải dữ liệu điểm số...</section>
  }

  if (query.isError || !query.data) {
    return (
      <section className="mx-auto w-full max-w-3xl py-8 text-center text-destructive">
        Không thể tải dữ liệu điểm số.
      </section>
    )
  }

  const termData = query.data.terms[activeTerm]

  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <div className="sticky top-0 z-30 -mx-4 -mt-8 border-b border-border bg-background/95 px-4 pb-3 pt-10 backdrop-blur-sm md:-mx-6 md:-mt-10 md:px-6 md:pt-11">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={query.data.student.avatarUrl}
                alt={query.data.student.name}
                className="size-10 rounded-full border-2 border-primary object-cover"
              />
              <span className="absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-background bg-green-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-foreground">{query.data.student.name}</h1>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{query.data.student.grade}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-6">
        <ScoreTermTabs value={activeTerm} onChange={setActiveTerm} />
        <ScoreOverviewCard overview={termData.overview} />
        <ScoreSubjectList subjects={termData.subjects} />
      </div>
    </section>
  )
}
