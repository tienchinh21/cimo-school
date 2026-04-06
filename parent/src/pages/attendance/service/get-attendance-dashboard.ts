import {
  type AttendanceDashboard,
  attendanceStatuses,
} from '@/pages/attendance/types/attendance-page.types'

const mockAttendanceDashboard: AttendanceDashboard = {
  student: {
    id: 'student-1',
    name: 'Nguyễn Văn A',
    grade: 'Lớp 5A',
    avatarUrl: 'https://i.pravatar.cc/120?img=12',
  },
  updatedAtLabel: '08:30 - 24/05/2024',
  attendanceRate: 95,
  stats: [
    { id: 'present', label: 'Có mặt', shortLabel: 'Có mặt', count: 20, status: attendanceStatuses.ON_TIME },
    { id: 'late', label: 'Đi muộn', shortLabel: 'Đi muộn', count: 2, status: attendanceStatuses.LATE },
    { id: 'excused', label: 'Có phép', shortLabel: 'Có phép', count: 1, status: attendanceStatuses.EXCUSED },
    {
      id: 'unexcused',
      label: 'Không phép',
      shortLabel: 'K.phép',
      count: 0,
      status: attendanceStatuses.UNEXCUSED,
    },
  ],
  groups: [
    {
      id: 'day-24-05-2024',
      heading: 'Thứ 6, 24/05/2024',
      records: [
        {
          id: 'morning-24-05-2024',
          sessionLabel: 'Buổi Sáng',
          status: attendanceStatuses.ON_TIME,
          timeline: 'Vào lớp: 07:45 • Ra chơi: 11:30',
          note: 'Con vào lớp đúng giờ, chuẩn bị bài tốt.',
        },
        {
          id: 'afternoon-24-05-2024',
          sessionLabel: 'Buổi Chiều',
          status: attendanceStatuses.LATE,
          timeline: 'Vào lớp: 13:45 • Ra về: 16:30',
          note: 'Con vào lớp muộn 15 phút do kẹt xe.',
        },
      ],
    },
    {
      id: 'day-23-05-2024',
      heading: 'Thứ 5, 23/05/2024',
      records: [
        {
          id: 'full-day-23-05-2024',
          sessionLabel: 'Cả ngày',
          status: attendanceStatuses.EXCUSED,
          timeline: 'Nghỉ học cả ngày',
          note: 'Con mệt nên gia đình xin phép cho con nghỉ ngơi tại nhà.',
        },
      ],
    },
  ],
}

export async function getAttendanceDashboard() {
  return Promise.resolve(mockAttendanceDashboard)
}
