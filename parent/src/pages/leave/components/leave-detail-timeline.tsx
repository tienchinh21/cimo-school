import { IconCheck, IconClockHour4, IconInfoCircle, IconSend, IconX } from '@tabler/icons-react'

import { leaveActorRoles, type LeaveTimelineItem } from '@/pages/leave/types/leave-page.types'
import { cn } from '@/shared/lib'
import { LeaveStateCard } from '@/pages/leave/components/leave-page-state'

interface LeaveDetailTimelineProps {
  items: LeaveTimelineItem[]
}

const timelineRoleUi = {
  [leaveActorRoles.HOMEROOM_TEACHER]: {
    icon: IconCheck,
    iconWrapClassName: 'bg-green-500 text-white',
  },
  [leaveActorRoles.SYSTEM]: {
    icon: IconClockHour4,
    iconWrapClassName: 'bg-primary text-primary-foreground',
  },
  [leaveActorRoles.PARENT]: {
    icon: IconSend,
    iconWrapClassName: 'bg-muted text-muted-foreground',
  },
} as const

export function LeaveDetailTimeline({ items }: LeaveDetailTimelineProps) {
  if (items.length === 0) {
    return (
      <section className="space-y-4">
        <h3 className="px-2 text-[11px] font-bold uppercase text-muted-foreground">Lịch sử xử lý</h3>
        <LeaveStateCard
          title="Chưa có cập nhật xử lý"
          description="Nhà trường chưa gửi phản hồi nào cho đơn này. Tiến trình xử lý sẽ hiển thị tại đây khi có thay đổi."
          icon="empty"
        />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h3 className="px-2 text-[11px] font-bold uppercase text-muted-foreground">Lịch sử xử lý</h3>
      <article className="ui-card p-5">
        <div className="relative space-y-7 before:absolute before:bottom-0 before:left-3.25 before:top-0 before:w-0.5 before:bg-border">
          {items.map((item) => {
            const ui = timelineRoleUi[item.actorRole]
            const Icon = ui.icon

            return (
              <div key={item.id} className="relative flex items-start gap-5">
                <span
                  className={cn(
                    'z-10 flex size-7 items-center justify-center rounded-full border-4 border-background shadow-sm',
                    ui.iconWrapClassName,
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                    <span className="text-[10px] font-bold text-muted-foreground">{item.happenedAtLabel}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.actorLabel}</p>
                  {item.note ? (
                    <div
                      className={cn(
                        'mt-2 rounded-lg border-l-2 bg-secondary/40 px-3 py-2',
                        item.actorRole === leaveActorRoles.HOMEROOM_TEACHER ? 'border-blue-300' : 'border-border',
                      )}
                    >
                      {item.title.toLowerCase().includes('từ chối') ? (
                        <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-destructive">
                          <IconX className="size-3.5" />
                          Phản hồi từ nhà trường
                        </div>
                      ) : null}
                      <p className="text-xs italic text-foreground">
                        {item.title.toLowerCase().includes('từ chối') ? item.note : `“${item.note}”`}
                      </p>
                    </div>
                  ) : item.actorRole === leaveActorRoles.SYSTEM ? (
                    <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                      <IconInfoCircle className="size-4" />
                      Đơn đang được xử lý
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </article>
    </section>
  )
}
