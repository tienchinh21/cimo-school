import { IconBell, IconBook2, IconChecks } from '@tabler/icons-react'

import { ThemeToggle } from '@/app/components/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StudentSelectorDrawer } from '@/pages/home/components/student-selector-drawer'
import type { HomeHeroStudentViewModel } from '@/pages/home/types/home-page.types'
import { cn } from '@/shared/lib'

interface HomeHeaderProps {
  students: HomeHeroStudentViewModel[]
  activeIndex: number
  onSelect: (index: number) => void
}

export function HomeHeader({ students, activeIndex, onSelect }: HomeHeaderProps) {
  const hasStudents = students.length > 0
  const shouldShowStudentDrawer = students.length > 1
  const activeAvatarIndex = activeIndex < students.length ? activeIndex : 0
  const selectedStudent = students[activeAvatarIndex] ?? students[0]
  const gradeLabel = selectedStudent?.grade.trim() ?? ''

  const avatarGroup = (
    <div className="flex items-end">
      {hasStudents ? (
        students.map((student, index) => (
          <div
            key={student.id}
            className={cn(
              'rounded-full transition-transform',
              index === 0 ? '' : '-ml-2',
              activeAvatarIndex === index ? 'z-20 scale-100' : 'z-10 scale-95',
            )}
          >
            <Avatar
              className={cn(
                'shadow-sm transition-all',
                activeAvatarIndex === index
                  ? 'size-14 border-[3px] border-primary md:size-16'
                  : 'size-11 border-2 border-background md:size-12',
              )}
            >
              <AvatarImage src={student.avatarUrl} alt={`Avatar ${student.name}`} />
              <AvatarFallback>{student.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
          </div>
        ))
      ) : (
        <Avatar className="size-14 border-2 border-dashed border-border bg-secondary/60 shadow-sm md:size-16">
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
      )}
    </div>
  )

  return (
    <header className="ui-section rounded-b-3xl rounded-t-none px-4 pb-6 pt-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {shouldShowStudentDrawer ? (
            <StudentSelectorDrawer
              avatarGroup={avatarGroup}
              students={students}
              activeIndex={activeAvatarIndex}
              onSelect={onSelect}
            />
          ) : (
            avatarGroup
          )}
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-base font-bold tracking-tight text-foreground md:text-xl">
              {selectedStudent?.name ?? 'Chưa có học sinh liên kết'}
            </h1>
            <p className="truncate text-xs font-medium text-muted-foreground md:text-sm">{gradeLabel}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" className="flex size-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <IconBell className="size-5.5" />
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex-none rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <IconChecks className="size-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600">Đã điểm danh hôm nay</span>
          </div>
        </div>
        <div className="flex-none rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <IconBook2 className="size-4 text-orange-500" />
            <span className="text-xs font-semibold text-orange-600">2 Bài tập chưa nộp</span>
          </div>
        </div>
      </div>
    </header>
  )
}
