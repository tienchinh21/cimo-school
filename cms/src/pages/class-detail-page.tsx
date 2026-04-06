import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  CalendarCheck2,
  Copy,
  Download,
  FileClock,
  Loader2,
  LogIn,
  LogOut,
  Minus,
  Pencil,
  ReceiptText,
  Search,
  Share2,
  Trash2,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { toBlob } from 'html-to-image';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useConfirmDialog } from '../components/ui/confirm-dialog-provider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { DateRangePicker } from '../components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { fetchCollection } from '../services/cms-api';
import {
  assignTeachersToClass,
  createAttendanceRecord,
  deleteAttendanceRecord,
  fetchClassDetail,
  fetchClassAttendanceRecords,
  fetchClassStudentFees,
  fetchClassStudentCount,
  fetchStudentLeavesByStudentIds,
  fetchStudentsByClassId,
  removeStudentFromClass,
  removeTeacherFromClass,
  transferStudentClass,
  updateClassDetail,
  updateAttendanceRecord,
  upsertClassStudentFee,
  type AttendanceRecord,
  type AttendanceWritePayload,
  type ClassStudentFeeRecord,
  type LeaveStatus,
  type StudentSummary,
  type StudentLeaveRecord,
  type TeacherSummary,
} from '../services/cms-detail-api';
import { cn, formatDate, formatDateInput, getErrorMessage, joinNames, toApiDateTime } from '../lib/utils';

const desktopTabs = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'students', label: 'Học sinh' },
  { key: 'teachers', label: 'Giáo viên chủ nhiệm' },
  { key: 'attendance', label: 'Điểm danh' },
  { key: 'leaves', label: 'Nghỉ phép' },
] as const;

const mobileTabs = [
  { key: 'attendance-mobile', label: 'Điểm Danh' },
  { key: 'students', label: 'Học sinh' },
] as const;

type DesktopTabKey = (typeof desktopTabs)[number]['key'];
type MobileTabKey = (typeof mobileTabs)[number]['key'];
type ClassDetailTab = DesktopTabKey | MobileTabKey;
type LeaveStatusFilter = 'all' | LeaveStatus;

interface AttendanceCell {
  dateKey: string;
  firstCheckin?: AttendanceRecord;
  checkins: AttendanceRecord[];
}

interface AttendanceMatrixRow {
  studentId: string;
  studentName: string;
  presentSessions: number;
  customCostPerSession?: number;
  cells: AttendanceCell[];
}

interface AttendanceCellEditingState {
  studentId: string;
  dateKey: string;
}

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

const toTimeInput = (value: unknown) => {
  if (!value) {
    return '08:00';
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '08:00';
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const buildCheckDateTime = (dateKey: string, timeInput: string) => {
  const [year, month, day] = dateKey.split('-').map((item) => Number(item));
  const [hours, minutes] = timeInput.split(':').map((item) => Number(item));
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) {
    return new Date().toISOString();
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const toCurrencyDigits = (value: string) => value.replace(/[^\d]/g, '');

const formatCurrencyInput = (value: string) => {
  const digits = toCurrencyDigits(value);
  if (!digits) {
    return '';
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const toFileSafeToken = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

const buildDateKeysInRange = (start: Date, end: Date) => {
  const keys: string[] = [];
  if (end.getTime() < start.getTime()) {
    return keys;
  }

  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const normalizedEnd = new Date(end);
  normalizedEnd.setHours(0, 0, 0, 0);

  while (cursor <= normalizedEnd) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
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

const normalizeStudents = (source: unknown): StudentSummary[] => {
  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .filter((item): item is StudentSummary => Boolean(item && typeof item === 'object' && 'id' in item))
    .map((item) => ({ ...item, id: String(item.id) }));
};

const normalizeTeachers = (source: unknown): TeacherSummary[] => {
  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .filter((item): item is TeacherSummary => Boolean(item && typeof item === 'object' && 'id' in item))
    .map((item) => ({ ...item, id: String(item.id) }));
};

function TabToggle({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: ReadonlyArray<{ key: ClassDetailTab; label: string }>;
  activeTab: ClassDetailTab;
  onChange: (tab: ClassDetailTab) => void;
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

export function ClassDetailPage() {
  const params = useParams();
  const classId = params.id ? String(params.id) : '';
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(max-width: 767px)').matches;
  });

  const [activeTab, setActiveTab] = useState<ClassDetailTab>('overview');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentCandidateSearch, setStudentCandidateSearch] = useState('');
  const [selectedStudentCandidateIds, setSelectedStudentCandidateIds] = useState<string[]>([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [editingCell, setEditingCell] = useState<AttendanceCellEditingState | null>(null);
  const [editingCheckinId, setEditingCheckinId] = useState<string | null>(null);
  const [editingCheckType, setEditingCheckType] = useState<'in' | 'out'>('in');
  const [editingCheckTime, setEditingCheckTime] = useState('08:00');
  const [editingCheckNote, setEditingCheckNote] = useState('');
  const [editingCostStudentId, setEditingCostStudentId] = useState<string | null>(null);
  const [editingCostValue, setEditingCostValue] = useState('');
  const [invoiceStudentId, setInvoiceStudentId] = useState<string | null>(null);
  const [invoiceAction, setInvoiceAction] = useState<'share' | 'download' | 'copy' | null>(null);
  const [leaveStatus, setLeaveStatus] = useState<LeaveStatusFilter>('all');
  const [leaveSearch, setLeaveSearch] = useState('');
  const [classNameDraft, setClassNameDraft] = useState<string | null>(null);
  const [classFromDateDraft, setClassFromDateDraft] = useState<string | null>(null);
  const [classToDateDraft, setClassToDateDraft] = useState<string | null>(null);
  const [classCostPerSessionDraft, setClassCostPerSessionDraft] = useState<string | null>(null);
  const [mobileAttendanceDate, setMobileAttendanceDate] = useState('');
  const invoiceCardRef = useRef<HTMLDivElement | null>(null);
  const resetAttendanceEditor = useCallback(() => {
    setEditingCheckinId(null);
    setEditingCheckType('in');
    setEditingCheckTime(toTimeInput(new Date()));
    setEditingCheckNote('');
  }, []);

  const classQuery = useQuery({
    queryKey: ['class-detail', classId],
    queryFn: () => fetchClassDetail(classId),
    enabled: Boolean(classId),
  });

  const studentsQuery = useQuery({
    queryKey: ['class-detail', classId, 'students'],
    queryFn: () => fetchStudentsByClassId(classId),
    enabled: Boolean(classId),
  });

  const studentCountQuery = useQuery({
    queryKey: ['class-detail', classId, 'student-count'],
    queryFn: () => fetchClassStudentCount(classId),
    enabled: Boolean(classId),
  });

  const usersQuery = useQuery({
    queryKey: ['class-detail', 'user-options'],
    queryFn: () => fetchCollection('/so-users', { limit: 1000, includeRelations: ['soRoles'], order: ['name ASC'] }),
  });

  const studentOptionsQuery = useQuery({
    queryKey: ['class-detail', 'student-options'],
    queryFn: () => fetchCollection('/so-students', { limit: 1000, includeRelations: ['soClass'], order: ['name ASC'] }),
  });

  const students = useMemo(() => normalizeStudents(studentsQuery.data ?? classQuery.data?.soStudents), [studentsQuery.data, classQuery.data?.soStudents]);

  const teachers = useMemo(() => normalizeTeachers(classQuery.data?.soUsers), [classQuery.data?.soUsers]);

  const studentIds = useMemo(() => students.map((student) => String(student.id)), [students]);

  const leavesQuery = useQuery({
    queryKey: ['class-leaves', classId, studentIds.join(',')],
    queryFn: () => fetchStudentLeavesByStudentIds(studentIds),
    enabled: Boolean(classId) && studentIds.length > 0,
  });

  const classStudentFeesQuery = useQuery({
    queryKey: ['class-detail', classId, 'student-fees'],
    queryFn: () => fetchClassStudentFees(classId),
    enabled: Boolean(classId),
  });

  const classDateRange = useMemo(() => {
    const fromDate = classQuery.data?.fromDate ? new Date(String(classQuery.data.fromDate)) : null;
    const toDate = classQuery.data?.toDate ? new Date(String(classQuery.data.toDate)) : null;

    if (!fromDate || !toDate || Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return null;
    }

    if (fromDate.getTime() > toDate.getTime()) {
      return null;
    }

    return { start: fromDate, end: toDate };
  }, [classQuery.data?.fromDate, classQuery.data?.toDate]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      if (activeTab !== 'attendance-mobile' && activeTab !== 'students') {
        setActiveTab('attendance-mobile');
      }
      return;
    }

    if (activeTab === 'attendance-mobile') {
      setActiveTab('overview');
    }
  }, [activeTab, isMobile]);

  const classAttendanceQuery = useQuery({
    queryKey: [
      'class-detail',
      classId,
      'attendance-range',
      classDateRange ? toDateKey(classDateRange.start) : '',
      classDateRange ? toDateKey(classDateRange.end) : '',
    ],
    queryFn: () =>
      fetchClassAttendanceRecords({
        classId,
        startDate: classDateRange?.start.toISOString() ?? '',
        endDate: classDateRange?.end.toISOString() ?? '',
      }),
    enabled: Boolean(classId) && Boolean(classDateRange),
  });

  const attendanceLoading = classAttendanceQuery.isLoading;
  const attendanceError = classAttendanceQuery.error;

  const studentFeeByStudentId = useMemo(() => {
    const source = classStudentFeesQuery.data ?? [];
    return source.reduce<Record<string, ClassStudentFeeRecord>>((acc, item) => {
      acc[String(item.soStudentId)] = item;
      return acc;
    }, {});
  }, [classStudentFeesQuery.data]);

  const attendanceDays = useMemo(() => {
    if (!classDateRange) {
      return [] as string[];
    }

    return buildDateKeysInRange(classDateRange.start, classDateRange.end);
  }, [classDateRange]);

  useEffect(() => {
    if (!classDateRange) {
      setMobileAttendanceDate('');
      return;
    }

    const rangeStartKey = toDateKey(classDateRange.start);
    const rangeEndKey = toDateKey(classDateRange.end);
    const todayKey = toDateKey(new Date());
    const defaultDate = todayKey >= rangeStartKey && todayKey <= rangeEndKey ? todayKey : rangeStartKey;

    setMobileAttendanceDate((prev) => {
      if (!prev || prev < rangeStartKey || prev > rangeEndKey) {
        return defaultDate;
      }
      return prev;
    });
  }, [classDateRange]);

  const attendanceByStudentDate = useMemo(() => {
    const map: Record<string, Record<string, AttendanceRecord[]>> = {};

    for (const checkin of classAttendanceQuery.data ?? []) {
      const studentId = toText(checkin.soStudentId, '');
      const dateKey = toDateKey(checkin.checkDate);
      if (!studentId || !dateKey) {
        continue;
      }

      map[studentId] ??= {};
      map[studentId][dateKey] ??= [];
      map[studentId][dateKey].push(checkin);
    }

    Object.keys(map).forEach((studentId) => {
      Object.keys(map[studentId]).forEach((dateKey) => {
        map[studentId][dateKey] = [...map[studentId][dateKey]].sort(
          (a, b) => new Date(a.checkDate).getTime() - new Date(b.checkDate).getTime()
        );
      });
    });

    return map;
  }, [classAttendanceQuery.data]);

  const attendanceRows = useMemo(() => {
    return students.map((student) => {
      const studentId = String(student.id);
      const dateMap = attendanceByStudentDate[studentId] ?? {};

      const cells = attendanceDays.map((dateKey) => {
        const checkins = [...(dateMap[dateKey] ?? [])];
        return {
          dateKey,
          checkins,
          firstCheckin: checkins[0],
        } satisfies AttendanceCell;
      });

      return {
        studentId,
        studentName: toText(student.name, 'Không rõ tên'),
        presentSessions: cells.filter((cell) => cell.firstCheckin?.checkType === 'in').length,
        customCostPerSession: studentFeeByStudentId[studentId]?.customCostPerSession,
        cells,
      } satisfies AttendanceMatrixRow;
    });
  }, [attendanceByStudentDate, attendanceDays, studentFeeByStudentId, students]);

  const presentCount = useMemo(() => attendanceRows.filter((row) => row.presentSessions > 0).length, [attendanceRows]);
  const absentCount = useMemo(() => attendanceRows.filter((row) => row.presentSessions === 0).length, [attendanceRows]);
  const totalPresentSessions = useMemo(
    () => attendanceRows.reduce((total, row) => total + row.presentSessions, 0),
    [attendanceRows]
  );

  const filteredStudents = useMemo(() => {
    const keyword = studentSearch.trim().toLowerCase();

    return students.filter((item) => {
      if (!keyword) {
        return true;
      }

      const haystack = `${toText(item.name, '')} ${toText(item.phone, '')} ${toText(item.email, '')}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [studentSearch, students]);

  const filteredTeacherCandidates = useMemo(() => {
    const assignedTeacherIds = new Set(teachers.map((item) => String(item.id)));
    const keyword = teacherSearch.trim().toLowerCase();

    const users = normalizeTeachers(usersQuery.data);

    return users.filter((item) => {
      if (assignedTeacherIds.has(String(item.id))) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack = `${toText(item.name, '')} ${toText(item.username, '')} ${toText(item.phone, '')} ${toText(item.email, '')}`
        .toLowerCase()
        .trim();

      return haystack.includes(keyword);
    });
  }, [teacherSearch, teachers, usersQuery.data]);

  const filteredStudentCandidates = useMemo(() => {
    const assignedStudentIds = new Set(students.map((item) => String(item.id)));
    const keyword = studentCandidateSearch.trim().toLowerCase();
    const candidates = normalizeStudents(studentOptionsQuery.data);

    return candidates.filter((item) => {
      if (assignedStudentIds.has(String(item.id))) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack =
        `${toText(item.name, '')} ${toText(item.phone, '')} ${toText(item.email, '')} ${toText(item.soClass?.name, '')}`
          .toLowerCase()
          .trim();
      return haystack.includes(keyword);
    });
  }, [studentCandidateSearch, studentOptionsQuery.data, students]);

  const filteredAttendanceRows = useMemo(() => {
    const keyword = attendanceSearch.trim().toLowerCase();

    return attendanceRows.filter((row) => {
      if (!keyword) {
        return true;
      }

      const checkinText = row.cells
        .flatMap((cell) => cell.checkins.map((item) => `${item.checkType} ${toText(item.note, '')}`))
        .join(' ');
      const haystack = `${row.studentName} ${checkinText}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [attendanceRows, attendanceSearch]);

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
      if (leaveStatus !== 'all' && item.leaveStatus !== leaveStatus) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const studentName = item.soStudent?.name ? String(item.soStudent.name) : '';
      const parentName = item.soParent?.name ? String(item.soParent.name) : '';
      const approverName = item.soUser?.name ? String(item.soUser.name) : '';

      const haystack = `${studentName} ${parentName} ${approverName} ${item.reason ?? ''} ${item.leaveStartDate ?? ''} ${item.leaveEndDate ?? ''}`
        .toLowerCase()
        .trim();

      return haystack.includes(keyword);
    });
  }, [leaveRows, leaveSearch, leaveStatus]);

  const leaveWaitingCount = useMemo(() => leaveRows.filter((item) => item.leaveStatus === 'waiting').length, [leaveRows]);
  const leaveApprovedCount = useMemo(() => leaveRows.filter((item) => item.leaveStatus === 'approved').length, [leaveRows]);
  const leaveRejectedCount = useMemo(() => leaveRows.filter((item) => item.leaveStatus === 'reject').length, [leaveRows]);
  const classNameInput = classNameDraft ?? toText(classQuery.data?.name, '');
  const classFromDateInput = classFromDateDraft ?? formatDateInput(classQuery.data?.fromDate);
  const classToDateInput = classToDateDraft ?? formatDateInput(classQuery.data?.toDate);
  const classCostPerSessionInput =
    classCostPerSessionDraft ??
    (typeof classQuery.data?.costPerSession === 'number' ? String(classQuery.data.costPerSession) : '');

  const isClassFormDirty = useMemo(() => {
    const originalName = toText(classQuery.data?.name, '');
    const originalFromDate = formatDateInput(classQuery.data?.fromDate);
    const originalToDate = formatDateInput(classQuery.data?.toDate);
    const originalCost =
      typeof classQuery.data?.costPerSession === 'number' ? String(classQuery.data.costPerSession) : '';

    return (
      classNameInput !== originalName ||
      classFromDateInput !== originalFromDate ||
      classToDateInput !== originalToDate ||
      classCostPerSessionInput.trim() !== originalCost
    );
  }, [
    classCostPerSessionInput,
    classFromDateInput,
    classNameInput,
    classQuery.data?.costPerSession,
    classQuery.data?.fromDate,
    classQuery.data?.name,
    classQuery.data?.toDate,
    classToDateInput,
  ]);

  const updateClassMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateClassDetail(classId, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin lớp học.');
      setClassNameDraft(null);
      setClassFromDateDraft(null);
      setClassToDateDraft(null);
      setClassCostPerSessionDraft(null);
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'classes'] });
      queryClient.invalidateQueries({ queryKey: ['refs', 'classes'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const assignTeachersMutation = useMutation({
    mutationFn: (teacherIds: string[]) =>
      assignTeachersToClass(
        classId,
        teacherIds,
        teachers.map((item) => String(item.id))
      ),
    onSuccess: () => {
      toast.success('Đã cập nhật giáo viên chủ nhiệm cho lớp.');
      setSelectedTeacherIds([]);
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'classes'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'users'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const removeTeacherMutation = useMutation({
    mutationFn: (teacherId: string) =>
      removeTeacherFromClass(
        classId,
        teacherId,
        teachers.map((item) => String(item.id))
      ),
    onSuccess: () => {
      toast.success('Đã gỡ giáo viên khỏi lớp học.');
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'classes'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'users'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const addStudentsMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      await Promise.all(studentIds.map((studentId) => transferStudentClass(studentId, classId)));
    },
    onSuccess: (_data, studentIds) => {
      toast.success(`Đã thêm ${studentIds.length} học sinh vào lớp.`);
      setSelectedStudentCandidateIds([]);
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId, 'students'] });
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId, 'student-count'] });
      queryClient.invalidateQueries({ queryKey: ['class-detail', 'student-options'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'classes'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) => removeStudentFromClass(studentId),
    onSuccess: () => {
      toast.success('Đã gỡ học sinh khỏi lớp.');
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId, 'students'] });
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId, 'student-count'] });
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId, 'attendance-range'] });
      queryClient.invalidateQueries({ queryKey: ['class-leaves', classId] });
      queryClient.invalidateQueries({ queryKey: ['class-detail', 'student-options'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['resource', 'classes'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const upsertStudentCostMutation = useMutation({
    mutationFn: ({ studentId, customCostPerSession }: { studentId: string; customCostPerSession?: number | null }) =>
      upsertClassStudentFee(classId, studentId, customCostPerSession),
    onSuccess: () => {
      toast.success('Đã lưu chi phí custom cho học sinh.');
      setEditingCostStudentId(null);
      setEditingCostValue('');
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId, 'student-fees'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async ({ checkinId, payload }: { checkinId?: string; payload: AttendanceWritePayload }) => {
      if (checkinId) {
        await updateAttendanceRecord(checkinId, payload);
        return;
      }
      await createAttendanceRecord(payload);
    },
    onSuccess: async () => {
      toast.success('Đã lưu dữ liệu checkin.');
      setEditingCell(null);
      resetAttendanceEditor();
      await queryClient.invalidateQueries({ queryKey: ['class-detail', classId, 'attendance-range'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: (checkinId: string) => deleteAttendanceRecord(checkinId),
    onSuccess: async (_data, checkinId) => {
      toast.success('Đã xoá checkin.');
      if (editingCheckinId && String(editingCheckinId) === checkinId) {
        resetAttendanceEditor();
      }
      await queryClient.invalidateQueries({ queryKey: ['class-detail', classId, 'attendance-range'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
  const attendanceActionPending = saveAttendanceMutation.isPending || deleteAttendanceMutation.isPending;
  const handleMobileQuickCheckin = useCallback(
    (studentId: string, dateKey: string) => {
      const payload: AttendanceWritePayload = {
        soStudentId: studentId,
        soClassesId: classId,
        checkType: 'in',
        checkDate: buildCheckDateTime(dateKey, toTimeInput(new Date())),
      };

      saveAttendanceMutation.mutate({
        payload,
      });
    },
    [classId, saveAttendanceMutation]
  );

  useEffect(() => {
    if (!editingCell) {
      return;
    }
    resetAttendanceEditor();
  }, [editingCell, resetAttendanceEditor]);

  const editingCellRow = useMemo(
    () => (editingCell ? attendanceRows.find((row) => row.studentId === editingCell.studentId) : undefined),
    [attendanceRows, editingCell]
  );

  const editingCellData = useMemo(() => {
    if (!editingCellRow || !editingCell) {
      return undefined;
    }
    return editingCellRow.cells.find((cell) => cell.dateKey === editingCell.dateKey);
  }, [editingCell, editingCellRow]);

  const invoiceRow = useMemo(
    () => (invoiceStudentId ? attendanceRows.find((row) => row.studentId === invoiceStudentId) : undefined),
    [attendanceRows, invoiceStudentId]
  );

  const editingCostRow = useMemo(
    () => (editingCostStudentId ? attendanceRows.find((row) => row.studentId === editingCostStudentId) : undefined),
    [attendanceRows, editingCostStudentId]
  );

  if (!classId) {
    return (
      <Card>
        <CardContent className='p-6'>
          <p>Thiếu mã lớp học.</p>
        </CardContent>
      </Card>
    );
  }

  if (classQuery.isLoading) {
    return (
      <Card>
        <CardContent className='flex items-center gap-2 p-6 text-muted-foreground'>
          <Loader2 className='h-4 w-4 animate-spin' />
          Đang tải chi tiết lớp học...
        </CardContent>
      </Card>
    );
  }

  if (classQuery.error || !classQuery.data) {
    return (
      <Card>
        <CardContent className='space-y-3 p-6'>
          <p className='font-medium text-danger'>Không thể tải thông tin lớp học.</p>
          <p className='text-sm text-muted-foreground'>{getErrorMessage(classQuery.error)}</p>
          <Button asChild variant='secondary'>
            <Link to='/classes'>Quay lại danh sách lớp học</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const classData = classQuery.data;
  const className = toText(classData.name, 'Không rõ tên lớp');
  const invoiceUnitCost =
    invoiceRow && typeof invoiceRow.customCostPerSession === 'number'
      ? invoiceRow.customCostPerSession
      : typeof classData.costPerSession === 'number'
        ? classData.costPerSession
        : 0;
  const invoicePresentSessions = invoiceRow?.presentSessions ?? 0;
  const invoiceTotal = invoicePresentSessions * invoiceUnitCost;
  const invoicePeriodText = classDateRange
    ? `${formatDate(classDateRange.start)} - ${formatDate(classDateRange.end)}`
    : 'Chưa cấu hình From - To';
  const studentToken = toFileSafeToken(invoiceRow?.studentName ?? 'hoc-sinh') || 'hoc-sinh';
  const periodToken = classDateRange
    ? `${toDateKey(classDateRange.start)}-${toDateKey(classDateRange.end)}`
    : toDateKey(new Date());
  const invoiceFileName = `hoa-don-${studentToken}-${periodToken}.png`;

  const getInvoiceImageBlob = async () => {
    if (!invoiceCardRef.current) {
      throw new Error('Không tìm thấy nội dung hóa đơn để xuất ảnh.');
    }

    const blob = await toBlob(invoiceCardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    if (!blob) {
      throw new Error('Không thể tạo ảnh hóa đơn.');
    }

    return blob;
  };

  const handleDownloadInvoiceImage = async () => {
    try {
      setInvoiceAction('download');
      const blob = await getInvoiceImageBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = invoiceFileName;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải ảnh hóa đơn.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setInvoiceAction(null);
    }
  };

  const handleCopyInvoiceImage = async () => {
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('Trình duyệt chưa hỗ trợ copy ảnh.');
      }

      setInvoiceAction('copy');
      const blob = await getInvoiceImageBlob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast.success('Đã copy ảnh hóa đơn vào clipboard.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setInvoiceAction(null);
    }
  };

  const handleShareInvoiceImage = async () => {
    try {
      const shareApi = navigator.share;
      const canShareApi = navigator.canShare;

      if (!shareApi) {
        throw new Error('Trình duyệt chưa hỗ trợ chia sẻ trực tiếp.');
      }

      setInvoiceAction('share');
      const blob = await getInvoiceImageBlob();
      const imageFile = new File([blob], invoiceFileName, { type: 'image/png' });

      if (canShareApi && canShareApi({ files: [imageFile] })) {
        await shareApi({
          title: 'Hóa đơn học phí',
          text: `Hóa đơn ${invoiceRow?.studentName ?? ''} - ${invoicePeriodText}`,
          files: [imageFile],
        });
        return;
      }

      throw new Error('Thiết bị không hỗ trợ chia sẻ ảnh trực tiếp.');
    } catch (error) {
      const maybeDomError = error as { name?: string };
      if (maybeDomError?.name === 'AbortError') {
        return;
      }

      toast.error(getErrorMessage(error));
    } finally {
      setInvoiceAction(null);
    }
  };
  const visibleTabs: ReadonlyArray<{ key: ClassDetailTab; label: string }> = isMobile ? mobileTabs : desktopTabs;
  const classRangeStartKey = classDateRange ? toDateKey(classDateRange.start) : '';
  const classRangeEndKey = classDateRange ? toDateKey(classDateRange.end) : '';

  return (
    <div className='space-y-5 animate-fade-in'>
      <Card>
        <CardContent className={cn('p-5', isMobile ? 'space-y-3' : 'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between')}>
          <div className={cn(isMobile ? 'space-y-2' : '')}>
            <Button asChild variant='secondary' size='sm'>
              <Link to='/classes'>Quay lại danh sách lớp học</Link>
            </Button>
            <h1 className='font-display text-2xl font-bold'>{isMobile ? className : `Chi tiết lớp học: ${className}`}</h1>
            <p className='text-sm text-muted-foreground'>Mã lớp: {classData.id}</p>
          </div>

          {isMobile ? (
            <div className='grid grid-cols-2 gap-2'>
              <div className='rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs'>
                <p className='text-muted-foreground'>Sĩ số</p>
                <p className='mt-1 text-base font-semibold'>{studentCountQuery.data ?? students.length}</p>
              </div>
              <div className='rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs'>
                <p className='text-muted-foreground'>Giáo viên</p>
                <p className='mt-1 text-base font-semibold'>{teachers.length}</p>
              </div>
              <div className='rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs'>
                <p className='text-muted-foreground'>Có check-in</p>
                <p className='mt-1 text-base font-semibold'>{presentCount}</p>
              </div>
              <div className='rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs'>
                <p className='text-muted-foreground'>Đơn nghỉ</p>
                <p className='mt-1 text-base font-semibold'>{leaveRows.length}</p>
              </div>
            </div>
          ) : (
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='secondary'>Sĩ số: {studentCountQuery.data ?? students.length}</Badge>
              <Badge variant='secondary'>Giáo viên: {teachers.length}</Badge>
              <Badge variant='secondary'>Học sinh có check-in: {presentCount}</Badge>
              <Badge variant='secondary'>Tổng lượt check-in: {totalPresentSessions}</Badge>
              <Badge variant='secondary'>Đơn nghỉ: {leaveRows.length}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {!isMobile ? (
        <section className='grid gap-4 md:grid-cols-4'>
          <Card>
            <CardHeader>
              <CardDescription>Tổng số học sinh</CardDescription>
              <CardTitle>{studentCountQuery.data ?? students.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Học sinh có check-in</CardDescription>
              <CardTitle>{presentCount}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Học sinh chưa check-in</CardDescription>
              <CardTitle>{absentCount}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Đơn nghỉ phép</CardDescription>
              <CardTitle>{leaveRows.length}</CardTitle>
            </CardHeader>
          </Card>
        </section>
      ) : null}

      <Card>
        <CardContent className='p-4'>
          <TabToggle tabs={visibleTabs} activeTab={activeTab} onChange={setActiveTab} />
        </CardContent>
      </Card>

      {activeTab === 'overview' ? (
        <section className='grid gap-4 lg:grid-cols-3'>
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Tổng quan lớp học</CardTitle>
              <CardDescription>Xem chi tiết và cập nhật trực tiếp thông tin lớp học</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Tên lớp *</p>
                <Input
                  value={classNameInput}
                  onChange={(event) => setClassNameDraft(event.target.value)}
                  placeholder='Nhập tên lớp'
                />
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                <div>
                  <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Từ ngày - Đến ngày</p>
                  <DateRangePicker
                    startValue={classFromDateInput}
                    endValue={classToDateInput}
                    onChange={(startValue, endValue) => {
                      setClassFromDateDraft(startValue);
                      setClassToDateDraft(endValue);
                    }}
                    placeholder='Chọn khoảng ngày học của lớp'
                  />
                </div>
                <div>
                  <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Chi phí/buổi (VNĐ)</p>
                  <Input
                    value={formatCurrencyInput(classCostPerSessionInput)}
                    placeholder='Ví dụ: 250000'
                    onChange={(event) => setClassCostPerSessionDraft(toCurrencyDigits(event.target.value))}
                  />
                </div>
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Sĩ số</p>
                  <p className='mt-1 font-medium'>{studentCountQuery.data ?? students.length}</p>
                </div>
                <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Tình hình điểm danh</p>
                  <p className='mt-1 font-medium'>
                    {presentCount} học sinh có check-in / {totalPresentSessions} lượt
                  </p>
                </div>
                <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Chi phí/buổi mặc định</p>
                  <p className='mt-1 font-medium'>
                    {typeof classData.costPerSession === 'number' ? formatCurrency(classData.costPerSession) : 'Chưa cấu hình'}
                  </p>
                </div>
                <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Tình hình nghỉ phép</p>
                  <div className='mt-2 flex flex-wrap items-center gap-2'>
                    <Badge variant='warning'>Chờ duyệt: {leaveWaitingCount}</Badge>
                    <Badge variant='success'>Đã duyệt: {leaveApprovedCount}</Badge>
                    <Badge variant='danger'>Từ chối: {leaveRejectedCount}</Badge>
                  </div>
                </div>
              </div>

              <div className='flex justify-end'>
                <Button
                  onClick={() => {
                    const classNameTrimmed = classNameInput.trim();
                    if (!classNameTrimmed) {
                      toast.error('Tên lớp là bắt buộc.');
                      return;
                    }
                    if (classFromDateInput && classToDateInput) {
                      const from = new Date(classFromDateInput);
                      const to = new Date(classToDateInput);
                      if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from.getTime() > to.getTime()) {
                        toast.error('Từ ngày phải nhỏ hơn hoặc bằng đến ngày.');
                        return;
                      }
                    }

                    const originalName = toText(classQuery.data?.name, '');
                    const originalFromDate = formatDateInput(classQuery.data?.fromDate);
                    const originalToDate = formatDateInput(classQuery.data?.toDate);
                    const originalCost =
                      typeof classQuery.data?.costPerSession === 'number' ? String(classQuery.data.costPerSession) : '';

                    const payload: Record<string, unknown> = {};

                    if (classNameTrimmed !== originalName) {
                      payload.name = classNameTrimmed;
                    }

                    if (classFromDateInput !== originalFromDate) {
                      payload.fromDate = classFromDateInput ? toApiDateTime(classFromDateInput) : null;
                    }

                    if (classToDateInput !== originalToDate) {
                      payload.toDate = classToDateInput ? toApiDateTime(classToDateInput) : null;
                    }

                    const trimmedCost = classCostPerSessionInput.trim();
                    if (trimmedCost !== originalCost) {
                      if (!trimmedCost) {
                        payload.costPerSession = null;
                      } else {
                        const parsedCost = Number(trimmedCost);
                        if (Number.isNaN(parsedCost) || parsedCost < 0) {
                          toast.error('Chi phí/buổi phải là số >= 0.');
                          return;
                        }
                        payload.costPerSession = parsedCost;
                      }
                    }

                    if (Object.keys(payload).length === 0) {
                      toast.error('Chưa có thay đổi để lưu.');
                      return;
                    }

                    updateClassMutation.mutate(payload);
                  }}
                  disabled={!isClassFormDirty || updateClassMutation.isPending}
                >
                  {updateClassMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
                  Lưu thông tin lớp học
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Giáo viên chủ nhiệm</CardTitle>
              <CardDescription>Danh sách giáo viên đang phụ trách lớp</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <div key={teacher.id} className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                    <p className='font-medium'>{toText(teacher.name)}</p>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {toText(teacher.phone, toText(teacher.email, toText(teacher.username, 'Không có liên hệ')))}
                    </p>
                  </div>
                ))
              ) : (
                <p className='text-sm text-muted-foreground'>Chưa có giáo viên chủ nhiệm.</p>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === 'students' ? (
        <section className='grid gap-4 lg:grid-cols-[2fr_1fr]'>
          <Card>
            <CardHeader>
              <CardTitle>Danh sách học sinh chi tiết</CardTitle>
              <CardDescription>Xem nhanh thông tin học sinh và điều hướng sang trang chi tiết học sinh</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='relative max-w-md'>
                <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  className='pl-9'
                  value={studentSearch}
                  placeholder='Tìm theo tên, điện thoại, email...'
                  onChange={(event) => setStudentSearch(event.target.value)}
                />
              </div>

              {isMobile ? (
                <div className='space-y-2'>
                  {studentsQuery.isLoading ? (
                    <div className='rounded-xl border border-border/70 p-4 text-sm text-muted-foreground'>Đang tải học sinh...</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className='rounded-xl border border-border/70 p-4 text-sm text-muted-foreground'>Không có học sinh phù hợp.</div>
                  ) : (
                    filteredStudents.map((student) => (
                      <div key={student.id} className='rounded-xl border border-border/70 p-3'>
                        <div className='flex items-start justify-between gap-2'>
                          <div>
                            <p className='font-medium'>{toText(student.name)}</p>
                            <p className='mt-1 text-xs text-muted-foreground'>
                              {getGenderLabel(student.gender)} • {formatDate(student.dob)}
                            </p>
                            <p className='mt-1 text-xs text-muted-foreground'>{toText(student.phone, toText(student.email))}</p>
                            <p className='mt-1 text-xs text-muted-foreground'>{joinNames(student.parents, 'Chưa liên kết phụ huynh')}</p>
                          </div>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            disabled={removeStudentMutation.isPending}
                            onClick={async () => {
                              const confirmed = await confirmDialog({
                                title: 'Gỡ học sinh',
                                description: `Gỡ ${toText(student.name, 'học sinh này')} khỏi lớp hiện tại?`,
                                confirmText: 'Gỡ khỏi lớp',
                                variant: 'danger',
                              });
                              if (!confirmed) {
                                return;
                              }
                              removeStudentMutation.mutate(String(student.id));
                            }}
                          >
                            {removeStudentMutation.isPending ? (
                              <Loader2 className='h-4 w-4 animate-spin text-danger' />
                            ) : (
                              <UserMinus className='h-4 w-4 text-danger' />
                            )}
                          </Button>
                        </div>
                        <div className='mt-3'>
                          <Button asChild size='sm' variant='secondary' className='w-full'>
                            <Link to={`/students/${student.id}`}>
                              Mở hồ sơ
                              <ArrowUpRight className='h-4 w-4' />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className='overflow-x-auto rounded-xl border border-border/70'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Học sinh</TableHead>
                        <TableHead>Giới tính</TableHead>
                        <TableHead>Ngày sinh</TableHead>
                        <TableHead>Phụ huynh</TableHead>
                        <TableHead>Liên hệ</TableHead>
                        <TableHead className='text-right'>Chi tiết</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsQuery.isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className='text-center text-muted-foreground'>
                            Đang tải học sinh...
                          </TableCell>
                        </TableRow>
                      ) : filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className='text-center text-muted-foreground'>
                            Không có học sinh phù hợp.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className='font-medium'>{toText(student.name)}</TableCell>
                            <TableCell>{getGenderLabel(student.gender)}</TableCell>
                            <TableCell>{formatDate(student.dob)}</TableCell>
                            <TableCell>{joinNames(student.parents, 'Chưa liên kết')}</TableCell>
                            <TableCell>{toText(student.phone, toText(student.email))}</TableCell>
                            <TableCell className='text-right'>
                              <Button asChild size='sm' variant='secondary'>
                                <Link to={`/students/${student.id}`}>
                                  Mở
                                  <ArrowUpRight className='h-4 w-4' />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thêm học sinh vào lớp</CardTitle>
              <CardDescription>Chọn học sinh từ các lớp khác hoặc chưa phân lớp để thêm nhanh</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  className='pl-9'
                  value={studentCandidateSearch}
                  placeholder='Tìm theo tên, liên hệ, lớp hiện tại...'
                  onChange={(event) => setStudentCandidateSearch(event.target.value)}
                />
              </div>

              {isMobile ? (
                <>
                  <div className='max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border/70 p-2'>
                    {studentOptionsQuery.isLoading ? (
                      <p className='p-2 text-sm text-muted-foreground'>Đang tải danh sách học sinh...</p>
                    ) : filteredStudentCandidates.length === 0 ? (
                      <p className='p-2 text-sm text-muted-foreground'>Không còn học sinh phù hợp để thêm vào lớp.</p>
                    ) : (
                      filteredStudentCandidates.map((student) => {
                        const studentId = String(student.id);
                        const selected = selectedStudentCandidateIds.includes(studentId);
                        return (
                          <label
                            key={student.id}
                            className='flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 px-3 py-2 hover:bg-muted/30'
                          >
                            <input
                              type='checkbox'
                              className='mt-1 h-4 w-4 rounded border-border'
                              checked={selected}
                              onChange={(event) => {
                                if (event.target.checked) {
                                  setSelectedStudentCandidateIds((prev) => Array.from(new Set([...prev, studentId])));
                                  return;
                                }
                                setSelectedStudentCandidateIds((prev) => prev.filter((id) => id !== studentId));
                              }}
                            />
                            <span className='text-sm'>
                              <span className='block font-medium'>{toText(student.name)}</span>
                              <span className='mt-0.5 block text-xs text-muted-foreground'>
                                {toText(student.phone, toText(student.email, 'không có liên hệ'))}
                              </span>
                              <span className='mt-0.5 block text-xs text-muted-foreground'>
                                Lớp hiện tại: {toText(student.soClass?.name, 'Chưa phân lớp')}
                              </span>
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>

                  <div className='grid grid-cols-2 gap-2'>
                    <Button
                      type='button'
                      variant='secondary'
                      disabled={selectedStudentCandidateIds.length === 0 || addStudentsMutation.isPending}
                      onClick={() => setSelectedStudentCandidateIds([])}
                    >
                      Bỏ chọn
                    </Button>
                    <Button
                      type='button'
                      disabled={addStudentsMutation.isPending || selectedStudentCandidateIds.length === 0}
                      onClick={() => {
                        if (selectedStudentCandidateIds.length === 0) {
                          toast.error('Vui lòng chọn ít nhất một học sinh.');
                          return;
                        }

                        addStudentsMutation.mutate(selectedStudentCandidateIds);
                      }}
                    >
                      {addStudentsMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <UserPlus className='h-4 w-4' />}
                      Thêm ({selectedStudentCandidateIds.length})
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <select
                    multiple
                    value={selectedStudentCandidateIds}
                    onChange={(event) => {
                      const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                      setSelectedStudentCandidateIds(values);
                    }}
                    className='min-h-64 w-full rounded-xl border border-border bg-white/90 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  >
                    {filteredStudentCandidates.map((student) => (
                      <option key={student.id} value={String(student.id)}>
                        {toText(student.name)} ({toText(student.phone, toText(student.email, 'không có liên hệ'))}) -{' '}
                        {toText(student.soClass?.name, 'Chưa phân lớp')}
                      </option>
                    ))}
                  </select>

                  <p className='text-xs text-muted-foreground'>
                    {studentOptionsQuery.isLoading
                      ? 'Đang tải danh sách học sinh...'
                      : filteredStudentCandidates.length > 0
                        ? 'Giữ Ctrl/Cmd để chọn nhiều học sinh.'
                        : 'Không còn học sinh phù hợp để thêm vào lớp.'}
                  </p>

                  <Button
                    className='w-full'
                    onClick={() => {
                      if (selectedStudentCandidateIds.length === 0) {
                        toast.error('Vui lòng chọn ít nhất một học sinh.');
                        return;
                      }

                      addStudentsMutation.mutate(selectedStudentCandidateIds);
                    }}
                    disabled={addStudentsMutation.isPending || selectedStudentCandidateIds.length === 0}
                  >
                    {addStudentsMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <UserPlus className='h-4 w-4' />}
                    Thêm học sinh đã chọn
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === 'teachers' ? (
        <section className='grid gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Giáo viên chủ nhiệm hiện tại</CardTitle>
              <CardDescription>Xem thông tin và gỡ giáo viên khỏi lớp</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto rounded-xl border border-border/70'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Tài khoản</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead className='text-right'>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className='text-center text-muted-foreground'>
                          Chưa có giáo viên nào được gán.
                        </TableCell>
                      </TableRow>
                    ) : (
                      teachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className='font-medium'>{toText(teacher.name)}</TableCell>
                          <TableCell>{toText(teacher.username)}</TableCell>
                          <TableCell>{toText(teacher.phone, toText(teacher.email))}</TableCell>
                          <TableCell className='text-right'>
                            <Button
                              variant='ghost'
                              size='sm'
                              disabled={removeTeacherMutation.isPending}
                              onClick={async () => {
                                const confirmed = await confirmDialog({
                                  title: 'Gỡ giáo viên',
                                  description: 'Gỡ giáo viên này khỏi lớp?',
                                  confirmText: 'Gỡ giáo viên',
                                  variant: 'danger',
                                });
                                if (!confirmed) return;
                                removeTeacherMutation.mutate(String(teacher.id));
                              }}
                            >
                              <UserMinus className='h-4 w-4 text-danger' />
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
              <CardTitle>Thêm giáo viên chủ nhiệm</CardTitle>
              <CardDescription>Chọn một hoặc nhiều giáo viên để gán cho lớp</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  className='pl-9'
                  value={teacherSearch}
                  placeholder='Tìm theo tên, tài khoản, liên hệ...'
                  onChange={(event) => setTeacherSearch(event.target.value)}
                />
              </div>

              <select
                multiple
                value={selectedTeacherIds}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                  setSelectedTeacherIds(values);
                }}
                className='min-h-64 w-full rounded-xl border border-border bg-white/90 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                {filteredTeacherCandidates.map((teacher) => (
                  <option key={teacher.id} value={String(teacher.id)}>
                    {toText(teacher.name)} ({toText(teacher.username, 'không có username')})
                  </option>
                ))}
              </select>

              <p className='text-xs text-muted-foreground'>Giữ Ctrl/Cmd để chọn nhiều giáo viên.</p>

              <Button
                className='w-full'
                onClick={() => {
                  if (selectedTeacherIds.length === 0) {
                    toast.error('Vui lòng chọn ít nhất một giáo viên.');
                    return;
                  }

                  assignTeachersMutation.mutate(selectedTeacherIds);
                }}
                disabled={assignTeachersMutation.isPending || filteredTeacherCandidates.length === 0}
              >
                {assignTeachersMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <UserPlus className='h-4 w-4' />}
                Thêm giáo viên đã chọn
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === 'attendance-mobile' ? (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CalendarCheck2 className='h-5 w-5 text-primary' />
              Điểm danh theo ngày
            </CardTitle>
            <CardDescription>Chọn ngày trong lịch lớp và thao tác check-in nhanh cho từng học sinh.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-3'>
              <div>
                <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Ngày điểm danh</p>
                <Input
                  type='date'
                  value={mobileAttendanceDate}
                  min={classRangeStartKey || undefined}
                  max={classRangeEndKey || undefined}
                  disabled={!classDateRange}
                  onChange={(event) => {
                    setMobileAttendanceDate(event.target.value);
                  }}
                />
              </div>
              {classDateRange ? (
                <p className='text-xs text-muted-foreground'>
                  Khoảng lớp học: {formatDate(classDateRange.start)} - {formatDate(classDateRange.end)}
                </p>
              ) : (
                <div className='rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning'>
                  Chưa cấu hình Từ ngày - Đến ngày. Vui lòng cập nhật ở tab Tổng quan trên desktop.
                </div>
              )}
            </div>

            <div className='relative'>
              <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                className='pl-9'
                value={attendanceSearch}
                placeholder='Tìm học sinh...'
                onChange={(event) => setAttendanceSearch(event.target.value)}
              />
            </div>

            {attendanceError ? (
              <div className='rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger'>
                Không thể tải dữ liệu điểm danh: {getErrorMessage(attendanceError)}
              </div>
            ) : null}

            {!classDateRange ? null : filteredAttendanceRows.length === 0 ? (
              <div className='rounded-xl border border-border/70 p-4 text-sm text-muted-foreground'>
                Không có học sinh phù hợp bộ lọc.
              </div>
            ) : (
              <div className='space-y-2'>
                {filteredAttendanceRows.map((row) => {
                  const cell = row.cells.find((item) => item.dateKey === mobileAttendanceDate);
                  const first = cell?.firstCheckin;
                  const statusText = first
                    ? first.checkType === 'in'
                      ? `Đã check-in ${formatTime(first.checkDate)}`
                      : `Check-out ${formatTime(first.checkDate)}`
                    : 'Chưa điểm danh';

                  return (
                    <div key={row.studentId} className='rounded-xl border border-border/70 p-3'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <p className='font-medium'>{row.studentName}</p>
                          <p className='mt-1 text-xs text-muted-foreground'>{statusText}</p>
                        </div>
                        <Badge variant={first ? (first.checkType === 'in' ? 'success' : 'warning') : 'secondary'}>{statusText}</Badge>
                      </div>
                      <div className='mt-3 grid grid-cols-2 gap-2'>
                        <Button
                          type='button'
                          variant='secondary'
                          disabled={!mobileAttendanceDate || attendanceActionPending}
                          onClick={() => {
                            if (!mobileAttendanceDate) {
                              toast.error('Vui lòng chọn ngày điểm danh.');
                              return;
                            }
                            setEditingCell({
                              studentId: row.studentId,
                              dateKey: mobileAttendanceDate,
                            });
                          }}
                        >
                          {first ? 'Sửa log' : 'Thêm log'}
                        </Button>
                        <Button
                          type='button'
                          disabled={!mobileAttendanceDate || Boolean(first) || attendanceActionPending}
                          onClick={() => {
                            if (!mobileAttendanceDate) {
                              toast.error('Vui lòng chọn ngày điểm danh.');
                              return;
                            }
                            handleMobileQuickCheckin(row.studentId, mobileAttendanceDate);
                          }}
                        >
                          {attendanceActionPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <LogIn className='h-4 w-4' />}
                          Check-in
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'attendance' ? (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CalendarCheck2 className='h-5 w-5 text-primary' />
              Điểm danh học sinh theo lớp
            </CardTitle>
            <CardDescription>
              Bảng ma trận theo lịch lớp học: mỗi cột là một ngày, mỗi hàng là một học sinh. Bấm vào từng ô để thêm/sửa/xóa checkin.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-3 lg:grid-cols-4'>
              <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Tổng học sinh</p>
                <p className='mt-1 text-2xl font-semibold'>{attendanceRows.length}</p>
              </div>
              <div className='rounded-xl border border-border/70 bg-muted/30 p-3 text-sm'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Khoảng ngày lớp học (From - To)</p>
                {classDateRange ? (
                  <>
                    <p className='mt-1 font-semibold'>
                      {formatDate(classDateRange.start)} - {formatDate(classDateRange.end)}
                    </p>
                    <p className='text-xs text-muted-foreground'>Số ngày theo dõi: {attendanceDays.length}</p>
                  </>
                ) : (
                  <>
                    <p className='mt-1 font-semibold text-warning'>Chưa cấu hình From - To</p>
                    <p className='text-xs text-muted-foreground'>Cập nhật ở tab Tổng quan để bật lịch điểm danh.</p>
                  </>
                )}
              </div>
              <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Học sinh có check-in</p>
                <p className='mt-1 text-2xl font-semibold'>{classDateRange ? presentCount : '--'}</p>
              </div>
              <div className='rounded-xl border border-border/70 bg-muted/30 p-3'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Tổng lượt check-in</p>
                <p className='mt-1 text-2xl font-semibold'>{classDateRange ? totalPresentSessions : '--'}</p>
              </div>
            </div>

            <div className='relative'>
              <Search className='pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                className='pl-9'
                value={attendanceSearch}
                placeholder='Tìm học sinh...'
                onChange={(event) => setAttendanceSearch(event.target.value)}
              />
            </div>

            {attendanceError ? (
              <div className='rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger'>
                Không thể tải dữ liệu điểm danh: {getErrorMessage(attendanceError)}
              </div>
            ) : null}

            {!classDateRange ? (
              <div className='rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning'>
                Lớp học chưa có <strong>Từ ngày</strong> và <strong>Đến ngày</strong>. Vui lòng cập nhật ở tab Tổng quan để hiển thị
                lịch điểm danh.
              </div>
            ) : (
              <>
                <div className='overflow-x-auto rounded-xl border border-border/70'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='min-w-56'>Học sinh</TableHead>
                        <TableHead className='min-w-32 text-center'>C/L</TableHead>
                        <TableHead className='min-w-32 text-right'>Hóa đơn</TableHead>
                        {attendanceDays.map((day) => (
                          <TableHead key={day} className='min-w-14 text-center'>
                            {day.split('-')[2]}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceLoading ? (
                        <TableRow>
                          <TableCell colSpan={3 + attendanceDays.length} className='text-center text-muted-foreground'>
                            Đang tải điểm danh học sinh...
                          </TableCell>
                        </TableRow>
                      ) : attendanceDays.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3 + attendanceDays.length} className='text-center text-muted-foreground'>
                            Khoảng ngày From - To của lớp chưa có dữ liệu hợp lệ.
                          </TableCell>
                        </TableRow>
                      ) : filteredAttendanceRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3 + attendanceDays.length} className='text-center text-muted-foreground'>
                            Không có dữ liệu điểm danh phù hợp bộ lọc.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAttendanceRows.map((row) => (
                          <TableRow key={row.studentId}>
                            <TableCell className='font-medium'>{row.studentName}</TableCell>
                            <TableCell className='text-center'>
                              <button
                                type='button'
                                className='rounded-md border border-border/70 px-2 py-1 text-xs font-medium hover:bg-muted/40'
                                onClick={() => {
                                  setEditingCostStudentId(row.studentId);
                                  setEditingCostValue(
                                    typeof row.customCostPerSession === 'number' ? String(row.customCostPerSession) : ''
                                  );
                                }}
                              >
                                {typeof row.customCostPerSession === 'number'
                                  ? formatCurrency(row.customCostPerSession)
                                  : typeof classData.costPerSession === 'number'
                                    ? formatCurrency(classData.costPerSession)
                                    : '-'}
                              </button>
                            </TableCell>
                            <TableCell className='text-right'>
                              <Button size='sm' variant='secondary' onClick={() => setInvoiceStudentId(row.studentId)}>
                                <ReceiptText className='h-4 w-4' />
                                Tính tiền
                              </Button>
                            </TableCell>
                            {row.cells.map((cell) => {
                              const first = cell.firstCheckin;
                              return (
                                <TableCell key={`${row.studentId}-${cell.dateKey}`} className='p-1'>
                                  <button
                                    type='button'
                                    title={first ? `${first.checkType.toUpperCase()} ${formatTime(first.checkDate)}` : 'Chưa checkin'}
                                    className={cn(
                                      'flex h-9 w-full items-center justify-center rounded-md border border-border/70 transition',
                                      first?.checkType === 'in'
                                        ? 'bg-success/10 text-success hover:bg-success/20'
                                        : first?.checkType === 'out'
                                          ? 'bg-warning/10 text-warning hover:bg-warning/20'
                                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                    )}
                                    onClick={() => setEditingCell({ studentId: row.studentId, dateKey: cell.dateKey })}
                                  >
                                    {first?.checkType === 'in' ? (
                                      <LogIn className='h-4 w-4' />
                                    ) : first?.checkType === 'out' ? (
                                      <LogOut className='h-4 w-4' />
                                    ) : (
                                      <Minus className='h-4 w-4' />
                                    )}
                                  </button>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Mỗi ô chỉ hiển thị icon của checkin đầu tiên trong ngày để tiết kiệm không gian.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'leaves' ? (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <FileClock className='h-5 w-5 text-primary' />
              Đơn nghỉ phép theo lớp
            </CardTitle>
            <CardDescription>
              Tổng hợp đơn nghỉ phép của toàn bộ học sinh trong lớp, hỗ trợ lọc nhanh theo trạng thái và nội dung.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-3 lg:grid-cols-3'>
              <Select value={leaveStatus} onValueChange={(value) => setLeaveStatus(value as LeaveStatusFilter)}>
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
                  placeholder='Tìm theo học sinh, lý do, phụ huynh...'
                  onChange={(event) => setLeaveSearch(event.target.value)}
                />
              </div>

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
                    <TableHead>Học sinh</TableHead>
                    <TableHead>Phụ huynh</TableHead>
                    <TableHead>Từ ngày</TableHead>
                    <TableHead>Đến ngày</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Người duyệt</TableHead>
                    <TableHead>Lý do</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center text-muted-foreground'>
                        Lớp chưa có học sinh, chưa có dữ liệu nghỉ phép.
                      </TableCell>
                    </TableRow>
                  ) : leavesQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center text-muted-foreground'>
                        Đang tải dữ liệu nghỉ phép...
                      </TableCell>
                    </TableRow>
                  ) : filteredLeaveRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center text-muted-foreground'>
                        Không có đơn nghỉ phép phù hợp bộ lọc.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeaveRows.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className='font-medium'>{toText(item.soStudent?.name)}</TableCell>
                        <TableCell>{toText(item.soParent?.name)}</TableCell>
                        <TableCell>{formatDate(item.leaveStartDate)}</TableCell>
                        <TableCell>{formatDate(item.leaveEndDate)}</TableCell>
                        <TableCell>
                          <Badge variant={leaveStatusVariant(item.leaveStatus)}>{leaveStatusLabel(item.leaveStatus)}</Badge>
                        </TableCell>
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
      ) : null}

      <Dialog
        open={Boolean(editingCostStudentId)}
        onOpenChange={(open) => {
          if (open) {
            return;
          }
          setEditingCostStudentId(null);
          setEditingCostValue('');
        }}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Cập nhật C/L</DialogTitle>
            <DialogDescription>
              {editingCostRow?.studentName ?? '-'} - Lớp {className}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3'>
            <div className='rounded-xl border border-border/70 bg-muted/20 p-3 text-sm'>
              <div className='flex items-center justify-between'>
                <span>Mặc định theo lớp</span>
                <span className='font-medium'>
                  {typeof classData.costPerSession === 'number' ? formatCurrency(classData.costPerSession) : 'Chưa cấu hình'}
                </span>
              </div>
            </div>

            <div>
              <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Chi phí custom/buổi (để trống = dùng mặc định lớp)</p>
              <Input
                value={formatCurrencyInput(editingCostValue)}
                placeholder='Nhập số tiền custom'
                onChange={(event) => setEditingCostValue(toCurrencyDigits(event.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='secondary'
              disabled={upsertStudentCostMutation.isPending || !editingCostStudentId}
              onClick={() => {
                if (!editingCostStudentId) {
                  return;
                }
                upsertStudentCostMutation.mutate({
                  studentId: editingCostStudentId,
                  customCostPerSession: null,
                });
              }}
            >
              Dùng mặc định lớp
            </Button>
            <Button
              type='button'
              disabled={upsertStudentCostMutation.isPending || !editingCostStudentId}
              onClick={() => {
                if (!editingCostStudentId) {
                  return;
                }

                const trimmedValue = editingCostValue.trim();
                if (!trimmedValue) {
                  upsertStudentCostMutation.mutate({
                    studentId: editingCostStudentId,
                    customCostPerSession: null,
                  });
                  return;
                }

                const parsed = Number(trimmedValue);
                if (Number.isNaN(parsed) || parsed < 0) {
                  toast.error('Chi phí custom phải là số >= 0.');
                  return;
                }

                upsertStudentCostMutation.mutate({
                  studentId: editingCostStudentId,
                  customCostPerSession: parsed,
                });
              }}
            >
              {upsertStudentCostMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
              Lưu C/L
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingCell)}
        onOpenChange={(open) => {
          if (open) {
            return;
          }
          setEditingCell(null);
          resetAttendanceEditor();
        }}
      >
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              Quản lý checkin: {editingCellRow?.studentName ?? '-'} ({editingCell?.dateKey ?? '-'})
            </DialogTitle>
            <DialogDescription>Thêm, sửa hoặc xóa checkin của học sinh trong ngày đã chọn. Lưu xong sẽ tự đóng popup.</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='rounded-xl border border-border/70 p-3'>
              <p className='mb-2 text-sm font-medium'>Danh sách checkin hiện có</p>
              {editingCellData?.checkins.length ? (
                <div className='space-y-2'>
                  {editingCellData.checkins.map((item) => (
                    <div key={item.id} className='flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm'>
                      <div>
                        <p className='font-medium'>
                          {item.checkType.toUpperCase()} - {formatTime(item.checkDate)}
                        </p>
                        <p className='text-muted-foreground'>{toText(item.note, 'Không có ghi chú')}</p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='secondary'
                          size='sm'
                          disabled={attendanceActionPending}
                          onClick={() => {
                            setEditingCheckinId(String(item.id));
                            setEditingCheckType(item.checkType);
                            setEditingCheckTime(toTimeInput(item.checkDate));
                            setEditingCheckNote(toText(item.note, ''));
                          }}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          disabled={attendanceActionPending}
                          onClick={async () => {
                            const confirmed = await confirmDialog({
                              title: 'Xóa checkin',
                              description: 'Bạn chắc chắn muốn xóa checkin này?',
                              confirmText: 'Xóa',
                              variant: 'danger',
                            });
                            if (!confirmed) return;
                            deleteAttendanceMutation.mutate(String(item.id));
                          }}
                        >
                          <Trash2 className='h-4 w-4 text-danger' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>Chưa có checkin trong ngày này.</p>
              )}
            </div>

            <div className='grid gap-3 md:grid-cols-2'>
              <div>
                <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Loại checkin</p>
                <Select
                  value={editingCheckType}
                  onValueChange={(value) => setEditingCheckType(value as 'in' | 'out')}
                  disabled={attendanceActionPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='in'>Check-in</SelectItem>
                    <SelectItem value='out'>Check-out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Giờ</p>
                <Input
                  type='time'
                  value={editingCheckTime}
                  onChange={(event) => setEditingCheckTime(event.target.value)}
                  disabled={attendanceActionPending}
                />
              </div>
            </div>

            <div>
              <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>Ghi chú</p>
              <Textarea
                value={editingCheckNote}
                onChange={(event) => setEditingCheckNote(event.target.value)}
                placeholder='Nhập ghi chú (tuỳ chọn)'
                disabled={attendanceActionPending}
              />
            </div>
          </div>

          <DialogFooter>
            {editingCheckinId ? (
              <Button type='button' variant='secondary' disabled={attendanceActionPending} onClick={resetAttendanceEditor}>
                Hủy chế độ sửa
              </Button>
            ) : null}
            <Button
              type='button'
              disabled={attendanceActionPending || !editingCell || !editingCheckTime.trim()}
              onClick={() => {
                if (!editingCell) {
                  return;
                }

                const payload: AttendanceWritePayload = {
                  soStudentId: editingCell.studentId,
                  soClassesId: classId,
                  checkType: editingCheckType,
                  checkDate: buildCheckDateTime(editingCell.dateKey, editingCheckTime),
                  note: editingCheckNote.trim() || undefined,
                };

                saveAttendanceMutation.mutate({
                  checkinId: editingCheckinId ? String(editingCheckinId) : undefined,
                  payload,
                });
              }}
            >
              {saveAttendanceMutation.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
              {editingCheckinId ? 'Cập nhật checkin' : 'Thêm checkin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(invoiceStudentId)}
        onOpenChange={(open) => {
          if (!open) {
            setInvoiceStudentId(null);
            setInvoiceAction(null);
          }
        }}
      >
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Hóa đơn học phí theo kỳ</DialogTitle>
            <DialogDescription>
              {invoiceRow?.studentName ?? '-'} - Lớp {className} - Kỳ {invoicePeriodText}
            </DialogDescription>
          </DialogHeader>

          <div className='flex items-center justify-end gap-1'>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              title='Chia sẻ ảnh hóa đơn'
              disabled={invoiceAction !== null}
              onClick={handleShareInvoiceImage}
            >
              {invoiceAction === 'share' ? <Loader2 className='h-4 w-4 animate-spin' /> : <Share2 className='h-4 w-4' />}
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              title='Tải ảnh hóa đơn'
              disabled={invoiceAction !== null}
              onClick={handleDownloadInvoiceImage}
            >
              {invoiceAction === 'download' ? <Loader2 className='h-4 w-4 animate-spin' /> : <Download className='h-4 w-4' />}
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              title='Copy ảnh hóa đơn'
              disabled={invoiceAction !== null}
              onClick={handleCopyInvoiceImage}
            >
              {invoiceAction === 'copy' ? <Loader2 className='h-4 w-4 animate-spin' /> : <Copy className='h-4 w-4' />}
            </Button>
          </div>

          <div ref={invoiceCardRef} className='space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4 text-sm'>
            <div className='flex items-center justify-between'>
              <span>Học sinh</span>
              <span className='font-medium'>{invoiceRow?.studentName ?? '-'}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span>Chi phí/buổi áp dụng</span>
              <span className='font-medium'>{formatCurrency(invoiceUnitCost)}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span>Số buổi có check-in</span>
              <span className='font-medium'>{invoicePresentSessions}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span>Số ngày theo dõi trong tháng</span>
              <span className='font-medium'>{attendanceDays.length}</span>
            </div>
            <div className='mt-3 border-t border-border/70 pt-3'>
              <div className='flex items-center justify-between text-base font-semibold'>
                <span>Tổng tiền</span>
                <span>{formatCurrency(invoiceTotal)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
