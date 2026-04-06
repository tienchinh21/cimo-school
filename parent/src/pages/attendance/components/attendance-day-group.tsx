import { AttendanceRecordCard } from '@/pages/attendance/components/attendance-record-card'
import type { AttendanceDayGroup as AttendanceDayGroupData } from '@/pages/attendance/types/attendance-page.types'

interface AttendanceDayGroupProps {
  group: AttendanceDayGroupData
}

export function AttendanceDayGroup({ group }: AttendanceDayGroupProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-xl font-bold uppercase tracking-[0.02em] text-slate-400">{group.heading}</h2>
      <div className="flex flex-col gap-3">
        {group.records.map((record) => (
          <AttendanceRecordCard key={record.id} record={record} />
        ))}
      </div>
    </section>
  )
}
