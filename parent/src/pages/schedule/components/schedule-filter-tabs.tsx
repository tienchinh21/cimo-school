import { IconCalendarMonth } from '@tabler/icons-react'

import type { ScheduleFilterItem, ScheduleFilterKey } from '@/pages/schedule/types/schedule-page.types'
import { cn } from '@/shared/lib'

interface ScheduleFilterTabsProps {
  items: ScheduleFilterItem[]
  value: ScheduleFilterKey
  onChange: (key: ScheduleFilterKey) => void
}

export function ScheduleFilterTabs({ items, value, onChange }: ScheduleFilterTabsProps) {
  return (
    <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const isActive = item.key === value

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              'flex shrink-0 flex-col items-center justify-center rounded-xl px-3 py-2 text-center transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
          >
            <span className="text-[10px] font-semibold uppercase opacity-90">{item.helper}</span>
            <span className="text-sm font-bold">{item.label}</span>
          </button>
        )
      })}
      <button
        type="button"
        className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:bg-accent"
        aria-label="Chọn ngày tùy chỉnh"
      >
        <IconCalendarMonth className="size-5" />
      </button>
    </div>
  )
}
