import { IconChevronDown } from '@tabler/icons-react'
import type { ReactNode } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { cn } from '@/shared/lib'

interface StudentSelectorDrawerStudent {
  id: string
  name: string
  dobLine: string
  avatarUrl: string
}

interface StudentSelectorDrawerProps {
  avatarGroup: ReactNode
  students: StudentSelectorDrawerStudent[]
  activeIndex: number
  onSelect: (index: number) => void
}

export function StudentSelectorDrawer({ avatarGroup, students, activeIndex, onSelect }: StudentSelectorDrawerProps) {
  const hasStudents = students.length > 0

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="flex items-end gap-1 rounded-full"
          aria-label={hasStudents ? 'Mở danh sách học sinh' : 'Mở trạng thái danh sách học sinh'}
        >
          {avatarGroup}
          <IconChevronDown className="mb-1 size-4 text-muted-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="h-[54vh] max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Chọn học sinh</DrawerTitle>
          <DrawerDescription>Danh sách học sinh đang liên kết với phụ huynh.</DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col pb-6">
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pt-3">
            {hasStudents ? (
              students.map((student, index) => (
                <DrawerClose asChild key={student.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(index)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                      activeIndex === index
                        ? 'border-primary bg-accent ring-1 ring-primary/30'
                        : 'border-border bg-background hover:bg-accent/40',
                    )}
                    aria-label={`Chọn học sinh ${student.name}`}
                  >
                    <Avatar
                      className={cn(
                        'size-12 border shadow-sm',
                        activeIndex === index ? 'border-primary/40' : 'border-border',
                      )}
                    >
                      <AvatarImage src={student.avatarUrl} alt={`Avatar ${student.name}`} />
                      <AvatarFallback>{student.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold text-foreground">{student.name}</span>
                        <span className="text-xs text-muted-foreground">{student.dobLine}</span>
                      </div>
                      {activeIndex === index ? (
                        <Badge variant="secondary" className="shrink-0">
                          Đang chọn
                        </Badge>
                      ) : null}
                    </div>
                  </button>
                </DrawerClose>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-foreground">Chưa có học sinh liên kết</p>
                <p className="mt-1 text-xs text-muted-foreground">Danh sách học sinh sẽ hiển thị tại đây khi có dữ liệu.</p>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
