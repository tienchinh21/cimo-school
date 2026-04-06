import { IconUsers } from '@tabler/icons-react'

import { Skeleton } from '@/components/ui/skeleton'
import type { TeacherClassSummary } from '@/shared/api/teacher.types'
import { cn } from '@/shared/lib'

interface ClassSelectorProps {
  activeClassId: string
  classes: TeacherClassSummary[]
  isLoading?: boolean
  onChange: (classId: string) => void
}

export function ClassSelector({ activeClassId, classes, isLoading = false, onChange }: ClassSelectorProps) {
  if (isLoading) {
    return (
      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`class-loading-${index}`} className="ui-subtle-panel inline-flex items-center gap-2 px-3 py-1.5">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="size-5 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (classes.length === 0) {
    return (
      <div className="ui-card flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-muted-foreground">
        <IconUsers className="size-4 text-muted-foreground" />
        Chưa có lớp được phân công.
      </div>
    )
  }

  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
      {classes.map((item) => {
        const isActive = item.id === activeClassId

        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95',
              isActive
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:bg-muted',
            )}
            onClick={() => onChange(item.id)}
          >
            <span className="max-w-[9.5rem] truncate">{item.name}</span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
                isActive
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <IconUsers className="size-3.5" />
              {item.studentCount}
            </span>
          </button>
        )
      })}
    </div>
  )
}
