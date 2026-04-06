import { useQuery } from '@tanstack/react-query'
import {
  IconAlertCircle,
  IconChevronRight,
  IconGenderFemale,
  IconGenderMale,
  IconMail,
  IconMapPin,
  IconPhone,
  IconUserCircle,
  IconUsers,
  IconX,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'

import { ClassSelector } from '@/app/components/class-selector'
import { PageTitleHeader } from '@/app/components/page-title-header'
import { useTeacherClasses } from '@/app/hooks/use-teacher-classes'
import { Badge } from '@/components/ui/badge'
import { BottomModal } from '@/components/ui/bottom-modal'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/shared/api/query-keys'
import { getClassStudents } from '@/shared/api/teacher'
import { cn, formatDate, usePageSeo } from '@/shared/lib'

type StudentFilter = 'all' | 'female' | 'male'

export function StudentsPage() {
  usePageSeo({
    title: 'Danh sách học sinh',
    description:
      'Xem hồ sơ học sinh theo lớp, tra cứu nhanh thông tin và phụ huynh bằng giao diện tối ưu mobile.',
    keywords: ['hoc sinh', 'ho so hoc sinh', 'phu huynh', 'teacher app'],
  })

  const { activeClassId, classes, classesQuery, setActiveClassId } = useTeacherClasses()
  const [keyword, setKeyword] = useState('')
  const [activeFilter, setActiveFilter] = useState<StudentFilter>('all')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const studentsQuery = useQuery({
    enabled: Boolean(activeClassId),
    queryFn: () => getClassStudents(activeClassId),
    queryKey: queryKeys.teacher.students(activeClassId),
  })

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data])

  const stats = useMemo(() => {
    const male = students.filter((item) => item.gender).length
    const female = students.filter((item) => !item.gender).length

    return {
      female,
      male,
      total: students.length,
    }
  }, [students])

  const filteredStudents = useMemo(() => {
    const text = keyword.trim().toLowerCase()

    return students.filter((item) => {
      const parentsText = (item.parents ?? [])
        .map((parent) => `${parent.name ?? ''} ${parent.phone ?? ''} ${parent.relation ?? ''}`)
        .join(' ')

      const haystack = `${item.name} ${item.phone ?? ''} ${item.email ?? ''} ${item.address ?? ''} ${parentsText}`.toLowerCase()
      const matchesKeyword = !text || haystack.includes(text)
      const matchesFilter =
        activeFilter === 'all' ? true : activeFilter === 'male' ? item.gender : !item.gender

      return matchesKeyword && matchesFilter
    })
  }, [activeFilter, keyword, students])

  const selectedStudent = useMemo(
    () => students.find((item) => item.id === selectedStudentId) ?? null,
    [selectedStudentId, students],
  )

  return (
    <section className="page-shell mx-auto w-full max-w-md space-y-4">
      <div className="ui-section space-y-4 p-4">
        <PageTitleHeader
          title="Danh sách học sinh"
          subtitle="Chỉ xem hồ sơ học sinh, bấm vào thẻ để xem chi tiết và phụ huynh"
        />

        <ClassSelector
          activeClassId={activeClassId}
          classes={classes}
          isLoading={classesQuery.isLoading}
          onChange={setActiveClassId}
        />

        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-700 via-blue-700 to-indigo-700 p-4 text-white">
          <span className="absolute -right-8 -top-8 size-24 rounded-full bg-white/10" />
          <span className="absolute -bottom-8 -left-8 size-20 rounded-full bg-white/10" />
          <div className="relative space-y-3">
            <div>
              <p className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
                <IconUsers className="size-3.5" />
                Hồ sơ lớp học
              </p>
              <p className="mt-1 text-base font-bold">Xem nhanh thông tin học sinh và phụ huynh theo từng lớp</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/15 px-1.5 py-2">
                <p className="text-[10px] text-white/80">Tổng</p>
                <p className="text-base font-bold">{stats.total}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-1.5 py-2">
                <p className="text-[10px] text-white/80">Nam</p>
                <p className="text-base font-bold">{stats.male}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-1.5 py-2">
                <p className="text-[10px] text-white/80">Nữ</p>
                <p className="text-base font-bold">{stats.female}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo học sinh hoặc phụ huynh..."
          />
        </div>

        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {[
            { label: 'Tất cả', value: 'all' as const, count: stats.total },
            { label: 'Nam', value: 'male' as const, count: stats.male },
            { label: 'Nữ', value: 'female' as const, count: stats.female },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                activeFilter === item.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground',
              )}
              onClick={() => setActiveFilter(item.value)}
            >
              {item.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px]',
                  activeFilter === item.value
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {studentsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`students-loading-${index}`} className="ui-section space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-10 rounded-2xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-10/12" />
              <Skeleton className="h-3.5 w-9/12" />
            </div>
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="ui-section p-4 text-sm text-muted-foreground">
          Không tìm thấy học sinh phù hợp với điều kiện lọc hiện tại.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((item) => {
            const parentCount = item.parents?.length ?? 0
            const firstParent = item.parents?.[0]

            return (
              <button
                key={item.id}
                type="button"
                className="ui-section w-full space-y-3 p-4 text-left"
                onClick={() => setSelectedStudentId(item.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <IconUserCircle className="size-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.dob)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge className={cn(item.gender ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700')}>
                      {item.gender ? 'Nam' : 'Nữ'}
                    </Badge>
                    <span className="rounded-full bg-muted p-1 text-muted-foreground">
                      <IconChevronRight className="size-3.5" />
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <p className="inline-flex items-start gap-1.5 text-muted-foreground">
                    <IconPhone className="mt-0.5 size-4 shrink-0" />
                    <span>{item.phone || 'Chưa có số điện thoại học sinh'}</span>
                  </p>
                  <p className="inline-flex items-start gap-1.5 text-muted-foreground">
                    <IconMail className="mt-0.5 size-4 shrink-0" />
                    <span>{item.email || 'Chưa có email học sinh'}</span>
                  </p>
                  <p className="inline-flex items-start gap-1.5 text-muted-foreground">
                    <IconMapPin className="mt-0.5 size-4 shrink-0" />
                    <span>{item.address || 'Chưa có địa chỉ học sinh'}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-100 px-2 py-1 text-[11px] font-semibold text-violet-700">
                    Phụ huynh: {parentCount}
                  </span>
                  {firstParent ? (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
                      {firstParent.name || 'Phụ huynh'} {firstParent.relation ? `(${firstParent.relation})` : ''}
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {studentsQuery.isError ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <IconAlertCircle className="size-4" />
          <p>Không thể tải danh sách học sinh. Vui lòng thử lại sau.</p>
        </div>
      ) : null}

      {selectedStudent ? (
        <BottomModal open={Boolean(selectedStudent)} onClose={() => setSelectedStudentId(null)}>
          <div className="space-y-4 p-4">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-muted" />

                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <IconUserCircle className="size-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold">{selectedStudent.name}</p>
                      <p className="text-xs text-muted-foreground">Ngày sinh: {formatDate(selectedStudent.dob)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-border p-2 text-muted-foreground"
                    onClick={() => setSelectedStudentId(null)}
                  >
                    <IconX className="size-4" />
                  </button>
                </div>

                <div className="ui-subtle-panel space-y-2 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thông tin học sinh</p>
                  <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    {selectedStudent.gender ? (
                      <IconGenderMale className="size-4 text-sky-700" />
                    ) : (
                      <IconGenderFemale className="size-4 text-rose-700" />
                    )}
                    {selectedStudent.gender ? 'Nam' : 'Nữ'}
                  </p>
                  <p className="inline-flex items-start gap-1.5 text-sm text-muted-foreground">
                    <IconPhone className="mt-0.5 size-4 shrink-0" />
                    {selectedStudent.phone || 'Chưa có số điện thoại'}
                  </p>
                  <p className="inline-flex items-start gap-1.5 text-sm text-muted-foreground">
                    <IconMail className="mt-0.5 size-4 shrink-0" />
                    {selectedStudent.email || 'Chưa có email'}
                  </p>
                  <p className="inline-flex items-start gap-1.5 text-sm text-muted-foreground">
                    <IconMapPin className="mt-0.5 size-4 shrink-0" />
                    {selectedStudent.address || 'Chưa có địa chỉ'}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Thông tin phụ huynh</p>

                  {(selectedStudent.parents ?? []).length === 0 ? (
                    <div className="ui-subtle-panel p-3 text-sm text-muted-foreground">
                      Chưa có dữ liệu phụ huynh cho học sinh này.
                    </div>
                  ) : (
                    (selectedStudent.parents ?? []).map((parent) => (
                      <article key={parent.id} className="ui-subtle-panel space-y-2 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{parent.name || 'Phụ huynh'}</p>
                          <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
                            {parent.relation || 'Người giám hộ'}
                          </span>
                        </div>
                        <p className="inline-flex items-start gap-1.5 text-sm text-muted-foreground">
                          <IconPhone className="mt-0.5 size-4 shrink-0" />
                          {parent.phone || 'Chưa có số điện thoại'}
                        </p>
                        <p className="inline-flex items-start gap-1.5 text-sm text-muted-foreground">
                          <IconMail className="mt-0.5 size-4 shrink-0" />
                          {parent.email || 'Chưa có email'}
                        </p>
                        <p className="inline-flex items-start gap-1.5 text-sm text-muted-foreground">
                          <IconMapPin className="mt-0.5 size-4 shrink-0" />
                          {parent.address || 'Chưa có địa chỉ'}
                        </p>
                      </article>
                    ))
                  )}
                </div>
          </div>
        </BottomModal>
      ) : null}
    </section>
  )
}
