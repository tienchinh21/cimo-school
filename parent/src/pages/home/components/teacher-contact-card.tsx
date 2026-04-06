import { IconMessageCircle2, IconPhone, IconSchool } from '@tabler/icons-react'

import type { TeacherContactInfo } from '@/pages/home/components/teacher-contact-drawer'

interface TeacherContactCardProps {
  hasEmail: boolean
  hasPhone: boolean
  teacher: TeacherContactInfo
  title: string
}

export function TeacherContactCard({
  hasEmail,
  hasPhone,
  teacher,
  title,
}: TeacherContactCardProps) {
  return (
    <div className="ui-section-pill relative flex items-center justify-between p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <IconSchool className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{title}</p>
          <p className="truncate text-sm font-bold text-foreground">{teacher.name}</p>
        </div>
      </div>
      <div className="relative z-20 flex items-center gap-2">
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white"
          aria-label="Nhắn tin giáo viên"
          disabled={!hasEmail}
        >
          <IconMessageCircle2 className="size-4" />
        </button>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-600"
          aria-label="Gọi điện giáo viên"
          disabled={!hasPhone}
        >
          <IconPhone className="size-4" />
        </button>
      </div>
    </div>
  )
}
