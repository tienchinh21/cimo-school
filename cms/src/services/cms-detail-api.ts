import { apiClient } from '../lib/api-client';
import type { CmsRecord } from '../types/cms';
import axios from 'axios';

export interface ParentSummary extends CmsRecord {
  name?: string;
  relation?: string;
  phone?: string;
  email?: string;
}

export interface TeacherSummary extends CmsRecord {
  name?: string;
  username?: string;
  phone?: string;
  email?: string;
  soRoles?: Array<{ id?: string; name?: string }>;
}

export interface ClassSummary extends CmsRecord {
  name?: string;
  fromDate?: string;
  toDate?: string;
  costPerSession?: number;
  soUsers?: TeacherSummary[];
  soStudents?: StudentSummary[];
}

export interface StudentSummary extends CmsRecord {
  name?: string;
  phone?: string;
  email?: string;
  gender?: boolean;
  dob?: string;
  soClassId?: string;
  soClass?: ClassSummary;
  parents?: ParentSummary[];
}

export interface StudentDetail extends StudentSummary {
  address?: string;
  nationalId?: string;
  avt?: string;
}

export interface ClassDetail extends ClassSummary {
  createdDate?: string;
  updatedDate?: string;
}

export interface AttendanceRecord extends CmsRecord {
  checkType: 'in' | 'out';
  checkDate: string;
  note?: string;
  soStudentId?: string;
  soClassesId?: string;
  soStudent?: StudentSummary;
}

export interface AttendanceCalendarDay {
  date: string;
  checkins: AttendanceRecord[];
}

export interface AttendanceWritePayload {
  checkType: 'in' | 'out';
  checkDate: string;
  soStudentId: string;
  soClassesId?: string;
  note?: string;
}

export interface ClassAttendanceQueryOptions {
  classId: string;
  startDate: string;
  endDate: string;
}

export interface ClassStudentFeeRecord extends CmsRecord {
  soClassId: string;
  soStudentId: string;
  customCostPerSession: number;
}

export type LeaveStatus = 'waiting' | 'approved' | 'reject';

export interface StudentLeaveRecord extends CmsRecord {
  leaveStatus: LeaveStatus;
  leaveStartDate: string;
  leaveEndDate: string;
  reason?: string;
  soParentId?: string;
  soStudentId?: string;
  soUserId?: string;
  soParent?: ParentSummary;
  soStudent?: StudentSummary;
  soUser?: TeacherSummary;
}

const withFilter = (filter: Record<string, unknown>) => ({
  params: {
    filter: JSON.stringify(filter),
  },
});

const withWhere = (where: Record<string, unknown>) => ({
  params: {
    where: JSON.stringify(where),
  },
});

const isNotFoundError = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 404;
const CHECKIN_ENDPOINT_MISSING_MESSAGE =
  'Backend CMS chưa hỗ trợ endpoint /so-checkins. Vui lòng deploy bản backend mới nhất.';

const toDateKey = (value: unknown) => {
  if (!value) {
    return '';
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDateParam = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseMonthStart = (month: string) => {
  const date = new Date(month);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Tháng không hợp lệ: ${month}`);
  }

  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
};

const getMonthEnd = (monthStart: Date) => {
  const now = new Date();
  if (now.getFullYear() === monthStart.getFullYear() && now.getMonth() === monthStart.getMonth()) {
    return now;
  }

  return new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
};

const buildCalendarDays = (monthStart: Date, monthEnd: Date, rows: AttendanceRecord[]): AttendanceCalendarDay[] => {
  const grouped = new Map<string, AttendanceRecord[]>();

  rows.forEach((row) => {
    const dayKey = toDateKey(row.checkDate);
    if (!dayKey) {
      return;
    }

    const current = grouped.get(dayKey) ?? [];
    current.push(row);
    grouped.set(dayKey, current);
  });

  const cursor = new Date(monthStart);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(monthEnd);
  end.setHours(0, 0, 0, 0);

  const days: AttendanceCalendarDay[] = [];
  while (cursor <= end) {
    const dayKey = toDateKey(cursor);
    const dayRows = grouped.get(dayKey) ?? [];
    days.push({
      date: dayKey,
      checkins: [...dayRows].sort((a, b) => new Date(a.checkDate).getTime() - new Date(b.checkDate).getTime()),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

export async function fetchStudentDetail(studentId: string) {
  const { data } = await apiClient.get<StudentDetail>(
    `/so-students/${studentId}`,
    withFilter({
      include: [{ relation: 'parents' }, { relation: 'soClass' }],
    })
  );

  return data;
}

export async function fetchClassDetail(classId: string) {
  const { data } = await apiClient.get<ClassDetail>(
    `/so-classes/${classId}`,
    withFilter({
      include: [
        {
          relation: 'soUsers',
          scope: {
            include: [{ relation: 'soRoles' }],
            order: ['name ASC'],
          },
        },
      ],
    })
  );

  return data;
}

export async function fetchStudentsByClassId(classId: string) {
  const { data } = await apiClient.get<StudentSummary[]>('/so-students',
    withFilter({
      where: { soClassId: classId },
      include: [{ relation: 'parents' }, { relation: 'soClass' }],
      order: ['name ASC'],
      limit: 1000,
    })
  );

  return data;
}

export async function fetchParentsByStudentId(studentId: string) {
  const { data } = await apiClient.get<ParentSummary[]>(`/so-students/${studentId}/parents`);
  return data;
}

export async function addParentsToStudent(studentId: string, parentIds: string[]) {
  const payload = { parentIds };
  await apiClient.post(`/so-students/${studentId}/parents`, payload);
}

export async function removeParentFromStudent(studentId: string, parentId: string) {
  await apiClient.delete(`/so-students/${studentId}/parents/${parentId}`);
}

export async function transferStudentClass(studentId: string, soClassId: string) {
  await apiClient.patch(`/so-students/${studentId}`, { soClassId });
}

export async function removeStudentFromClass(studentId: string) {
  await apiClient.patch(`/so-students/${studentId}`, { soClassId: null });
}

export async function updateStudentDetail(studentId: string, payload: Record<string, unknown>) {
  await apiClient.patch(`/so-students/${studentId}`, payload);
}

export async function updateClassDetail(classId: string, payload: Record<string, unknown>) {
  await apiClient.patch(`/so-classes/${classId}`, payload);
}

export async function assignTeachersToClass(classId: string, teacherIds: string[], currentTeacherIds: string[]) {
  const mergedTeacherIds = Array.from(new Set([...currentTeacherIds, ...teacherIds]));
  const idsToAdd = mergedTeacherIds.filter((id) => !currentTeacherIds.includes(id));

  if (idsToAdd.length === 0) {
    return;
  }

  await apiClient.post(`/so-classes/${classId}/so-users`, { userIds: idsToAdd });
}

export async function removeTeacherFromClass(classId: string, teacherId: string, currentTeacherIds: string[]) {
  if (!currentTeacherIds.includes(teacherId)) {
    return;
  }

  await apiClient.delete(`/so-classes/${classId}/so-users/${teacherId}`);
}

export async function fetchStudentAttendanceCalendar(studentId: string, month: string) {
  if (!studentId) {
    return [] as AttendanceCalendarDay[];
  }

  const monthStart = parseMonthStart(month);
  const monthEnd = getMonthEnd(monthStart);

  try {
    const { data } = await apiClient.get<AttendanceCalendarDay[]>('/so-checkins/calendar', {
      params: {
        soStudentId: studentId,
        month: toDateParam(monthStart),
      },
    });
    return data;
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  const { data } = await apiClient.get<AttendanceRecord[]>('/so-checkins', {
    params: {
      filter: JSON.stringify({
        where: {
          isDeleted: false,
          soStudentId: studentId,
          checkDate: {
            between: [monthStart.toISOString(), monthEnd.toISOString()],
          },
        },
        order: ['checkDate ASC'],
        limit: 2000,
      }),
    },
  }).catch((error) => {
    if (isNotFoundError(error)) {
      return { data: [] as AttendanceRecord[] };
    }
    throw error;
  });

  return buildCalendarDays(monthStart, monthEnd, Array.isArray(data) ? data : []);
}

export async function fetchClassAttendanceRecords({ classId, startDate, endDate }: ClassAttendanceQueryOptions) {
  if (!classId) {
    return [] as AttendanceRecord[];
  }

  const rangeStart = new Date(startDate);
  const rangeEnd = new Date(endDate);
  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    return [] as AttendanceRecord[];
  }

  rangeStart.setHours(0, 0, 0, 0);
  rangeEnd.setHours(23, 59, 59, 999);

  const { data } = await apiClient.get<AttendanceRecord[]>('/so-checkins', {
    params: {
      filter: JSON.stringify({
        where: {
          isDeleted: false,
          soClassesId: classId,
          checkDate: {
            between: [rangeStart.toISOString(), rangeEnd.toISOString()],
          },
        },
        include: [{ relation: 'soStudent' }],
        order: ['checkDate ASC'],
        limit: 10000,
      }),
    },
  });

  return Array.isArray(data) ? data : [];
}

export async function createAttendanceRecord(payload: AttendanceWritePayload) {
  const { data } = await apiClient.post<AttendanceRecord>('/so-checkins', payload);
  return data;
}

export async function updateAttendanceRecord(checkinId: string, payload: Partial<AttendanceWritePayload>) {
  await apiClient.patch(`/so-checkins/${checkinId}`, payload);
}

export async function deleteAttendanceRecord(checkinId: string) {
  await apiClient.delete(`/so-checkins/${checkinId}`);
}

export async function fetchClassStudentFees(classId: string) {
  if (!classId) {
    return [] as ClassStudentFeeRecord[];
  }

  const { data } = await apiClient.get<ClassStudentFeeRecord[]>(`/so-classes/${classId}/student-costs`);
  return Array.isArray(data) ? data : [];
}

export async function upsertClassStudentFee(classId: string, studentId: string, customCostPerSession?: number | null) {
  const { data } = await apiClient.post<{ status: string; item?: ClassStudentFeeRecord }>(
    `/so-classes/${classId}/student-costs/upsert`,
    {
      soStudentId: studentId,
      customCostPerSession: customCostPerSession ?? null,
    }
  );

  return data;
}

export async function upsertAttendanceRecords(items: AttendanceWritePayload[]) {
  if (items.length === 0) {
    return;
  }

  try {
    await apiClient.post('/so-checkins/bulk-upsert', { items });
    return;
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  for (const item of items) {
    const checkDate = new Date(item.checkDate);
    if (Number.isNaN(checkDate.getTime())) {
      continue;
    }

    const dayStart = new Date(checkDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(checkDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: existing } = await apiClient.get<AttendanceRecord[]>('/so-checkins', {
      params: {
        filter: JSON.stringify({
          where: {
            isDeleted: false,
            soStudentId: item.soStudentId,
            checkType: item.checkType,
            checkDate: { between: [dayStart.toISOString(), dayEnd.toISOString()] },
          },
          order: ['checkDate DESC'],
          limit: 1,
        }),
      },
    }).catch((error) => {
      if (isNotFoundError(error)) {
        throw new Error(CHECKIN_ENDPOINT_MISSING_MESSAGE);
      }
      throw error;
    });

    const payload = {
      checkType: item.checkType,
      checkDate: checkDate.toISOString(),
      soStudentId: item.soStudentId,
      soClassesId: item.soClassesId,
      note: item.note,
    };

    const first = Array.isArray(existing) ? existing[0] : undefined;
    if (first?.id) {
      await apiClient.patch(`/so-checkins/${String(first.id)}`, payload);
      continue;
    }

    await apiClient.post('/so-checkins', payload).catch((error) => {
      if (isNotFoundError(error)) {
        throw new Error(CHECKIN_ENDPOINT_MISSING_MESSAGE);
      }
      throw error;
    });
  }
}

export async function fetchClassStudentCount(classId: string) {
  const { data } = await apiClient.get<{ count: number }>('/so-students/count', withWhere({ soClassId: classId }));
  return data.count;
}

export async function fetchStudentLeavesByStudentId(studentId: string) {
  const { data } = await apiClient.get<StudentLeaveRecord[]>(
    '/so-student-leaves',
    withFilter({
      where: { soStudentId: studentId },
      include: [{ relation: 'soParent' }, { relation: 'soStudent' }, { relation: 'soUser' }],
      order: ['leaveStartDate DESC'],
      limit: 1000,
    })
  );

  return data;
}

export async function fetchStudentLeavesByStudentIds(studentIds: string[]) {
  if (studentIds.length === 0) {
    return [] as StudentLeaveRecord[];
  }

  const { data } = await apiClient.get<StudentLeaveRecord[]>(
    '/so-student-leaves',
    withFilter({
      where: { soStudentId: { inq: studentIds } },
      include: [{ relation: 'soParent' }, { relation: 'soStudent' }, { relation: 'soUser' }],
      order: ['leaveStartDate DESC'],
      limit: 1000,
    })
  );

  return data;
}
