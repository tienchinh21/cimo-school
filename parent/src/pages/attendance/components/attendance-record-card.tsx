import { IconClockHour4 } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import type { AttendanceRecord } from '@/pages/attendance/types/attendance-page.types'
import { ATTENDANCE_STATUS_UI } from '@/pages/attendance/types/attendance-status-ui'
import { cn } from '@/shared/lib'

interface AttendanceRecordCardProps {
  record: AttendanceRecord
}

export function AttendanceRecordCard({ record }: AttendanceRecordCardProps) {
  const ui = ATTENDANCE_STATUS_UI[record.status]

  return (
    <article className={cn('ui-card rounded-2xl p-4', ui.borderClassName)}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-xl font-bold leading-none text-foreground">{record.sessionLabel}</h3>
        <Badge className={cn('rounded-full px-3 py-1 text-xs font-bold uppercase', ui.badgeClassName)}>
          {ui.label}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <IconClockHour4 className="size-4" />
        <span>{record.timeline}</span>
      </div>

      <div className="mt-3 rounded-lg bg-muted px-3 py-2">
        <p className="text-sm italic leading-relaxed text-muted-foreground">&quot;{record.note}&quot;</p>
      </div>
    </article>
  )
}
