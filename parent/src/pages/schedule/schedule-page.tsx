import { useMemo, useState } from 'react'

import { PageTitleHeader } from '@/app/components/page-title-header'
import { StudentSelectorCard } from '@/pages/attendance/components/student-selector-card'
import { ScheduleFilterTabs } from '@/pages/schedule/components/schedule-filter-tabs'
import { ScheduleOverviewCard } from '@/pages/schedule/components/schedule-overview-card'
import { ScheduleTimeline } from '@/pages/schedule/components/schedule-timeline'
import { useSchedulePage } from '@/pages/schedule/hooks/use-schedule-page'
import {
  scheduleFilterKeys,
  type ScheduleFilterItem,
  type ScheduleFilterKey,
} from '@/pages/schedule/types/schedule-page.types'

const scheduleFilters: ScheduleFilterItem[] = [
  { key: scheduleFilterKeys.TODAY, label: 'Thứ Hai', helper: 'Hôm nay' },
  { key: scheduleFilterKeys.TOMORROW, label: 'Thứ Ba', helper: 'Ngày mai' },
  { key: scheduleFilterKeys.THIS_WEEK, label: 'Tuần này', helper: 'Trong' },
  { key: scheduleFilterKeys.CUSTOM, label: 'Lịch khác', helper: 'Tùy chọn' },
]

export function SchedulePage() {
  const [activeFilter, setActiveFilter] = useState<ScheduleFilterKey>(scheduleFilterKeys.TODAY)
  const query = useSchedulePage()

  const currentDay = useMemo(() => {
    if (!query.data) {
      return null
    }

    return query.data.days[activeFilter]
  }, [activeFilter, query.data])

  if (query.isLoading) {
    return <section className="mx-auto w-full max-w-3xl py-8 text-center text-muted-foreground">Đang tải thời khóa biểu...</section>
  }

  if (query.isError || !query.data || !currentDay) {
    return (
      <section className="mx-auto w-full max-w-3xl py-8 text-center text-destructive">
        Không thể tải dữ liệu thời khóa biểu.
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <PageTitleHeader title="Lịch học" />

      <div className="mt-4 flex flex-col gap-4">
        <StudentSelectorCard student={query.data.student} />
        <ScheduleFilterTabs items={scheduleFilters} value={activeFilter} onChange={setActiveFilter} />
        <h2 className="text-xl font-bold text-foreground">{currentDay.dateLabel}</h2>
        <ScheduleOverviewCard overview={currentDay.overview} />
        <ScheduleTimeline periods={currentDay.periods} />
      </div>
    </section>
  )
}
