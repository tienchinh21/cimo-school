import { IconChevronDown } from '@tabler/icons-react'
import { useState } from 'react'

import { ATTENDANCE_STATUS_UI } from '@/pages/attendance/types/attendance-status-ui'
import type { AttendanceSummaryStat } from '@/pages/attendance/types/attendance-page.types'
import { cn } from '@/shared/lib'

interface AttendanceSummaryCardProps {
  updatedAtLabel: string
  attendanceRate: number
  stats: AttendanceSummaryStat[]
}

export function AttendanceSummaryCard({ updatedAtLabel, attendanceRate, stats }: AttendanceSummaryCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  return (
    <section className="ui-card">
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left md:p-5"
        aria-label={isCollapsed ? 'Mở tóm tắt điểm danh' : 'Thu gọn tóm tắt điểm danh'}
      >
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground md:text-base">Tỷ lệ chuyên cần</p>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground md:text-sm">Cập nhật lúc: {updatedAtLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-sm font-bold text-foreground">{attendanceRate}%</span>
          <IconChevronDown
            className={cn('size-5 text-muted-foreground transition-transform duration-300', !isCollapsed && 'rotate-180')}
          />
        </div>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out',
          isCollapsed ? 'max-h-0 -translate-y-1 opacity-0' : 'max-h-130 translate-y-0 opacity-100',
        )}
      >
        <div className="px-4 pb-4 md:px-5 md:pb-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map((stat) => {
              const ui = ATTENDANCE_STATUS_UI[stat.status]

              return (
                <div
                  key={stat.id}
                  className={cn(
                    'rounded-2xl px-3 py-3 text-center shadow-xs ring-1 ring-inset ring-black/5 dark:ring-white/10',
                    ui.statClassName,
                  )}
                >
                  <p className="text-2xl font-bold leading-none tracking-tight">{String(stat.count).padStart(2, '0')}</p>
                  <p className="mt-1 text-xs font-semibold">{stat.shortLabel}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
