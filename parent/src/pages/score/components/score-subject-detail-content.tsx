import {
  IconArrowNarrowUp,
  IconCalendarEvent,
  IconEdit,
  IconMathFunction,
  IconMessageCircle2,
  IconSquareRoot2,
} from '@tabler/icons-react'

import type { ScoreSubjectDetail } from '@/pages/score/types/score-page.types'
import { cn } from '@/shared/lib'

interface ScoreSubjectDetailContentProps {
  detail: ScoreSubjectDetail
}

const assessmentIconMap = {
  'Kiểm tra Đại số': IconEdit,
  'Kiểm tra Hình học': IconSquareRoot2,
  'Định lý Pythagoras': IconMathFunction,
} as const

export function ScoreSubjectDetailContent({ detail }: ScoreSubjectDetailContentProps) {
  const groupedAssessments = detail.assessments.reduce<Record<string, typeof detail.assessments>>((acc, item) => {
    if (!acc[item.categoryLabel]) {
      acc[item.categoryLabel] = []
    }
    acc[item.categoryLabel].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4">
        <article className="col-span-1 flex aspect-square flex-col justify-between rounded-2xl bg-primary p-6 text-primary-foreground md:h-40 md:aspect-auto">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Điểm trung bình</span>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-extrabold tracking-tighter">{detail.averageScore.toFixed(1)}</span>
            <span className="text-sm font-medium opacity-80">/10</span>
          </div>
        </article>

        <article className="ui-card col-span-1 flex aspect-square flex-col justify-between p-6 md:h-40 md:aspect-auto">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Xếp loại</span>
            <IconArrowNarrowUp className="size-5 text-green-500" />
          </div>
          <div>
            <span className="text-3xl font-extrabold tracking-tight text-foreground">{detail.rankLabel}</span>
            <p className="text-[10px] font-bold uppercase text-green-600">{detail.rankDetailLabel}</p>
          </div>
        </article>
      </section>

      <section className="space-y-7">
        {Object.entries(groupedAssessments).map(([categoryLabel, items]) => (
          <div key={categoryLabel} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-6 w-1 rounded-full bg-primary" />
                <h2 className="text-lg font-bold tracking-tight text-foreground">{categoryLabel}</h2>
              </div>
              <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                {items[0]?.weightLabel}
              </span>
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const Icon = assessmentIconMap[item.title as keyof typeof assessmentIconMap] ?? IconEdit

                return (
                  <article key={item.id} className="ui-card flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-50">
                        <Icon className="size-6 text-blue-600" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                        <p className="text-xs text-muted-foreground">{item.dateLabel}</p>
                      </div>
                    </div>
                    <span className="text-2xl font-extrabold tracking-tighter text-blue-600">{item.score.toFixed(1)}</span>
                  </article>
                )
              })}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {detail.exams.map((exam) => (
            <article
              key={exam.id}
              className={cn(
                'space-y-4 rounded-2xl p-5 shadow-sm',
                exam.isPrimary ? 'bg-blue-900 text-white shadow-md' : 'bg-card text-foreground',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('text-[10px] font-bold uppercase', exam.isPrimary ? 'text-blue-200' : 'text-muted-foreground')}>
                  {exam.isPrimary ? 'Cuối kỳ (HS 3)' : 'Giữa kỳ (HS 2)'}
                </span>
                <IconCalendarEvent className={cn('size-4', exam.isPrimary ? 'text-blue-300' : 'text-muted-foreground')} />
              </div>
              <div>
                <p className={cn('text-xs', exam.isPrimary ? 'text-blue-200' : 'text-muted-foreground')}>{exam.dateLabel}</p>
                <h3 className="text-lg font-bold">{exam.title}</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={cn('text-4xl font-extrabold tracking-tighter', exam.isPrimary ? 'text-white' : 'text-blue-600')}>
                  {exam.score.toFixed(1)}
                </span>
                <span className={cn('text-xs font-bold uppercase', exam.isPrimary ? 'text-green-400' : 'text-muted-foreground')}>
                  {exam.highlightLabel}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-orange-200/60 bg-orange-50/50 p-6">
        <div className="flex items-center gap-3">
          <img src={detail.teacherComment.teacherAvatarUrl} alt={detail.teacherComment.teacherName} className="size-12 rounded-full border-2 border-white object-cover shadow-sm" />
          <div>
            <h4 className="font-bold text-foreground">{detail.teacherComment.teacherName}</h4>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">{detail.teacherComment.teacherRoleLabel}</p>
          </div>
          <span className="ml-auto rounded-full bg-white p-1.5 text-orange-500">
            <IconMessageCircle2 className="size-4" />
          </span>
        </div>
        <p className="mt-4 pl-4 text-sm italic leading-relaxed text-orange-900">“{detail.teacherComment.content}”</p>
      </section>
    </div>
  )
}
