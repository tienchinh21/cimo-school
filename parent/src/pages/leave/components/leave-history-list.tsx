import { IconAlertCircle, IconCircleCheckFilled, IconClockHour4, IconInfoCircle, IconX } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { leaveRequestStatuses, type LeaveRequestItem } from '@/pages/leave/types/leave-page.types'
import { cn } from '@/shared/lib'
import { LeaveStateCard } from '@/pages/leave/components/leave-page-state'

interface LeaveHistoryListProps {
  items: LeaveRequestItem[]
}

const leaveStatusUi = {
  [leaveRequestStatuses.APPROVED]: {
    icon: IconCircleCheckFilled,
    iconClassName: 'text-green-600',
    badgeClassName: 'bg-green-100 text-green-700',
  },
  [leaveRequestStatuses.PENDING]: {
    icon: IconClockHour4,
    iconClassName: 'text-orange-600',
    badgeClassName: 'bg-orange-100 text-orange-700',
  },
  [leaveRequestStatuses.REJECTED]: {
    icon: IconX,
    iconClassName: 'text-destructive',
    badgeClassName: 'bg-red-100 text-red-700',
  },
} as const

export function LeaveHistoryList({ items }: LeaveHistoryListProps) {
  if (items.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Lịch sử đơn nghỉ</h2>
          <span className="text-xs font-medium text-muted-foreground">Gần đây</span>
        </div>
        <LeaveStateCard
          title="Chưa có đơn nghỉ nào"
          description="Khi phụ huynh tạo đơn mới, lịch sử xét duyệt và phản hồi của nhà trường sẽ hiển thị ở đây."
          icon="empty"
        />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Lịch sử đơn nghỉ</h2>
        <span className="text-xs font-medium text-muted-foreground">Gần đây</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const ui = leaveStatusUi[item.status]
          const Icon = ui.icon

          return (
            <Link key={item.id} to={`/leave/${item.id}`} className="block">
              <article className="ui-card rounded-3xl p-4 transition-colors hover:bg-accent/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Icon className={cn('size-4 shrink-0', ui.iconClassName)} />
                      <h3 className="truncate text-sm font-bold text-foreground">{item.title}</h3>
                    </div>
                    <p className="line-clamp-2 text-sm italic text-muted-foreground">&quot;{item.reason}&quot;</p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase', ui.badgeClassName)}>
                    {item.statusLabel}
                  </span>
                </div>

                <div className="mt-3 border-t border-border pt-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{item.submittedAtLabel}</p>
                      {item.reviewerLabel ? <p className="mt-1 text-xs font-medium text-muted-foreground">{item.reviewerLabel}</p> : null}
                    </div>
                    <span className="text-xs font-semibold text-primary">Xem chi tiết</span>
                  </div>
                  {item.feedback ? (
                    <div className="mt-2 rounded-xl border border-red-200/60 bg-red-50 px-3 py-2">
                      <div className="flex items-start gap-2">
                        <IconInfoCircle className="mt-0.5 size-4 text-red-600" />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-red-700">Phản hồi từ nhà trường</p>
                          <p className="mt-1 text-xs text-red-700">{item.feedback}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {item.status === leaveRequestStatuses.PENDING ? (
                    <div className="mt-2 flex items-center gap-1 text-xs font-medium text-orange-700">
                      <IconAlertCircle className="size-4" />
                      Đang chờ giáo viên xác nhận
                    </div>
                  ) : null}
                </div>
              </article>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
