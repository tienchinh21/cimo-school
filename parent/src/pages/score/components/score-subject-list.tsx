import {
  IconBook2,
  IconChevronRight,
  IconFlask,
  IconMathFunction,
  IconPlanet,
  IconWorld,
} from '@tabler/icons-react'
import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'

import { scoreSubjectStates, type ScoreSubjectItem } from '@/pages/score/types/score-page.types'
import { cn } from '@/shared/lib'

interface ScoreSubjectListProps {
  subjects: ScoreSubjectItem[]
}

interface SubjectUi {
  icon: ComponentType<{ className?: string }>
  iconWrapClassName: string
  iconClassName: string
}

const subjectUiMap: Record<string, SubjectUi> = {
  Toán: {
    icon: IconMathFunction,
    iconWrapClassName: 'bg-blue-50',
    iconClassName: 'text-blue-600',
  },
  'Tiếng Việt': {
    icon: IconBook2,
    iconWrapClassName: 'bg-orange-50',
    iconClassName: 'text-orange-600',
  },
  'Tiếng Anh': {
    icon: IconWorld,
    iconWrapClassName: 'bg-purple-50',
    iconClassName: 'text-purple-600',
  },
  'Khoa học': {
    icon: IconFlask,
    iconWrapClassName: 'bg-teal-50',
    iconClassName: 'text-teal-600',
  },
  'Lịch sử & Địa lý': {
    icon: IconPlanet,
    iconWrapClassName: 'bg-amber-50',
    iconClassName: 'text-amber-600',
  },
}

const stateUi = {
  [scoreSubjectStates.GOOD]: {
    label: 'Tốt',
    className: 'bg-green-50 text-green-700',
  },
  [scoreSubjectStates.STABLE]: {
    label: 'Ổn định',
    className: 'bg-muted text-muted-foreground',
  },
  [scoreSubjectStates.NEED_ATTENTION]: {
    label: 'Cần chú ý',
    className: 'bg-red-50 text-red-700',
  },
} as const

export function ScoreSubjectList({ subjects }: ScoreSubjectListProps) {
  if (!subjects.length) {
    return <section className="ui-card p-4 text-sm text-muted-foreground">Chưa có điểm cho học kỳ này.</section>
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Chi tiết môn học</h2>
        <span className="text-[10px] font-bold text-primary">{subjects.length} Môn học</span>
      </div>

      <div className="space-y-3">
        {subjects.map((subject) => {
          const subjectUi = subjectUiMap[subject.name] ?? {
            icon: IconBook2,
            iconWrapClassName: 'bg-muted',
            iconClassName: 'text-muted-foreground',
          }
          const state = stateUi[subject.state]
          const Icon = subjectUi.icon

          return (
            <Link key={subject.id} to={`/score/subject/${subject.id}`} className="block">
              <article className="ui-card flex cursor-pointer items-center justify-between gap-3 p-4 transition-shadow active:scale-[0.99]">
              <div className="flex items-center gap-4">
                <span className={cn('flex size-12 items-center justify-center rounded-2xl', subjectUi.iconWrapClassName)}>
                  <Icon className={cn('size-6', subjectUi.iconClassName)} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">{subject.name}</h3>
                  <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', state.className)}>
                    {state.label}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xl font-extrabold text-foreground">{subject.score.toFixed(1)}</p>
                <IconChevronRight className="ml-auto size-4 text-muted-foreground" />
              </div>
              </article>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
