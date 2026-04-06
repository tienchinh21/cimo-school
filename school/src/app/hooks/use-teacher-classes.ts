import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import { useActiveClassId, useClassActions } from '@/app/contexts/class-store'
import { queryKeys } from '@/shared/api/query-keys'
import { getTeacherClasses } from '@/shared/api/teacher'

export function useTeacherClasses() {
  const activeClassId = useActiveClassId()
  const { setActiveClassId } = useClassActions()

  const classesQuery = useQuery({
    queryKey: queryKeys.teacher.classes(),
    queryFn: getTeacherClasses,
  })

  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data])

  useEffect(() => {
    if (classes.length === 0) {
      return
    }

    const hasActiveClass = classes.some((item) => item.id === activeClassId)

    if (!activeClassId || !hasActiveClass) {
      setActiveClassId(classes[0].id)
    }
  }, [activeClassId, classes, setActiveClassId])

  const activeClass = useMemo(
    () => classes.find((item) => item.id === activeClassId) ?? classes[0] ?? null,
    [activeClassId, classes],
  )

  return {
    activeClass,
    activeClassId: activeClass?.id ?? '',
    classes,
    classesQuery,
    setActiveClassId,
  }
}
