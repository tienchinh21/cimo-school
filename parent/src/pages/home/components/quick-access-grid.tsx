import {
  IconCalendarCheck,
  IconCalendarClock,
  IconCalendarX,
  IconStar,
} from '@tabler/icons-react'
import type { ComponentType, SVGProps } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/shared/lib'

interface QuickAccessItem {
  id: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone: string
  to: string
}

const quickEntry: QuickAccessItem[] = [
  { id: 'score', label: 'Xem điểm', icon: IconStar, tone: 'bg-blue-50 text-blue-600', to: '/score' },
  { id: 'attendance', label: 'Điểm danh', icon: IconCalendarCheck, tone: 'bg-green-50 text-green-600', to: '/attendance' },
  { id: 'leave', label: 'Nghỉ học', icon: IconCalendarX, tone: 'bg-purple-50 text-purple-600', to: '/leave' },
  { id: 'timetable', label: 'Thời khóa biểu', icon: IconCalendarClock, tone: 'bg-orange-50 text-orange-600', to: '/schedule' },
]

export function QuickAccessGrid() {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-base font-bold">Truy cập nhanh</h2>
      <div className="grid grid-cols-4 gap-3">
        {quickEntry.map((item) => {
          const Icon = item.icon

          return (
            <Link key={item.id} to={item.to} className="flex flex-col items-center gap-2">
              <span className={cn('flex size-14 items-center justify-center rounded-2xl', item.tone)}>
                <Icon className="size-7" />
              </span>
              <span className="text-center text-[11px] font-medium leading-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
