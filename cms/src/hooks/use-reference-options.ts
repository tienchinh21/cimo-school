import { useQueries } from '@tanstack/react-query';
import { fetchCollection } from '../services/cms-api';
import type { CmsRecord, ReferenceOptionsMap } from '../types/cms';

const toLabel = {
  roles: (item: CmsRecord) => String(item.name ?? item.id),
  classes: (item: CmsRecord) => String(item.name ?? item.id),
  students: (item: CmsRecord) => String(item.name ?? item.id),
  parents: (item: CmsRecord) => {
    const relation = item.relation ? ` - ${String(item.relation)}` : '';
    return `${String(item.name ?? item.id)}${relation}`;
  },
  users: (item: CmsRecord) => {
    const username = item.username ? ` (${String(item.username)})` : '';
    return `${String(item.name ?? item.id)}${username}`;
  },
  ladCourses: (item: CmsRecord) => {
    const locale = item.locale ? ` [${String(item.locale).toUpperCase()}]` : '';
    return `${String(item.title ?? item.courseId ?? item.id)}${locale}`;
  },
};

export function useReferenceOptions() {
  const [rolesQuery, classesQuery, studentsQuery, parentsQuery, usersQuery, ladCoursesQuery] = useQueries({
    queries: [
      {
        queryKey: ['refs', 'roles'],
        queryFn: () => fetchCollection('/so-roles', { limit: 500 }),
      },
      {
        queryKey: ['refs', 'classes'],
        queryFn: () => fetchCollection('/so-classes', { limit: 500 }),
      },
      {
        queryKey: ['refs', 'students'],
        queryFn: () => fetchCollection('/so-students', { limit: 500, includeRelations: ['soClass'] }),
      },
      {
        queryKey: ['refs', 'parents'],
        queryFn: () => fetchCollection('/so-parents', { limit: 500 }),
      },
      {
        queryKey: ['refs', 'users'],
        queryFn: () => fetchCollection('/so-users', { limit: 500 }),
      },
      {
        queryKey: ['refs', 'lad-courses'],
        queryFn: () => fetchCollection('/lad-courses', { limit: 1000 }),
      },
    ],
  });

  const map: ReferenceOptionsMap = {
    roles: (rolesQuery.data ?? []).map((item) => ({ label: toLabel.roles(item), value: String(item.id) })),
    classes: (classesQuery.data ?? []).map((item) => ({ label: toLabel.classes(item), value: String(item.id) })),
    students: (studentsQuery.data ?? []).map((item) => ({ label: toLabel.students(item), value: String(item.id) })),
    parents: (parentsQuery.data ?? []).map((item) => ({ label: toLabel.parents(item), value: String(item.id) })),
    users: (usersQuery.data ?? []).map((item) => ({ label: toLabel.users(item), value: String(item.id) })),
    ladCourses: (ladCoursesQuery.data ?? []).map((item) => ({ label: toLabel.ladCourses(item), value: String(item.courseId ?? item.id) })),
  };

  const isLoading =
    rolesQuery.isLoading ||
    classesQuery.isLoading ||
    studentsQuery.isLoading ||
    parentsQuery.isLoading ||
    usersQuery.isLoading ||
    ladCoursesQuery.isLoading;

  return {
    map,
    isLoading,
  };
}
