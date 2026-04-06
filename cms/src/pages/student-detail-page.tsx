import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, ArrowUpRight, CalendarDays, Check, FileClock, FilePlus2, Loader2, Search, Unlink, UserPlus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ResourceFormDialog } from '../components/cms/resource-form-dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useConfirmDialog } from '../components/ui/confirm-dialog-provider';
import { Input } from '../components/ui/input';
import { DatePicker } from '../components/ui/date-picker';
import { MonthPicker } from '../components/ui/month-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cmsResourceMap } from '../config/resources';
import { useReferenceOptions } from '../hooks/use-reference-options';
import { createResource, fetchCollection } from '../services/cms-api';
import {
  addParentsToStudent,
  fetchClassDetail,
  fetchParentsByStudentId,
  fetchStudentAttendanceCalendar,
  fetchStudentDetail,
  fetchStudentLeavesByStudentId,
  removeParentFromStudent,
  transferStudentClass,
  upsertAttendanceRecords,
  updateStudentDetail,
  type AttendanceRecord,
  type ClassSummary,
  type LeaveStatus,
  type ParentSummary,
  type StudentLeaveRecord,
  type TeacherSummary,
} from '../services/cms-detail-api';
import { useAuthStore } from '../store/auth-store';
import type { CmsRecord } from '../types/cms';
import { formatDate, formatDateInput, getErrorMessage, toApiDateTime } from '../lib/utils';

const tabs = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'parents', label: 'Phụ huynh' },
  { key: 'class', label: 'Lớp học' },
  { key: 'attendance', label: 'Điểm danh' },
  { key: 'leaves', label: 'Nghỉ phép' },
] as const;

type StudentDetailTab = (typeof tabs)[number]['key'];

type AttendanceFilterType = 'all' | 'in' | 'out';
type LeaveFilterType = 'all' | LeaveStatus;

const EMPTY_SELECT_VALUE = '__empty_select__';

interface AttendanceRow {
  id: string;
  date: string;
  checkDate: string;
  checkType: 'in' | 'out';
  note?: string;
}

interface StudentFormState {
  name: string;
  gender: 'true' | 'false' | '';
  dob: string;
  phone: string;
  email: string;
  nationalId: string;
  address: string;
  avt: string;
}

const toMonthInput = (source: Date) => {
  const year = source.getFullYear();
  const month = String(source.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const toMonthDate = (monthInput: string) => `${monthInput}-01`;

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

const parseDay = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const parseMonth = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return new Date();
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return new Date();
  }
  return new Date(year, month - 1, 1);
};

const buildCheckDate = (dateInput: string) => {
  const raw = `${dateInput}T07:30:00`;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
};

const formatTime = (value: unknown) => {
  if (!value) {
    return '-';
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const toText = (value: unknown, fallback = '-') => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return fallback;
};

const getGenderLabel = (value: unknown) => {
  if (typeof value !== 'boolean') {
    return '-';
  }

  return value ? 'Nam' : 'Nữ';
};

const leaveStatusLabel = (status: LeaveStatus) => {
  if (status === 'approved') return 'Đã duyệt';
  if (status === 'reject') return 'Từ chối';
  return 'Đang chờ';
};

const leaveStatusVariant = (status: LeaveStatus) => {
  if (status === 'approved') return 'success' as const;
  if (status === 'reject') return 'danger' as const;
  return 'warning' as const;
};

const normalizeTeacherList = (source: unknown): TeacherSummary[] => {
  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .filter((item): item is TeacherSummary => Boolean(item && typeof item === 'object' && 'id' in item))
    .map((item) => ({ ...item, id: String(item.id) }));
};

const normalizeParentList = (source: unknown): ParentSummary[] => {
  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .filter((item): item is ParentSummary => Boolean(item && typeof item === 'object' && 'id' in item))
    .map((item) => ({ ...item, id: String(item.id) }));
};

const normalizeClass = (source: unknown): ClassSummary | null => {
  if (!source || typeof source !== 'object' || !('id' in source)) {
    return null;
  }

  const value = source as ClassSummary;
  return {
    ...value,
    id: String(value.id),
  };
};

const createEmptyStudentForm = (): StudentFormState => ({
  name: '',
  gender: '',
  dob: '',
  phone: '',
  email: '',
  nationalId: '',
  address: '',
  avt: '',
});

function TabToggle({
  activeTab,
  onChange,
}: {
  activeTab: StudentDetailTab;
  onChange: (tab: StudentDetailTab) => void;
}) {
  return (
    <div className='flex flex-wrap gap-2'>
      {tabs.map((tab) => (
        <Button
          key={tab.key}
          type='button'
          variant={activeTab === tab.key ? 'default' : 'secondary'}
          size='sm'
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}

export function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id ? String(params.id) : '';
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  const profile = useAuthStore((state) => state.profile);
  const leaveResource = cmsResourceMap['student-leaves'];
  const { map: referenceOptions } = useReferenceOptions();

  const [activeTab, setActiveTab] = useState<StudentDetailTab>('overview');
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [attendanceMonth, setAttendanceMonth] = useState(() => toMonthInput(new Date()));
  const [attendanceType, setAttendanceType] = useState<AttendanceFilterType>('all');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceView, setAttendanceView] = useState<'list' | 'calendar'>('list');
  const [attendanceActionDate, setAttendanceActionDate] = useState(() => formatDateInput(new Date().toISOString()));
  const [attendanceActionType, setAttendanceActionType] = useState<'in' | 'out'>('in');
  const [attendanceActionNote, setAttendanceActionNote] = useState('');
  const [attendanceSelectedDayKey, setAttendanceSelectedDayKey] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveFilterType>('all');
  const [leaveSearch, setLeaveSearch] = useState('');
  const [leaveFormOpen, setLeaveFormOpen] = useState(false);
  const [leaveFormInitialData, setLeaveFormInitialData] = useState<CmsRecord | null>(null);
  const [studentForm, setStudentForm] = useState<StudentFormState>(createEmptyStudentForm());

  const studentQuery = useQuery({
    queryKey: ['student-detail', studentId],
    queryFn: () => fetchStudentDetail(studentId),
    enabled: Boolean(studentId),
  });

  const parentsQuery = useQuery({
    queryKey: ['student-parents', studentId],
    queryFn: () => fetchParentsByStudentId(studentId),
    enabled: Boolean(studentId),
  });

  const parentOptionsQuery = useQuery({
    queryKey: ['student-detail', 'parents-options'],
    queryFn: () => fetchCollection('/so-parents', { limit: 1000, order: ['name ASC'] }),
  });

  const classOptionsQuery = useQuery({
    queryKey: ['student-detail', 'class-options'],
    queryFn: () => fetchCollection('/so-classes', { limit: 1000, order: ['name ASC'] }),
  });

  const currentClassId = studentQuery.data?.soClassId ? String(studentQuery.data.soClassId) : '';

  const classDetailQuery = useQuery({
    queryKey: ['class-detail', currentClassId],
    queryFn: () => fetchClassDetail(currentClassId),
    enabled: Boolean(currentClassId),
  });

  const attendanceQuery = useQuery({
    queryKey: ['student-attendance', studentId, attendanceMonth],
    queryFn: () => fetchStudentAttendanceCalendar(studentId, toMonthDate(attendanceMonth)),
    enabled: Boolean(studentId),
  });

  const leavesQuery = useQuery({
    queryKey: ['student-leaves', studentId],
    queryFn: () => fetchStudentLeavesByStudentId(studentId),
    enabled: Boolean(studentId),
  });

  useEffect(() => {
    setSelectedClassId(currentClassId);
  }, [currentClassId]);

  useEffect(() => {
    if (!studentQuery.data) {
      return;
    }

    setStudentForm({
      name: toText(studentQuery.data.name, ''),
      gender: typeof studentQuery.data.gender === 'boolean' ? (studentQuery.data.gender ? 'true' : 'false') : '',
      dob: formatDateInput(studentQuery.data.dob),
      phone: toText(studentQuery.data.phone, ''),
      email: toText(studentQuery.data.email, ''),
      nationalId: toText(studentQuery.data.nationalId, ''),
      address: toText(studentQuery.data.address, ''),
      avt: toText(studentQuery.data.avt, ''),
    });
  }, [studentQuery.data]);

  const linkedParents = useMemo(() => normalizeParentList(parentsQuery.data ?? studentQuery.data?.parents), [parentsQuery.data, studentQuery.data?.parents]);

  const allParents = useMemo(() => normalizeParentList(parentOptionsQuery.data), [parentOptionsQuery.data]);

  const allClasses = useMemo(() => {
    if (!Array.isArray(classOptionsQuery.data)) {
      return [] as ClassSummary[];
    }

    return classOptionsQuery.data
      .filter((item): item is ClassSummary => Boolean(item && typeof item === 'object' && 'id' in item))
      .map((item) => ({ ...item, id: String(item.id) }));
  }, [classOptionsQuery.data]);

  const currentClass = useMemo(() => {
    const classFromStudent = normalizeClass(studentQuery.data?.soClass);
    if (classFromStudent) {
      return classFromStudent;
    }

    return classDetailQuery.data ?? null;
  }, [studentQuery.data?.soClass, classDetailQuery.data]);

  const homeroomTeachers = useMemo(
    () => normalizeTeacherList(classDetailQuery.data?.soUsers ?? currentClass?.soUsers),
    [classDetailQuery.data?.soUsers, currentClass?.soUsers]
  );

  const linkedParentIdSet = useMemo(() => new Set(linkedParents.map((item) => String(item.id))), [linkedParents]);

  const filteredParentOptions = useMemo(() => {
    const keyword = parentSearch.trim().toLowerCase();

    return allParents.filter((item) => {
      if (linkedParentIdSet.has(String(item.id))) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack = `${toText(item.name, '')} ${toText(item.phone, '')} ${toText(item.email, '')} ${toText(item.relation, '')}`
        .toLowerCase()
        .trim();

      return haystack.includes(keyword);
    });
  }, [allParents, linkedParentIdSet, parentSearch]);

  const attendanceRows = useMemo(() => {
    const source = attendanceQuery.data ?? [];
    const rows: AttendanceRow[] = [];

    source.forEach((day) => {
      const checkins = Array.isArray(day.checkins) ? day.checkins : [];
      checkins.forEach((checkin: AttendanceRecord, index) => {
        rows.push({
          id: `${String(checkin.id ?? `${day.date}-${index}`)}`,
          date: day.date,
          checkDate: checkin.checkDate,
          checkType: checkin.checkType,
          note: checkin.note,
        });
      });
    });

    return rows.sort((a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime());
  }, [attendanceQuery.data]);

  const filteredAttendanceRows = useMemo(() => {
    const keyword = attendanceSearch.trim().toLowerCase();

    return attendanceRows.filter((item) => {
      if (attendanceType !== 'all' && item.checkType !== attendanceType) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack = `${item.date} ${toText(item.note, '')}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [attendanceRows, attendanceSearch, attendanceType]);

  const totalCheckIn = useMemo(
    () => attendanceRows.filter((item) => item.checkType === 'in').length,
    [attendanceRows]
  );

  const totalCheckOut = useMemo(
    () => attendanceRows.filter((item) => item.checkType === 'out').length,
    [attendanceRows]
  );

  const attendanceMonthDate = useMemo(() => parseMonth(attendanceMonth), [attendanceMonth]);

  const effectiveSelectedDayKey = useMemo(() => {
    if (attendanceSelectedDayKey.startsWith(attendanceMonth)) {
      return attendanceSelectedDayKey;
    }
    return `${attendanceMonth}-01`;
  }, [attendanceMonth, attendanceSelectedDayKey]);

  const selectedCalendarDate = useMemo(() => parseDay(effectiveSelectedDayKey), [effectiveSelectedDayKey]);

  const calendarMarkedDays = useMemo(() => {
    const source = attendanceQuery.data ?? [];
    return source
      .filter((day) => Array.isArray(day.checkins) && day.checkins.length > 0)
      .map((day) => parseDay(day.date))
      .filter((date): date is Date => Boolean(date));
  }, [attendanceQuery.data]);

  const selectedCalendarRows = useMemo(() => {
    const source = attendanceQuery.data ?? [];
    const selectedDay = source.find((day) => day.date === effectiveSelectedDayKey);
    if (!selectedDay || !Array.isArray(selectedDay.checkins)) {
      return [] as AttendanceRecord[];
    }

    return [...selectedDay.checkins].sort((a, b) => new Date(a.checkDate).getTime() - new Date(b.checkDate).getTime());
  }, [attendanceQuery.data, effectiveSelectedDayKey]);

  const leaveRows = useMemo(() => {
    const source = leavesQuery.data ?? [];
    return source
      .filter((item): item is StudentLeaveRecord => Boolean(item && typeof item === 'object' && 'id' in item))
      .map((item) => ({ ...item, id: String(item.id) }))
      .sort((a, b) => new Date(String(b.leaveStartDate)).getTime() - new Date(String(a.leaveStartDate)).getTime());
  }, [leavesQuery.data]);

  const filteredLeaveRows = useMemo(() => {
    const keyword = leaveSearch.trim().toLowerCase();

    return leaveRows.filter((item) => {
      if (leaveType !== 'all' && item.leaveStatus !== leaveType) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const studentName = item.soStudent?.name ? String(item.soStudent.name) : '';
      const parentName = item.soParent?.name ? String(item.soParent.name) : '';
      const approverName = item.soUser?.name ? String(item.soUser.name) : '';

      const haystack = `${item.reason ?? ''} ${item.leaveStartDate ?? ''} ${item.leaveEndDate ?? ''} ${studentName} ${parentName} ${approverName}`
        .toLowerCase()
        .trim();

      return haystack.includes(keyword);
    });
  }, [leaveRows, leaveSearch, leaveType]);

  const leaveWaitingCount = useMemo(() => leaveRows.filter((item) => item.leaveStatus === 'waiting').length, [leaveRows]);
  const leaveApprovedCount = useMemo(() => leaveRows.filter((item) => item.leaveStatus === 'approved').length, [leaveRows]);
  const leaveRejectedCount = useMemo(() => leaveRows.filter((item) => item.leaveStatus === 'reject').length, [leaveRows]);

  const isStudentFormDirty = useMemo(() => {
    if (!studentQuery.data) {
      return false;
    }

    return (
      studentForm.name !== toText(studentQuery.data.name, '') ||
      studentForm.gender !== (typeof studentQuery.data.gender === 'boolean' ? (studentQuery.data.gender ? 'true' : 'false') : '') ||
      studentForm.dob !== formatDateInput(studentQuery.data.dob) ||
      studentForm.phone !== toText(studentQuery.data.phone, '') ||
      studentForm.email !== toText(studentQuery.data.email, '') ||
      studentForm.nationalId !== toText(studentQuery.data.nationalId, '') ||
      studentForm.address !== toText(studentQuery.data.address, '') ||
      studentForm.avt !== toText(studentQuery.data.avt, '')
    );
  }, [studentForm, studentQuery.data]);

  const buildStudentUpdatePayload = () => {
    if (!studentQuery.data) {
      return {} as Record<string, unknown>;
    }

    const payload: Record<string, unknown> = {};

    const originalName = toText(studentQuery.data.name, '');
    const nextName = studentForm.name.trim();
    if (nextName !== originalName) {
      payload.name = nextName;
    }

    const originalGender = typeof studentQuery.data.gender === 'boolean' ? (studentQuery.data.gender ? 'true' : 'false') : '';
    const nextGender = studentForm.gender;
    if (nextGender !== originalGender) {
      payload.gender = nextGender === 'true';
    }

    const originalDob = toApiDateTime(formatDateInput(studentQuery.data.dob));
    const nextDob = toApiDateTime(studentForm.dob.trim());
    if (nextDob && nextDob !== originalDob) {
      payload.dob = nextDob;
    }

    const optionalFields: Array<{ key: keyof StudentFormState; payloadKey: string }> = [
      { key: 'phone', payloadKey: 'phone' },
      { key: 'email', payloadKey: 'email' },
      { key: 'nationalId', payloadKey: 'nationalId' },
      { key: 'address', payloadKey: 'address' },
      { key: 'avt', payloadKey: 'avt' },
    ];

    for (const field of optionalFields) {
      const original = toText(studentQuery.data[field.payloadKey], '').trim();
      const next = studentForm[field.key].trim();
      if (next !== original && next) {
        payload[field.payloadKey] = next;
      }
    }

    return payload;
  };

  const updateStudentMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateStudentDetail(studentId, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin học sinh.');
      queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'student-links'] });
      queryClient.invalidateQueries({ queryKey: ['class-detail'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const addParentMutation = useMutation({
    mutationFn: (parentIds: string[]) => addParentsToStudent(studentId, parentIds),
    onSuccess: () => {
      toast.success('Đã thêm phụ huynh quản lý học sinh.');
      setSelectedParentIds([]);
      queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-parents', studentId] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'parents'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'student-links'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'parents-links'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const removeParentMutation = useMutation({
    mutationFn: (parentId: string) => removeParentFromStudent(studentId, parentId),
    onSuccess: () => {
      toast.success('Đã gỡ liên kết phụ huynh khỏi học sinh.');
      queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-parents', studentId] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'parents'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'student-links'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'parents-links'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const transferClassMutation = useMutation({
    mutationFn: (classId: string) => transferStudentClass(studentId, classId),
    onSuccess: () => {
      toast.success('Đã chuyển lớp cho học sinh thành công.');
      queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'classes'] });
      queryClient.invalidateQueries({ queryKey: ['class-detail'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const attendanceActionMutation = useMutation({
    mutationFn: (payload: { date: string; checkType: 'in' | 'out'; note: string }) =>
      upsertAttendanceRecords([
        {
          soStudentId: studentId,
          soClassesId: currentClassId || undefined,
          checkType: payload.checkType,
          checkDate: buildCheckDate(payload.date),
          note: payload.note.trim() || undefined,
        },
      ]),
    onSuccess: () => {
      toast.success('Đã cập nhật điểm danh cho học sinh.');
      queryClient.invalidateQueries({ queryKey: ['student-attendance', studentId] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const createLeaveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createResource('/so-student-leaves', payload),
    onSuccess: () => {
      toast.success('Đã tạo đơn xin nghỉ phép cho học sinh.');
      queryClient.invalidateQueries({ queryKey: ['student-leaves', studentId] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'student-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['resource-count', 'student-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  if (!studentId) {
    return (
      <Card>
        <CardContent className='p-6'>
          <p>Thiếu mã học sinh.</p>
        </CardContent>
      </Card>
    );
  }

  if (studentQuery.isLoading) {
    return (
      <Card>
        <CardContent className='flex items-center gap-2 p-6 text-muted-foreground'>
          <Loader2 className='h-4 w-4 animate-spin' />
          Đang tải dữ liệu học sinh...
        </CardContent>
      </Card>
    );
  }

  if (studentQuery.error || !studentQuery.data) {
    return (
      <Card>
        <CardContent className='space-y-3 p-6'>
          <p className='font-medium text-danger'>Không thể tải chi tiết học sinh.</p>
          <p className='text-sm text-muted-foreground'>{getErrorMessage(studentQuery.error)}</p>
          <Button asChild variant='secondary'>
            <Link to='/students'>Quay lại danh sách học sinh</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const student = studentQuery.data;
  const todayValue = formatDateInput(new Date().toISOString());

  return (
    <div className='space-y-5 animate-fade-in'>
      <Card>
        <CardContent className='flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <div className='mb-2'>
              <Button asChild variant='secondary' size='sm'>
                <Link to='/students'>Quay lại danh sách học sinh</Link>
              </Button>
            </div>
            <h1 className='font-display text-2xl font-bold'>Chi tiết học sinh: {toText(student.name, 'Không rõ tên')}</h1>
            <p className='mt-1 text-sm text-muted-foreground'>Mã học sinh: {student.id}</p>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='secondary'>Giới tính: {getGenderLabel(student.gender)}</Badge>
            <Badge variant='secondary'>Ngày sinh: {formatDate(student.dob)}</Badge>
            <Badge variant='secondary'>Lớp: {toText(currentClass?.name, 'Chưa phân lớp')}</Badge>
          </div>
        </CardContent>
      </Card>

      <section className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader>
            <CardDescription>Phụ huynh đang liên kết</CardDescription>
            <CardTitle>{linkedParents.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Giáo viên chủ nhiệm</CardDescription>
            <CardTitle>{homeroomTeachers.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Điểm danh tháng đã chọn</CardDescription>
            <CardTitle>{attendanceRows.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Đơn nghỉ phép</CardDescription>
            <CardTitle>{leaveRows.length}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardContent className='p-4'>
          <TabToggle activeTab={activeTab} onChange={setActiveTab} />
        </CardContent>
      </Card>

      {activeTab === 'overview' ? (
        <section className='grid gap-4 lg:grid-cols-3'>
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Thông tin hồ sơ học sinh</CardTitle>
              <CardDescription>Xem chi tiết và cập nhật trực tiếp thông tin học sinh tại đây</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <div>
                  <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Họ tên *</p>
                  <Input
                    value={studentForm.name}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder='Nhập họ tên học sinh'
                  />
                </div>

                <div>
                  <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Giới tính *</p>
                  <Select
                    value={studentForm.gender || EMPTY_SELECT_VALUE}
                    onValueChange={(value) =>
                      setStudentForm((prev) => ({
                        ...prev,
                        gender: value === EMPTY_SELECT_VALUE ? '' : (value as StudentFormState['gender']),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Chọn giới tính' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY_SELECT_VALUE}>Chọn giới tính</SelectItem>
                      <SelectItem value='true'>Nam</SelectItem>
                      <SelectItem value='false'>Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Ngày sinh *</p>
                  <DatePicker value={studentForm.dob} onChange={(nextValue) => setStudentForm((prev) => ({ ...prev, dob: nextValue }))} />
                </div>

                <div>
                  <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Số điện thoại</p>
                  <Input
                    value={studentForm.phone}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder='Số điện thoại'
                  />
                </div>

                <div>
                  <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Email</p>
                  <Input
                    value={studentForm.email}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder='Email'
                  />
                </div>

                <div>
                  <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Mã định danh</p>
                  <Input
                    value={studentForm.nationalId}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, nationalId: event.target.value }))}
                    placeholder='Mã định danh'
                  />
                </div>

                <div className='sm:col-span-2'>
                  <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Avatar URL</p>
                  <Input
                    value={studentForm.avt}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, avt: event.target.value }))}
                    placeholder='https://...'
                  />
                </div>

                <div className='sm:col-span-2'>
                  <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Địa chỉ</p>
                  <Textarea
                    rows={4}
                    value={studentForm.address}
                    onChange={(event) => setStudentForm((prev) => ({ ...prev, address: event.target.value }))}
                    placeholder='Địa chỉ học sinh'
                  />
                </div>
              </div>

              <div className='flex justify-end'>
                <Button
                  onClick={() => {
                    const name = studentForm.name.trim();
                    const dob = studentForm.dob.trim();
                    const gender = studentForm.gender;

                    if (!name) {
                      toast.error('Họ tên học sinh là bắt buộc.');
                      return;
                    }

                    if (!dob) {
                      toast.error('Ngày sinh là bắt buộc.');
                      return;
                    }

                    if (!gender) {
                      toast.error('Giới tính là bắt buộc.');
                      return;
                    }

                    const payload = buildStudentUpdatePayload();
                    if (Object.keys(payload).length === 0) {
                      toast.error('Chưa có thay đổi để cập nhật.');
                      return;
                    }

                    updateStudentMutation.mutate(payload);
                  }}
                  disabled={!isStudentFormDirty || updateStudentMutation.isPending}
                >
                  {updateStudentMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
                  Lưu thông tin học sinh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lớp hiện tại</CardTitle>
              <CardDescription>Thông tin lớp và điều hướng nhanh</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Tên lớp</p>
                <p className='mt-1 font-semibold'>{toText(currentClass?.name, 'Chưa phân lớp')}</p>
              </div>

              {currentClass?.id ? (
                <Button asChild className='w-full' variant='secondary'>
                  <Link to={`/classes/${currentClass.id}`}>
                    Đi tới chi tiết lớp học
                    <ArrowUpRight className='h-4 w-4' />
                  </Link>
                </Button>
              ) : null}

              <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Giáo viên chủ nhiệm</p>
                {classDetailQuery.isLoading ? (
                  <p className='mt-1 text-sm text-muted-foreground'>Đang tải...</p>
                ) : homeroomTeachers.length > 0 ? (
                  <div className='mt-1 space-y-1'>
                    {homeroomTeachers.map((teacher) => (
                      <p key={teacher.id} className='text-sm'>
                        {toText(teacher.name)} ({toText(teacher.username, 'không có username')})
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className='mt-1 text-sm text-muted-foreground'>Chưa có giáo viên chủ nhiệm.</p>
                )}
              </div>

              <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Nghỉ phép</p>
                <div className='mt-2 flex flex-wrap items-center gap-2'>
                  <Badge variant='warning'>Chờ duyệt: {leaveWaitingCount}</Badge>
                  <Badge variant='success'>Đã duyệt: {leaveApprovedCount}</Badge>
                  <Badge variant='danger'>Từ chối: {leaveRejectedCount}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === 'parents' ? (
        <section className='grid gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Phụ huynh quản lý</CardTitle>
              <CardDescription>Xem và gỡ liên kết phụ huynh khỏi học sinh</CardDescription>
            </CardHeader>

            <CardContent>
              <div className='overflow-x-auto rounded-xl border border-border/70'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Quan hệ</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead className='text-right'>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parentsQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className='text-center text-muted-foreground'>
                          Đang tải phụ huynh...
                        </TableCell>
                      </TableRow>
                    ) : linkedParents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className='text-center text-muted-foreground'>
                          Học sinh chưa có phụ huynh liên kết.
                        </TableCell>
                      </TableRow>
                    ) : (
                      linkedParents.map((parent) => (
                        <TableRow key={parent.id}>
                          <TableCell className='font-medium'>{toText(parent.name)}</TableCell>
                          <TableCell>{toText(parent.relation)}</TableCell>
                          <TableCell>{toText(parent.phone, toText(parent.email))}</TableCell>
                          <TableCell className='text-right'>
                            <Button
                              variant='ghost'
                              size='sm'
                              disabled={removeParentMutation.isPending}
                              onClick={async () => {
                                const confirmed = await confirmDialog({
                                  title: 'Gỡ liên kết phụ huynh',
                                  description: 'Gỡ liên kết phụ huynh này khỏi học sinh?',
                                  confirmText: 'Gỡ liên kết',
                                  variant: 'danger',
                                });
                                if (!confirmed) return;
                                removeParentMutation.mutate(String(parent.id));
                              }}
                            >
                              <Unlink className='h-4 w-4 text-danger' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thêm phụ huynh quản lý</CardTitle>
              <CardDescription>Chọn một hoặc nhiều phụ huynh rồi lưu liên kết</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  className='pl-9'
                  value={parentSearch}
                  placeholder='Tìm phụ huynh theo tên, sđt, email...'
                  onChange={(event) => setParentSearch(event.target.value)}
                />
              </div>

              <select
                multiple
                value={selectedParentIds}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                  setSelectedParentIds(values);
                }}
                className='min-h-64 w-full rounded-xl border border-border bg-white/90 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                {filteredParentOptions.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {toText(item.name)} {item.relation ? `- ${String(item.relation)}` : ''}
                  </option>
                ))}
              </select>

              <p className='text-xs text-muted-foreground'>Giữ Ctrl/Cmd để chọn nhiều mục cùng lúc.</p>

              <Button
                className='w-full'
                onClick={() => {
                  if (selectedParentIds.length === 0) {
                    toast.error('Vui lòng chọn ít nhất một phụ huynh.');
                    return;
                  }
                  addParentMutation.mutate(selectedParentIds);
                }}
                disabled={addParentMutation.isPending || filteredParentOptions.length === 0}
              >
                {addParentMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <UserPlus className='h-4 w-4' />}
                Thêm phụ huynh đã chọn
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === 'class' ? (
        <section className='grid gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin lớp học hiện tại</CardTitle>
              <CardDescription>Xem lớp đang học và giáo viên chủ nhiệm</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Tên lớp</p>
                <p className='mt-1 font-semibold'>{toText(currentClass?.name, 'Chưa phân lớp')}</p>
              </div>

              {currentClass?.id ? (
                <Button asChild variant='secondary' className='w-full'>
                  <Link to={`/classes/${currentClass.id}`}>
                    Đi tới chi tiết lớp học
                    <ArrowUpRight className='h-4 w-4' />
                  </Link>
                </Button>
              ) : null}

              <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Giáo viên chủ nhiệm</p>
                {homeroomTeachers.length > 0 ? (
                  <div className='mt-1 space-y-1'>
                    {homeroomTeachers.map((teacher) => (
                      <p key={teacher.id} className='text-sm'>
                        {toText(teacher.name)} - {toText(teacher.phone, toText(teacher.email, 'Không có liên hệ'))}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className='mt-1 text-sm text-muted-foreground'>Chưa có thông tin giáo viên chủ nhiệm.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chuyển lớp học</CardTitle>
              <CardDescription>Đổi lớp hiện tại cho học sinh</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Select value={selectedClassId || EMPTY_SELECT_VALUE} onValueChange={(value) => setSelectedClassId(value === EMPTY_SELECT_VALUE ? '' : value)}>
                <SelectTrigger className='h-11'>
                  <SelectValue placeholder='Chọn lớp mới' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_SELECT_VALUE}>Chọn lớp mới</SelectItem>
                  {allClasses.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {toText(item.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className='w-full'
                onClick={async () => {
                  if (!selectedClassId) {
                    toast.error('Vui lòng chọn lớp muốn chuyển.');
                    return;
                  }

                  if (selectedClassId === currentClassId) {
                    toast.error('Học sinh đang ở lớp đã chọn.');
                    return;
                  }

                  const confirmed = await confirmDialog({
                    title: 'Chuyển lớp học',
                    description: 'Xác nhận chuyển lớp cho học sinh?',
                    confirmText: 'Chuyển lớp',
                  });
                  if (!confirmed) return;
                  transferClassMutation.mutate(selectedClassId);
                }}
                disabled={transferClassMutation.isPending || classOptionsQuery.isLoading}
              >
                {transferClassMutation.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <ArrowRightLeft className='h-4 w-4' />
                )}
                Lưu chuyển lớp
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === 'attendance' ? (
        <section className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CalendarDays className='h-5 w-5 text-primary' />
                Thông tin điểm danh
              </CardTitle>
              <CardDescription>Điểm danh trực tiếp cho học sinh và xem dữ liệu theo danh sách hoặc theo lịch</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                  <p className='text-sm font-semibold'>Thao tác điểm danh nhanh</p>
                  <div className='flex items-center gap-2'>
                    <Button
                      type='button'
                      size='sm'
                      variant={attendanceView === 'list' ? 'default' : 'secondary'}
                      onClick={() => setAttendanceView('list')}
                    >
                      Danh sách
                    </Button>
                    <Button
                      type='button'
                      size='sm'
                      variant={attendanceView === 'calendar' ? 'default' : 'secondary'}
                      onClick={() => setAttendanceView('calendar')}
                    >
                      Lịch
                    </Button>
                  </div>
                </div>

                <div className='grid gap-3 lg:grid-cols-4'>
                  <DatePicker value={attendanceActionDate} onChange={setAttendanceActionDate} />

                  <Select value={attendanceActionType} onValueChange={(value) => setAttendanceActionType(value as 'in' | 'out')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='in'>Check-in</SelectItem>
                      <SelectItem value='out'>Check-out</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    value={attendanceActionNote}
                    placeholder='Ghi chú điểm danh (tuỳ chọn)'
                    onChange={(event) => setAttendanceActionNote(event.target.value)}
                  />

                  <Button
                    onClick={() => {
                      if (!attendanceActionDate) {
                        toast.error('Vui lòng chọn ngày điểm danh.');
                        return;
                      }

                      attendanceActionMutation.mutate({
                        date: attendanceActionDate,
                        checkType: attendanceActionType,
                        note: attendanceActionNote,
                      });
                    }}
                    disabled={attendanceActionMutation.isPending}
                  >
                    {attendanceActionMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Check className='h-4 w-4' />}
                    Cập nhật điểm danh
                  </Button>
                </div>
              </div>

              <div className='grid gap-3 lg:grid-cols-3'>
                <MonthPicker value={attendanceMonth} onChange={setAttendanceMonth} />

                <Select value={attendanceType} onValueChange={(value) => setAttendanceType(value as AttendanceFilterType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả loại</SelectItem>
                    <SelectItem value='in'>Check-in</SelectItem>
                    <SelectItem value='out'>Check-out</SelectItem>
                  </SelectContent>
                </Select>

                <div className='relative'>
                  <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    className='pl-9'
                    value={attendanceSearch}
                    placeholder='Tìm theo ngày hoặc ghi chú...'
                    onChange={(event) => setAttendanceSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className='grid gap-3 sm:grid-cols-3'>
                <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Tổng lượt</p>
                  <p className='mt-1 text-2xl font-semibold'>{attendanceRows.length}</p>
                </div>
                <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Check-in</p>
                  <p className='mt-1 text-2xl font-semibold'>{totalCheckIn}</p>
                </div>
                <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Check-out</p>
                  <p className='mt-1 text-2xl font-semibold'>{totalCheckOut}</p>
                </div>
              </div>

              {attendanceView === 'list' ? (
                <div className='overflow-x-auto rounded-xl border border-border/70'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Giờ</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceQuery.isLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className='text-center text-muted-foreground'>
                            Đang tải dữ liệu điểm danh...
                          </TableCell>
                        </TableRow>
                      ) : filteredAttendanceRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className='text-center text-muted-foreground'>
                            Không có dữ liệu điểm danh phù hợp bộ lọc.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAttendanceRows.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{formatDate(item.date)}</TableCell>
                            <TableCell>{formatTime(item.checkDate)}</TableCell>
                            <TableCell>
                              <Badge variant={item.checkType === 'in' ? 'success' : 'secondary'}>
                                {item.checkType === 'in' ? 'Check-in' : 'Check-out'}
                              </Badge>
                            </TableCell>
                            <TableCell>{toText(item.note)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className='grid gap-4 lg:grid-cols-[320px,1fr]'>
                  <div className='rounded-xl border border-border/70 bg-card p-3'>
                    <Calendar
                      mode='single'
                      month={attendanceMonthDate}
                      selected={selectedCalendarDate ?? undefined}
                      onSelect={(date) => {
                        if (!date) return;
                        setAttendanceSelectedDayKey(toDateKey(date));
                      }}
                      onMonthChange={(date) => {
                        setAttendanceMonth(toMonthInput(date));
                      }}
                      modifiers={{ hasRecord: calendarMarkedDays }}
                      modifiersClassNames={{
                        hasRecord: 'bg-emerald-500/20 text-emerald-700 font-semibold',
                      }}
                    />
                    <p className='mt-2 text-xs text-muted-foreground'>Ngày có dữ liệu điểm danh được tô xanh.</p>
                  </div>

                  <div className='rounded-xl border border-border/70 bg-card p-3'>
                    <p className='mb-3 text-sm font-semibold'>Chi tiết ngày {formatDate(effectiveSelectedDayKey)}</p>
                    <div className='overflow-x-auto'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Giờ</TableHead>
                            <TableHead>Loại</TableHead>
                            <TableHead>Ghi chú</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceQuery.isLoading ? (
                            <TableRow>
                              <TableCell colSpan={3} className='text-center text-muted-foreground'>
                                Đang tải dữ liệu điểm danh...
                              </TableCell>
                            </TableRow>
                          ) : selectedCalendarRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className='text-center text-muted-foreground'>
                                Ngày này chưa có dữ liệu điểm danh.
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedCalendarRows.map((item) => (
                              <TableRow key={String(item.id)}>
                                <TableCell>{formatTime(item.checkDate)}</TableCell>
                                <TableCell>
                                  <Badge variant={item.checkType === 'in' ? 'success' : 'secondary'}>
                                    {item.checkType === 'in' ? 'Check-in' : 'Check-out'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{toText(item.note)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === 'leaves' ? (
        <section className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileClock className='h-5 w-5 text-primary' />
                Thông tin nghỉ phép
              </CardTitle>
              <CardDescription>Danh sách đơn xin nghỉ phép của học sinh, có thể lọc theo trạng thái và nội dung.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-3 lg:grid-cols-4'>
                <Select value={leaveType} onValueChange={(value) => setLeaveType(value as LeaveFilterType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                    <SelectItem value='waiting'>Đang chờ</SelectItem>
                    <SelectItem value='approved'>Đã duyệt</SelectItem>
                    <SelectItem value='reject'>Từ chối</SelectItem>
                  </SelectContent>
                </Select>

                <div className='relative'>
                  <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    className='pl-9'
                    value={leaveSearch}
                    placeholder='Tìm theo lý do, phụ huynh, người duyệt...'
                    onChange={(event) => setLeaveSearch(event.target.value)}
                  />
                </div>

                <Button
                  onClick={() => {
                    setLeaveFormInitialData({
                      id: `support-${Date.now()}`,
                      leaveStatus: 'approved',
                      soStudentId: studentId,
                      soParentId: linkedParents[0]?.id ? String(linkedParents[0].id) : '',
                      soUserId: profile?.id ? String(profile.id) : '',
                      leaveStartDate: todayValue,
                      leaveEndDate: todayValue,
                      reason: '',
                    } as CmsRecord);
                    setLeaveFormOpen(true);
                  }}
                >
                  <FilePlus2 className='h-4 w-4' />
                  Hỗ trợ tạo đơn
                </Button>

                <Button asChild variant='secondary'>
                  <Link to='/student-leaves'>Đi tới module đơn nghỉ</Link>
                </Button>
              </div>

              <div className='grid gap-3 sm:grid-cols-3'>
                <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Đang chờ</p>
                  <p className='mt-1 text-2xl font-semibold'>{leaveWaitingCount}</p>
                </div>
                <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Đã duyệt</p>
                  <p className='mt-1 text-2xl font-semibold'>{leaveApprovedCount}</p>
                </div>
                <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Từ chối</p>
                  <p className='mt-1 text-2xl font-semibold'>{leaveRejectedCount}</p>
                </div>
              </div>

              <div className='overflow-x-auto rounded-xl border border-border/70'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Từ ngày</TableHead>
                      <TableHead>Đến ngày</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Phụ huynh</TableHead>
                      <TableHead>Người duyệt</TableHead>
                      <TableHead>Lý do</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leavesQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center text-muted-foreground'>
                          Đang tải dữ liệu nghỉ phép...
                        </TableCell>
                      </TableRow>
                    ) : filteredLeaveRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center text-muted-foreground'>
                          Không có đơn nghỉ phép phù hợp bộ lọc.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeaveRows.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatDate(item.leaveStartDate)}</TableCell>
                          <TableCell>{formatDate(item.leaveEndDate)}</TableCell>
                          <TableCell>
                            <Badge variant={leaveStatusVariant(item.leaveStatus)}>{leaveStatusLabel(item.leaveStatus)}</Badge>
                          </TableCell>
                          <TableCell>{toText(item.soParent?.name)}</TableCell>
                          <TableCell>{toText(item.soUser?.name, 'Chưa duyệt')}</TableCell>
                          <TableCell className='max-w-lg whitespace-normal'>{toText(item.reason)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <ResourceFormDialog
        resource={leaveResource}
        mode='create'
        open={leaveFormOpen}
        loading={createLeaveMutation.isPending}
        initialData={leaveFormInitialData}
        referenceOptions={referenceOptions}
        onOpenChange={(nextOpen) => {
          setLeaveFormOpen(nextOpen);
          if (!nextOpen) {
            setLeaveFormInitialData(null);
          }
        }}
        onSubmit={async (payload) => {
          await createLeaveMutation.mutateAsync(payload);
        }}
      />
    </div>
  );
}
