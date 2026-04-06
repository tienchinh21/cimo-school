import { IconChevronDown } from '@tabler/icons-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { AttendanceStudent } from '@/pages/attendance/types/attendance-page.types'

interface StudentSelectorCardProps {
  student: AttendanceStudent
}

export function StudentSelectorCard({ student }: StudentSelectorCardProps) {
  return (
    <section className="ui-card p-3.5">
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 border-2 border-white shadow-sm">
            <AvatarImage src={student.avatarUrl} alt={student.name} />
            <AvatarFallback>HS</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-bold leading-none text-foreground">{student.name}</p>
            <p className="mt-1 text-base font-medium text-muted-foreground">{student.grade}</p>
          </div>
        </div>
        <IconChevronDown className="size-6 text-muted-foreground" />
      </button>
    </section>
  )
}
