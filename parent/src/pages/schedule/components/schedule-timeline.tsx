import { IconBuilding, IconCircleFilled, IconUser } from '@tabler/icons-react'

import type { SchedulePeriod, SchedulePeriodStatus } from '@/pages/schedule/types/schedule-page.types'
import { schedulePeriodStatuses } from '@/pages/schedule/types/schedule-page.types'
import { cn } from '@/shared/lib'

interface ScheduleTimelineProps {
  periods: SchedulePeriod[]
}

interface ScheduleStatusUi {
  lineClassName: string
  dotClassName: string
  cardClassName: string
  badgeClassName: string
  titleClassName?: string
  periodLabelClassName: string
}

const scheduleStatusUi: Record<SchedulePeriodStatus, ScheduleStatusUi> = {
  [schedulePeriodStatuses.ONGOING]: {
    lineClassName: 'border-primary',
    dotClassName: 'bg-primary ring-4 ring-primary/20',
    cardClassName: 'border-l-4 border-l-primary bg-card',
    badgeClassName: 'bg-red-100 text-red-600',
    periodLabelClassName: 'font-bold text-primary',
  },
  [schedulePeriodStatuses.NORMAL]: {
    lineClassName: 'border-border',
    dotClassName: 'bg-muted',
    cardClassName: 'border border-border bg-card',
    badgeClassName: 'bg-muted text-muted-foreground',
    periodLabelClassName: 'font-medium text-muted-foreground',
  },
  [schedulePeriodStatuses.ROOM_CHANGED]: {
    lineClassName: 'border-border',
    dotClassName: 'bg-muted',
    cardClassName: 'border border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/20',
    badgeClassName: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    periodLabelClassName: 'font-medium text-muted-foreground',
  },
  [schedulePeriodStatuses.CANCELED]: {
    lineClassName: 'border-border',
    dotClassName: 'bg-muted',
    cardClassName: 'border border-border bg-muted/40 opacity-70',
    badgeClassName: 'bg-muted text-muted-foreground',
    titleClassName: 'line-through text-muted-foreground',
    periodLabelClassName: 'font-medium text-muted-foreground',
  },
}

export function ScheduleTimeline({ periods }: ScheduleTimelineProps) {
  if (!periods.length) {
    return (
      <section className="ui-card p-4 text-sm text-muted-foreground">
        Chưa có dữ liệu lịch học cho bộ lọc hiện tại.
      </section>
    )
  }

  return (
    <section className="space-y-4">
      {periods.map((period) => {
        const ui = scheduleStatusUi[period.status]

        return (
          <article key={period.id} className={cn('relative border-l-2 pl-7', ui.lineClassName)}>
            <span
              className={cn(
                'absolute -left-[9px] top-1 block size-4 rounded-full border-4 border-background',
                ui.dotClassName,
              )}
            />
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <p className={cn('text-xs uppercase', ui.periodLabelClassName)}>{period.periodLabel}</p>
            </div>

            <div className={cn('rounded-2xl p-4 shadow-sm', ui.cardClassName)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {period.startTime} - {period.endTime}
                  </p>
                  <h3 className={cn('mt-1 text-lg font-bold text-foreground', ui.titleClassName)}>{period.subjectName}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <IconUser className="size-4" />
                    {period.teacherName}
                  </p>
                </div>
                <span className={cn('rounded px-2 py-1 text-[10px] font-bold uppercase', ui.badgeClassName)}>
                  {period.tagLabel}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <IconBuilding className="size-4" />
                  <span>{period.roomLabel}</span>
                </div>
                {period.status === schedulePeriodStatuses.ONGOING ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <IconCircleFilled className="size-2 animate-pulse" />
                    Đang diễn ra
                  </span>
                ) : null}
              </div>
              {period.note ? <p className="mt-2 text-xs italic text-muted-foreground">{period.note}</p> : null}
            </div>
          </article>
        )
      })}
    </section>
  )
}
