import {
  scheduleFilterKeys,
  schedulePeriodStatuses,
  type ScheduleDashboardResponse,
} from '@/pages/schedule/types/schedule-page.types'

const scheduleDashboardMock: ScheduleDashboardResponse = {
  student: {
    id: 'student-1',
    name: 'Nguyễn Văn A',
    grade: 'Lớp 5A',
    avatarUrl: 'https://i.pravatar.cc/96?img=12',
  },
  days: {
    [scheduleFilterKeys.TODAY]: {
      dateLabel: 'Thứ Hai, 05/12/2026',
      overview: {
        periodCount: 5,
        semesterLabel: 'Học kỳ I',
        startAt: '07:45',
        endAt: '16:30',
        alertMessage: 'Hôm nay có bài kiểm tra 15 phút môn Toán',
      },
      periods: [
        {
          id: 'period-1',
          order: 1,
          periodLabel: 'Tiết 1',
          startTime: '07:45',
          endTime: '08:30',
          subjectName: 'Toán học',
          teacherName: 'Cô Trần Thị B',
          roomLabel: 'Phòng 302',
          tagLabel: 'Kiểm tra',
          status: schedulePeriodStatuses.ONGOING,
          note: 'Mang theo bộ đồ dùng hình học',
        },
        {
          id: 'period-2',
          order: 2,
          periodLabel: 'Tiết 2',
          startTime: '08:40',
          endTime: '09:25',
          subjectName: 'Tiếng Việt',
          teacherName: 'Thầy Lê Văn C',
          roomLabel: 'Phòng 302',
          tagLabel: 'Học bình thường',
          status: schedulePeriodStatuses.NORMAL,
          note: 'Chuẩn bị sách bài tập',
        },
        {
          id: 'period-3',
          order: 3,
          periodLabel: 'Tiết 3',
          startTime: '09:45',
          endTime: '10:30',
          subjectName: 'Tiếng Anh',
          teacherName: 'Ms. Jessica',
          roomLabel: 'Lab A1',
          tagLabel: 'Đổi phòng',
          status: schedulePeriodStatuses.ROOM_CHANGED,
          note: 'Di chuyển sang phòng Lab A1 trước giờ vào lớp',
        },
        {
          id: 'period-4',
          order: 4,
          periodLabel: 'Tiết 4',
          startTime: '10:40',
          endTime: '11:25',
          subjectName: 'Thể dục',
          teacherName: 'Thầy Nguyễn Văn D',
          roomLabel: 'Sân trường',
          tagLabel: 'Nghỉ',
          status: schedulePeriodStatuses.CANCELED,
        },
      ],
    },
    [scheduleFilterKeys.TOMORROW]: {
      dateLabel: 'Thứ Ba, 06/12/2026',
      overview: {
        periodCount: 4,
        semesterLabel: 'Học kỳ I',
        startAt: '07:45',
        endAt: '15:45',
      },
      periods: [],
    },
    [scheduleFilterKeys.THIS_WEEK]: {
      dateLabel: 'Tuần học 05/12 - 11/12/2026',
      overview: {
        periodCount: 24,
        semesterLabel: 'Học kỳ I',
        startAt: '07:45',
        endAt: '16:30',
      },
      periods: [],
    },
    [scheduleFilterKeys.CUSTOM]: {
      dateLabel: 'Chọn ngày cụ thể',
      overview: {
        periodCount: 0,
        semesterLabel: 'Học kỳ I',
        startAt: '--:--',
        endAt: '--:--',
      },
      periods: [],
    },
  },
}

export async function getScheduleDashboard() {
  await new Promise((resolve) => {
    setTimeout(resolve, 250)
  })

  return scheduleDashboardMock
}
