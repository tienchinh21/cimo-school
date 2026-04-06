import { cn } from '@/shared/lib'

import type { AttendanceFilterItem, AttendanceFilterKey } from '@/pages/attendance/types/attendance-page.types'

interface AttendanceFilterTabsProps {
  items: AttendanceFilterItem[]
  value: AttendanceFilterKey
  onChange: (key: AttendanceFilterKey) => void
}

export function AttendanceFilterTabs({ items, value, onChange }: AttendanceFilterTabsProps) {
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const isActive = item.key === value

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              'shrink-0 rounded-xl border px-5 py-2 text-sm font-semibold transition-colors',
              isActive
                ? 'border-transparent bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'border-border bg-card text-muted-foreground',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
