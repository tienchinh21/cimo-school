import { IconAlertTriangleFilled, IconClockHour4, IconLogout } from '@tabler/icons-react'

import type { ScheduleDayOverview } from '@/pages/schedule/types/schedule-page.types'

interface ScheduleOverviewCardProps {
  overview: ScheduleDayOverview
}

export function ScheduleOverviewCard({ overview }: ScheduleOverviewCardProps) {
  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-700 p-5 text-primary-foreground shadow-xl shadow-primary/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary-foreground/80">Tổng quan ngày học</p>
          <p className="text-2xl font-bold">{overview.periodCount} tiết học</p>
        </div>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
          {overview.semesterLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <IconClockHour4 className="size-4" />
          <span className="text-sm font-medium">Bắt đầu: {overview.startAt}</span>
        </div>
        <div className="flex items-center gap-2">
          <IconLogout className="size-4" />
          <span className="text-sm font-medium">Kết thúc: {overview.endAt}</span>
        </div>
      </div>

      {overview.alertMessage ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-orange-200/40 bg-orange-300/20 px-3 py-2.5">
          <IconAlertTriangleFilled className="size-4 text-orange-100" />
          <p className="text-xs font-medium text-orange-50">{overview.alertMessage}</p>
        </div>
      ) : null}
    </section>
  )
}
