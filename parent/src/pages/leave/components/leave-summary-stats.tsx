import { leaveRequestStatuses, type LeaveSummaryStat } from '@/pages/leave/types/leave-page.types'
import { cn } from '@/shared/lib'
import { LeaveStateCard } from '@/pages/leave/components/leave-page-state'

interface LeaveSummaryStatsProps {
  stats: LeaveSummaryStat[]
}

export function LeaveSummaryStats({ stats }: LeaveSummaryStatsProps) {
  if (stats.length === 0) {
    return (
      <LeaveStateCard
        title="Chưa có thống kê đơn nghỉ"
        description="Khi phụ huynh gửi đơn, số liệu tổng hợp sẽ xuất hiện tại đây để theo dõi nhanh."
        icon="empty"
      />
    )
  }

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const toneClassName =
          stat.status === leaveRequestStatuses.PENDING
            ? 'text-orange-600'
            : stat.status === leaveRequestStatuses.APPROVED
              ? 'text-green-600'
              : stat.status === leaveRequestStatuses.REJECTED
                ? 'text-destructive'
                : 'text-foreground'

        return (
          <article key={stat.id} className="ui-card flex min-h-20 flex-col items-center justify-center px-3 py-3 text-center">
            <span className={cn('text-[10px] font-bold uppercase tracking-wide', toneClassName)}>{stat.label}</span>
            <span className={cn('mt-1 text-2xl font-extrabold leading-none', toneClassName)}>{stat.count}</span>
          </article>
        )
      })}
    </section>
  )
}
