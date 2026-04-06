import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  IconAlertCircle,
  IconArrowRight,
  IconCalendarCheck,
  IconCalendarClock,
  IconCheck,
  IconClock,
  IconEye,
  IconGenderFemale,
  IconGenderMale,
  IconMail,
  IconMapPin,
  IconPhone,
  IconRefresh,
  IconUserCircle,
  IconUsers,
  IconX,
} from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { ClassSelector } from '@/app/components/class-selector'
import { PageTitleHeader } from '@/app/components/page-title-header'
import { useTeacherClasses } from '@/app/hooks/use-teacher-classes'
import { BottomModal } from '@/components/ui/bottom-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/shared/api/query-keys'
import {
  bulkUpsertClassCheckins,
  deleteClassCheckin,
  getClassCheckins,
  getClassStudents,
} from '@/shared/api/teacher'
import type { TeacherBulkCheckinItem } from '@/shared/api/teacher.types'
import { cn, formatDate, toDateInputValue, toIsoDateTime, toTimeInputValue, usePageSeo } from '@/shared/lib'

type AttendanceDraft = {
  checkIn: boolean
  checkOut: boolean
  checkinId?: string
  checkoutId?: string
  inTime: string
  note: string
  outTime: string
}

type AttendanceFilter = 'all' | 'done' | 'needCheckIn' | 'needCheckOut'

function toClockTime(source = new Date()) {
  const hours = String(source.getHours()).padStart(2, '0')
  const minutes = String(source.getMinutes()).padStart(2, '0')
  const seconds = String(source.getSeconds()).padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}

const createDefaultDraft = (): AttendanceDraft => ({
  checkIn: false,
  checkOut: false,
  inTime: '',
  note: '',
  outTime: '',
})

const createDraftFromCheckin = (
  row?: {
    checkin?: { checkDate?: string; id?: string; note?: string }
    checkout?: { checkDate?: string; id?: string; note?: string }
  },
): AttendanceDraft => ({
  checkIn: Boolean(row?.checkin),
  checkOut: Boolean(row?.checkout),
  checkinId: row?.checkin?.id,
  checkoutId: row?.checkout?.id,
  inTime: toTimeInputValue(row?.checkin?.checkDate, true),
  note: row?.checkin?.note ?? row?.checkout?.note ?? '',
  outTime: toTimeInputValue(row?.checkout?.checkDate, true),
})

function toDraftValue(row: AttendanceDraft): AttendanceDraft {
  return {
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    checkinId: row.checkinId,
    checkoutId: row.checkoutId,
    inTime: row.inTime,
    note: row.note,
    outTime: row.outTime,
  }
}

export function AttendancePage() {
  usePageSeo({
    title: 'Điểm danh lớp học',
    description:
      'Điểm danh check-in/check-out theo ngày, thao tác nhanh theo lớp và theo dõi tiến độ điểm danh của học sinh.',
    keywords: ['diem danh', 'check-in', 'check-out', 'giao vien', 'cimo school'],
  })

  const { activeClass, activeClassId, classes, classesQuery, setActiveClassId } = useTeacherClasses()
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()))
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({})
  const [activeFilter, setActiveFilter] = useState<AttendanceFilter>('all')
  const [liveNow, setLiveNow] = useState(() => new Date())
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveNow(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const liveClock = useMemo(() => toClockTime(liveNow), [liveNow])

  const studentsQuery = useQuery({
    enabled: Boolean(activeClassId),
    queryFn: () => getClassStudents(activeClassId),
    queryKey: queryKeys.teacher.students(activeClassId),
  })

  const checkinsQuery = useQuery({
    enabled: Boolean(activeClassId),
    queryFn: () => getClassCheckins(activeClassId, selectedDate),
    queryKey: queryKeys.teacher.checkins(activeClassId, selectedDate),
  })

  const checkinsByStudentId = useMemo(
    () => new Map((checkinsQuery.data ?? []).map((item) => [item.student.id, item])),
    [checkinsQuery.data],
  )

  const attendanceRows = useMemo(() => {
    return (studentsQuery.data ?? []).map((student) => {
      const existing = checkinsByStudentId.get(student.id)
      const baseDraft = existing ? createDraftFromCheckin(existing) : createDefaultDraft()
      const override = drafts[student.id]
      const draft = override ? { ...baseDraft, ...override } : baseDraft

      return {
        ...draft,
        student,
      }
    })
  }, [checkinsByStudentId, drafts, studentsQuery.data])

  const selectedStudent = useMemo(
    () => (studentsQuery.data ?? []).find((item) => item.id === selectedStudentId) ?? null,
    [selectedStudentId, studentsQuery.data],
  )

  const selectedAttendance = useMemo(
    () => attendanceRows.find((item) => item.student.id === selectedStudentId) ?? null,
    [attendanceRows, selectedStudentId],
  )

  const filterStats = useMemo(() => {
    const total = attendanceRows.length
    const done = attendanceRows.filter((item) => item.checkIn && item.checkOut).length
    const needCheckIn = attendanceRows.filter((item) => !item.checkIn).length
    const needCheckOut = attendanceRows.filter((item) => item.checkIn && !item.checkOut).length

    return {
      done,
      needCheckIn,
      needCheckOut,
      total,
    }
  }, [attendanceRows])

  const filteredRows = useMemo(() => {
    if (activeFilter === 'done') {
      return attendanceRows.filter((item) => item.checkIn && item.checkOut)
    }

    if (activeFilter === 'needCheckIn') {
      return attendanceRows.filter((item) => !item.checkIn)
    }

    if (activeFilter === 'needCheckOut') {
      return attendanceRows.filter((item) => item.checkIn && !item.checkOut)
    }

    return attendanceRows
  }, [activeFilter, attendanceRows])

  const updateDraft = (studentId: string, updater: (current: AttendanceDraft) => AttendanceDraft) => {
    setDrafts((prev) => {
      const existing = checkinsByStudentId.get(studentId)
      const current = prev[studentId] ?? (existing ? createDraftFromCheckin(existing) : createDefaultDraft())
      return {
        ...prev,
        [studentId]: updater(current),
      }
    })
  }

  const markAllCheckIn = () => {
    const nowTime = toClockTime(new Date())
    setDrafts((prev) => {
      const next = { ...prev }

      for (const row of attendanceRows) {
        next[row.student.id] = {
          ...toDraftValue(row),
          checkIn: true,
          inTime: row.inTime || nowTime,
        }
      }

      return next
    })

    toast.success('Đã đánh dấu check-in cho toàn bộ học sinh hiển thị.')
  }

  const markCheckOutForCheckedIn = () => {
    const nowTime = toClockTime(new Date())
    setDrafts((prev) => {
      const next = { ...prev }

      for (const row of attendanceRows) {
        if (!row.checkIn) {
          continue
        }

        next[row.student.id] = {
          ...toDraftValue(row),
          checkOut: true,
          outTime: row.outTime || nowTime,
        }
      }

      return next
    })

    toast.success('Đã đánh dấu check-out cho học sinh đã check-in.')
  }

  const resetLocalDrafts = () => {
    setDrafts({})
    toast.success('Đã đặt lại chỉnh sửa nháp về dữ liệu hiện tại.')
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeClassId) {
        throw new Error('Vui lòng chọn lớp trước khi lưu điểm danh.')
      }

      const fallbackTime = toClockTime(new Date())
      const deleteIds: string[] = []
      const upsertItems: TeacherBulkCheckinItem[] = []

      for (const row of attendanceRows) {
        if (row.checkinId && !row.checkIn) {
          deleteIds.push(row.checkinId)
        }

        if (row.checkoutId && !row.checkOut) {
          deleteIds.push(row.checkoutId)
        }

        if (row.checkIn) {
          upsertItems.push({
            checkDate: toIsoDateTime(selectedDate, row.inTime || fallbackTime),
            checkType: 'in',
            note: row.note.trim() || undefined,
            soStudentId: row.student.id,
          })
        }

        if (row.checkOut) {
          upsertItems.push({
            checkDate: toIsoDateTime(selectedDate, row.outTime || fallbackTime),
            checkType: 'out',
            note: row.note.trim() || undefined,
            soStudentId: row.student.id,
          })
        }
      }

      if (deleteIds.length === 0 && upsertItems.length === 0) {
        return { created: 0, updated: 0 }
      }

      if (deleteIds.length > 0) {
        await Promise.all(deleteIds.map((id) => deleteClassCheckin(activeClassId, id)))
      }

      const upsertResult =
        upsertItems.length > 0
          ? await bulkUpsertClassCheckins(activeClassId, upsertItems)
          : { created: 0, total: 0, updated: 0 }

      return {
        created: upsertResult.created,
        updated: upsertResult.updated,
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Không thể lưu điểm danh.'
      toast.error(message)
    },
    onSuccess: (result) => {
      toast.success(`Đã lưu điểm danh: ${result.created} mới, ${result.updated} cập nhật.`)
      setDrafts({})
      void queryClient.invalidateQueries({
        queryKey: queryKeys.teacher.checkins(activeClassId, selectedDate),
      })
    },
  })

  const presentCount = attendanceRows.filter((item) => item.checkIn).length
  const checkedOutCount = attendanceRows.filter((item) => item.checkOut).length
  const checkInRate = attendanceRows.length > 0 ? Math.round((presentCount / attendanceRows.length) * 100) : 0

  const attendanceTone =
    checkInRate >= 95
      ? {
          chipClassName: 'border-emerald-200 bg-emerald-100 text-emerald-700',
          label: 'Tỷ lệ check-in rất tốt',
        }
      : checkInRate >= 80
        ? {
            chipClassName: 'border-amber-200 bg-amber-100 text-amber-700',
            label: 'Cần theo dõi vài học sinh',
          }
        : {
            chipClassName: 'border-rose-200 bg-rose-100 text-rose-700',
            label: 'Cần ưu tiên hoàn tất điểm danh',
          }

  return (
    <section className="page-shell mx-auto w-full max-w-md space-y-4">
      <div className="ui-section space-y-4 p-4">
        <PageTitleHeader title="Điểm danh lớp" subtitle="Check-in trước, sau đó mới check-out theo từng học sinh" />

        <ClassSelector
          activeClassId={activeClassId}
          classes={classes}
          isLoading={classesQuery.isLoading}
          onChange={(classId) => {
            setDrafts({})
            setSelectedStudentId(null)
            setActiveClassId(classId)
          }}
        />

        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 via-teal-600 to-cyan-600 p-4 text-white">
          <span className="absolute -right-8 -top-8 size-24 rounded-full bg-white/15" />
          <span className="absolute -bottom-8 -left-8 size-20 rounded-full bg-white/15" />
          <div className="relative space-y-3">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
                <IconClock className="size-3.5" />
                {formatDate(selectedDate)}
              </p>
              <p className="text-base font-bold">
                {activeClass ? `Điểm danh lớp ${activeClass.name}` : 'Chưa chọn lớp thao tác'}
              </p>
              <p className="text-xs text-white/85">Đồng hồ thao tác realtime tại thời điểm check-in/check-out</p>
            </div>

            <div className="rounded-2xl bg-black/20 px-3 py-2 text-center">
              <p className="font-mono text-4xl font-black tracking-[0.08em]">{liveClock}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/85">Sĩ số</p>
                <p className="text-base font-bold">{filterStats.total}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/85">Check-in</p>
                <p className="text-base font-bold">{presentCount}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/85">Check-out</p>
                <p className="text-base font-bold">{checkedOutCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="ui-subtle-panel space-y-3 p-3">
          <div className="grid grid-cols-[1fr,auto] items-end gap-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ngày điểm danh
              </p>
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setDrafts({})
                  setSelectedDate(event.target.value)
                }}
              />
            </div>
            <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', attendanceTone.chipClassName)}>
              {checkInRate}% • {attendanceTone.label}
            </span>
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !activeClassId}
          >
            {saveMutation.isPending ? 'Đang lưu điểm danh...' : 'Lưu điểm danh toàn lớp'}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Truy cập nhanh</p>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-9 shrink-0 rounded-full"
              onClick={markAllCheckIn}
              disabled={attendanceRows.length === 0}
            >
              <IconCalendarCheck className="mr-1 size-3.5" />
              Check-in toàn lớp
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-9 shrink-0 rounded-full"
              onClick={markCheckOutForCheckedIn}
              disabled={attendanceRows.length === 0 || presentCount === 0}
            >
              <IconCalendarClock className="mr-1 size-3.5" />
              Check-out nhanh
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 shrink-0 rounded-full"
              onClick={resetLocalDrafts}
              disabled={Object.keys(drafts).length === 0}
            >
              <IconRefresh className="mr-1 size-3.5" />
              Đặt lại nháp
            </Button>
            <Button asChild size="sm" variant="outline" className="h-9 shrink-0 rounded-full">
              <Link to="/leaves?mode=review&status=waiting">
                Duyệt đơn nghỉ
                <IconArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-9 shrink-0 rounded-full">
              <Link to="/students">
                Mở hồ sơ lớp
                <IconUsers className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {[
            { label: 'Tất cả', value: 'all' as const, count: filterStats.total },
            { label: 'Cần check-in', value: 'needCheckIn' as const, count: filterStats.needCheckIn },
            { label: 'Cần check-out', value: 'needCheckOut' as const, count: filterStats.needCheckOut },
            { label: 'Hoàn tất', value: 'done' as const, count: filterStats.done },
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

      {studentsQuery.isLoading || checkinsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <article key={`attendance-loading-${index}`} className="ui-section space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-10 rounded-2xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </article>
          ))}
        </div>
      ) : attendanceRows.length === 0 ? (
        <div className="ui-section p-4 text-sm text-muted-foreground">Lớp chưa có học sinh để điểm danh.</div>
      ) : filteredRows.length === 0 ? (
        <div className="ui-section p-4 text-sm text-muted-foreground">
          Không có học sinh phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row) => {
            const draft = row

            return (
              <article key={row.student.id} className="ui-section space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <IconUserCircle className="size-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{row.student.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.student.phone || 'Chưa có số điện thoại'} • {row.student.gender ? 'Nam' : 'Nữ'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full px-3 text-xs"
                      onClick={() => setSelectedStudentId(row.student.id)}
                    >
                      <IconEye className="mr-1 size-3.5" />
                      Chi tiết
                    </Button>
                    <button
                      type="button"
                      className="rounded-full border border-border p-2 text-muted-foreground"
                      onClick={() => {
                        updateDraft(row.student.id, (current) => ({
                          ...current,
                          checkIn: false,
                          checkOut: false,
                          inTime: '',
                          note: '',
                          outTime: '',
                        }))
                      }}
                    >
                      <IconRefresh className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
                      draft.checkIn
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                        : 'border-slate-200 bg-slate-100 text-slate-700',
                    )}
                  >
                    <IconCalendarCheck className="size-3.5" />
                    {draft.checkIn ? 'Đã check-in' : 'Chưa check-in'}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
                      draft.checkOut
                        ? 'border-blue-200 bg-blue-100 text-blue-700'
                        : 'border-slate-200 bg-slate-100 text-slate-700',
                    )}
                  >
                    <IconCalendarClock className="size-3.5" />
                    {draft.checkOut ? 'Đã check-out' : 'Chưa check-out'}
                  </span>
                </div>

                <div className={cn('grid gap-2', draft.checkIn ? 'grid-cols-2' : 'grid-cols-1')}>
                  <Button
                    type="button"
                    variant={draft.checkIn ? 'default' : 'secondary'}
                    className={cn(
                      'rounded-xl font-semibold',
                      draft.checkIn ? 'bg-emerald-600 text-white hover:bg-emerald-600/90' : '',
                    )}
                    onClick={() => {
                      updateDraft(row.student.id, (current) => {
                        const nextCheckIn = !current.checkIn

                        if (!nextCheckIn) {
                          return {
                            ...current,
                            checkIn: false,
                            checkOut: false,
                            inTime: '',
                            outTime: '',
                          }
                        }

                        return {
                          ...current,
                          checkIn: true,
                          inTime: toClockTime(new Date()),
                        }
                      })
                    }}
                  >
                    {draft.checkIn ? <IconCheck className="mr-1 size-4" /> : <IconX className="mr-1 size-4" />}
                    Check-in
                  </Button>

                  {draft.checkIn ? (
                    <Button
                      type="button"
                      variant={draft.checkOut ? 'default' : 'secondary'}
                      className={cn(
                        'rounded-xl font-semibold',
                        draft.checkOut ? 'bg-blue-600 text-white hover:bg-blue-600/90' : '',
                      )}
                      onClick={() => {
                        updateDraft(row.student.id, (current) => {
                          const nextCheckOut = !current.checkOut

                          return {
                            ...current,
                            checkOut: nextCheckOut,
                            outTime: nextCheckOut ? toClockTime(new Date()) : '',
                          }
                        })
                      }}
                    >
                      {draft.checkOut ? <IconCheck className="mr-1 size-4" /> : <IconX className="mr-1 size-4" />}
                      Check-out
                    </Button>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Giờ check-in</p>
                    <p className="mt-1 font-mono text-lg font-bold text-emerald-800">
                      {draft.checkIn ? draft.inTime : '--:--:--'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Giờ check-out</p>
                    <p className="mt-1 font-mono text-lg font-bold text-blue-800">
                      {draft.checkOut ? draft.outTime : '--:--:--'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Thời gian được tự động lấy theo đồng hồ realtime tại thời điểm bấm thao tác.
                </p>

                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Ghi chú (tùy chọn)</p>
                  <Input
                    value={draft.note}
                    placeholder="Ví dụ: đến muộn 10 phút hoặc cần theo dõi sức khỏe"
                    onChange={(event) => {
                      const value = event.target.value
                      updateDraft(row.student.id, (current) => ({
                        ...current,
                        note: value,
                      }))
                    }}
                  />
                </div>
              </article>
            )
          })}
        </div>
      )}

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

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Check-in</p>
                    <p className="mt-1 font-mono text-base font-bold text-emerald-800">
                      {selectedAttendance?.checkIn ? selectedAttendance.inTime : '--:--:--'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Check-out</p>
                    <p className="mt-1 font-mono text-base font-bold text-blue-800">
                      {selectedAttendance?.checkOut ? selectedAttendance.outTime : '--:--:--'}
                    </p>
                  </div>
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

      {studentsQuery.isError || checkinsQuery.isError ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <IconAlertCircle className="size-4" />
          <p>Không thể tải đầy đủ dữ liệu điểm danh. Vui lòng thử lại sau ít phút.</p>
        </div>
      ) : null}
    </section>
  )
}
