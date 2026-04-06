import { IconChevronRight, IconMessageCircle2, IconPhone } from '@tabler/icons-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { TeacherContactCard } from '@/pages/home/components/teacher-contact-card'
import { cn } from '@/shared/lib'

export interface TeacherContactInfo {
  name: string
  phone?: string
  email?: string
  avatarUrl?: string
  homeroom?: string
}

interface TeacherContactDrawerProps {
  teacher?: TeacherContactInfo
}

export function TeacherContactDrawer({ teacher }: TeacherContactDrawerProps) {
  const resolvedTeacher: TeacherContactInfo = teacher ?? { name: 'Chưa có thông tin giáo viên' }
  const title = 'Giáo viên chủ nhiệm'
  const officeHours = 'Thứ 2–6, 08:00–17:00'
  const note = 'Phụ huynh nhắn trước khi gọi để tiện sắp xếp thời gian.'
  const hasPhone = Boolean(resolvedTeacher.phone)
  const hasEmail = Boolean(resolvedTeacher.email)

  return (
    <Drawer>
      <div className="relative">
        <DrawerTrigger asChild>
          <button
            type="button"
            className="absolute inset-0 z-10 rounded-[inherit]"
            aria-label="Mở thông tin giáo viên"
          />
        </DrawerTrigger>
        <TeacherContactCard
          hasEmail={hasEmail}
          hasPhone={hasPhone}
          teacher={resolvedTeacher}
          title={title}
        />
      </div>

      <DrawerContent className="h-[70vh] max-h-[92vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Thông tin giáo viên</DrawerTitle>
          <DrawerDescription>Liên hệ nhanh và xem chi tiết thông tin giáo viên chủ nhiệm.</DrawerDescription>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6 pt-1">
          <section className="ui-card p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-14 border border-border shadow-sm">
                <AvatarImage src={resolvedTeacher.avatarUrl} alt={resolvedTeacher.name} />
                <AvatarFallback>{resolvedTeacher.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-foreground">{resolvedTeacher.name}</p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {resolvedTeacher.homeroom ? `${title} • ${resolvedTeacher.homeroom}` : title}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button type="button" className="h-11 rounded-2xl" disabled={!hasEmail}>
                <IconMessageCircle2 className="size-5" />
                Nhắn tin
              </Button>
              <Button type="button" variant="secondary" className="h-11 rounded-2xl" disabled={!hasPhone}>
                <IconPhone className="size-5" />
                Gọi điện
              </Button>
            </div>
          </section>

          <section className="ui-card p-4">
            <div className="grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">Số điện thoại</p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">{resolvedTeacher.phone ?? '—'}</p>
                </div>
                <Button type="button" variant="secondary" size="icon" className="size-10 rounded-full" disabled={!hasPhone}>
                  <IconChevronRight className="size-5" />
                </Button>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">Email</p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">{resolvedTeacher.email ?? '—'}</p>
                </div>
                <Button type="button" variant="secondary" size="icon" className="size-10 rounded-full" disabled={!hasEmail}>
                  <IconChevronRight className="size-5" />
                </Button>
              </div>

              <div className="rounded-xl bg-muted px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground">Giờ làm việc</p>
                <p className="mt-1 text-sm font-medium text-foreground">{officeHours}</p>
                <p className={cn('mt-2 text-sm italic text-muted-foreground')}>{note}</p>
              </div>
            </div>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
