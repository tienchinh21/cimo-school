import { useMemo, useState } from 'react'

import { PageTitleHeader } from '@/app/components/page-title-header'
import { AttendanceDayGroup } from '@/pages/attendance/components/attendance-day-group'
import { AttendanceFilterTabs } from '@/pages/attendance/components/attendance-filter-tabs'
import { AttendanceRequestCta } from '@/pages/attendance/components/attendance-request-cta'
import { AttendanceSummaryCard } from '@/pages/attendance/components/attendance-summary-card'
import { StudentSelectorCard } from '@/pages/attendance/components/student-selector-card'
import { useAttendancePage } from '@/pages/attendance/hooks/use-attendance-page'
import {
  attendanceFilterKeys,
  type AttendanceFilterKey,
  type AttendanceFilterItem,
} from '@/pages/attendance/types/attendance-page.types'

const attendanceFilters: AttendanceFilterItem[] = [
  { key: attendanceFilterKeys.TODAY, label: 'Hôm nay' },
  { key: attendanceFilterKeys.THIS_WEEK, label: 'Tuần này' },
  { key: attendanceFilterKeys.THIS_MONTH, label: 'Tháng này' },
  { key: attendanceFilterKeys.CUSTOM, label: 'Tùy chọn' },
]

export function AttendancePage() {
  const [activeFilter, setActiveFilter] = useState<AttendanceFilterKey>(attendanceFilterKeys.TODAY)
  const query = useAttendancePage()

  const groups = useMemo(() => query.data?.groups ?? [], [query.data?.groups])

  if (query.isLoading) {
    return <section className="mx-auto w-full max-w-3xl py-8 text-center text-muted-foreground">Đang tải điểm danh...</section>
  }

  if (query.isError || !query.data) {
    return (
      <section className="mx-auto w-full max-w-3xl py-8 text-center text-destructive">
        Không thể tải dữ liệu điểm danh.
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <PageTitleHeader title="Điểm danh" />

      <div className="mt-4 flex flex-col gap-4">
        <StudentSelectorCard student={query.data.student} />
        <AttendanceFilterTabs items={attendanceFilters} value={activeFilter} onChange={setActiveFilter} />
        <AttendanceSummaryCard
          updatedAtLabel={query.data.updatedAtLabel}
          attendanceRate={query.data.attendanceRate}
          stats={query.data.stats}
        />

        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <AttendanceDayGroup key={group.id} group={group} />
          ))}
        </div>
      </div>

      <AttendanceRequestCta />
    </section>
  )
}
