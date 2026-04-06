import { useState } from 'react'

import { useAuthUser } from '@/app/contexts/AuthContext'
import { HomeHeader } from '@/pages/home/components/home-header'
import { NewsSection } from '@/pages/home/components/news-section'
import { QuickAccessGrid } from '@/pages/home/components/quick-access-grid'
import { TeacherContactDrawer } from '@/pages/home/components/teacher-contact-drawer'
import { getHomeErrorMessage, mapUserToStudents, mapUserToTeacher } from '@/pages/home/home-page.utils'
import { useHomeBlogs } from '@/pages/home/hooks/use-home-page'

export function HomePage() {
  const user = useAuthUser()
  const blogsQuery = useHomeBlogs()
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0)

  if (!user) {
    const message = 'Không thể tải thông tin phụ huynh'
    return <div className="px-4 py-6 text-sm text-destructive">{message}</div>
  }

  const students = mapUserToStudents(user)
  const activeIndex = selectedStudentIndex < students.length ? selectedStudentIndex : 0
  const teacher = mapUserToTeacher(user, activeIndex)
  const newsErrorMessage = blogsQuery.isError
    ? getHomeErrorMessage(blogsQuery.error, 'Không thể tải tin tức mới nhất')
    : undefined

  return (
    <section className="mx-auto -mt-8 w-full max-w-3xl pb-6 md:-mt-10">
      <div className="-mx-4 md:-mx-6">
        <HomeHeader students={students} activeIndex={activeIndex} onSelect={setSelectedStudentIndex} />
      </div>
      <QuickAccessGrid />
      <section className="mt-6">
        <TeacherContactDrawer teacher={teacher} />
      </section>
      <NewsSection
        items={blogsQuery.data ?? []}
        isLoading={blogsQuery.isPending}
        errorMessage={newsErrorMessage}
        onRetry={() => {
          void blogsQuery.refetch()
        }}
      />
    </section>
  )
}
