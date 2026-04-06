import { IconCheck, IconClockHour4, IconX } from '@tabler/icons-react'

import { leaveRequestStatuses, type LeaveRequestDetail } from '@/pages/leave/types/leave-page.types'
import { cn } from '@/shared/lib'

interface LeaveDetailStatusBannerProps {
  detail: LeaveRequestDetail
}

export function LeaveDetailStatusBanner({ detail }: LeaveDetailStatusBannerProps) {
  const statusUi =
    detail.status === leaveRequestStatuses.APPROVED
      ? {
          borderClassName: 'border-l-green-500',
          iconWrapClassName: 'bg-green-50 text-green-600',
          textClassName: 'text-green-600',
          icon: IconCheck,
        }
      : detail.status === leaveRequestStatuses.PENDING
        ? {
            borderClassName: 'border-l-orange-500',
            iconWrapClassName: 'bg-orange-50 text-orange-600',
            textClassName: 'text-orange-600',
            icon: IconClockHour4,
          }
        : {
            borderClassName: 'border-l-destructive',
            iconWrapClassName: 'bg-red-50 text-red-600',
            textClassName: 'text-destructive',
            icon: IconX,
          }

  const Icon = statusUi.icon

  return (
    <section
      className={cn(
        'ui-card flex flex-col gap-4 border-l-4 p-4 sm:flex-row sm:items-center sm:justify-between',
        statusUi.borderClassName,
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex size-10 items-center justify-center rounded-full', statusUi.iconWrapClassName)}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Trạng thái</p>
          <p className={cn('text-lg font-bold uppercase tracking-tight', statusUi.textClassName)}>{detail.statusLabel}</p>
        </div>
      </div>

      <div className="pl-13 text-left sm:pl-0 sm:text-right">
        <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Mã đơn</p>
        <p className="text-sm font-bold text-foreground">#{detail.requestCode}</p>
      </div>
    </section>
  )
}
