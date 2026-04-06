import type { HomeBlogsResponse } from '@/pages/home/service/home-api.types'
import type {
  HomeFeaturedNewsViewModel,
  HomeHeroStudentViewModel,
  HomeTeacherContactViewModel,
} from '@/pages/home/types/home-page.types'
import { formatParentGender, type ParentProfileResponse } from '@/shared/api/auth.types'
import { ApiError } from '@/shared/api/types'

export function formatHomeDate(dateIso: string) {
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) {
    return dateIso
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function normalizeHomeImageUrl(url?: string) {
  const trimmed = url?.trim() ?? ''
  if (!trimmed) {
    return ''
  }

  if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return trimmed.slice(1, -1).trim()
  }

  return trimmed.replaceAll('`', '').trim()
}

export function mapUserToStudents(user: ParentProfileResponse): HomeHeroStudentViewModel[] {
  return (user.students ?? []).map((student) => ({
    id: student.id,
    name: student.name,
    grade: student.soClass?.name ?? student.soClassId,
    dobLine: `${formatHomeDate(student.dob)} | ${formatParentGender(student.gender)}`,
    avatarUrl: normalizeHomeImageUrl(student.avt),
  }))
}

export function mapUserToTeacher(
  user: ParentProfileResponse,
  studentIndex: number,
): HomeTeacherContactViewModel | undefined {
  const student = user.students[studentIndex] ?? user.students[0]
  const teacher = student?.soClass?.soUsers?.[0]

  if (!teacher) {
    return undefined
  }

  return {
    name: teacher.name,
    phone: teacher.phone,
    email: teacher.email,
    avatarUrl: normalizeHomeImageUrl(teacher.avt),
    homeroom: student?.soClass?.name,
  }
}

export function mapHomeBlogs(data: HomeBlogsResponse): HomeFeaturedNewsViewModel[] {
  return data.map((item) => ({
    id: item.id,
    title: item.name,
    summary: item.sumary,
    imageUrl: normalizeHomeImageUrl(item.imgs?.[0]),
    createdAtLabel: formatHomeDate(item.createdDate),
  }))
}

export function getHomeErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}
