import type { ScoreSubjectDetail } from '@/pages/score/types/score-page.types'

const scoreSubjectDetails: Record<string, ScoreSubjectDetail> = {
  math: {
    id: 'math',
    subjectName: 'Toán',
    averageScore: 9.0,
    rankLabel: 'Tốt',
    rankDetailLabel: 'Vượt mục tiêu',
    assessments: [
      {
        id: 'assessment-1',
        title: 'Kiểm tra Đại số',
        dateLabel: '12 thg 10, 2023',
        score: 9.5,
        categoryLabel: 'Kiểm tra 15 phút',
        weightLabel: 'Hệ số 1',
      },
      {
        id: 'assessment-2',
        title: 'Kiểm tra Hình học',
        dateLabel: '25 thg 10, 2023',
        score: 8.5,
        categoryLabel: 'Kiểm tra 15 phút',
        weightLabel: 'Hệ số 1',
      },
      {
        id: 'assessment-3',
        title: 'Định lý Pythagoras',
        dateLabel: '05 thg 11, 2023',
        score: 9.0,
        categoryLabel: 'Kiểm tra 1 tiết',
        weightLabel: 'Hệ số 2',
      },
    ],
    exams: [
      {
        id: 'exam-mid',
        title: 'Kiểm tra Giữa kỳ I',
        dateLabel: '15 thg 11, 2023',
        score: 8.5,
        highlightLabel: 'Phát huy',
      },
      {
        id: 'exam-final',
        title: 'Kiểm tra Cuối kỳ I',
        dateLabel: '28 thg 12, 2023',
        score: 9.5,
        highlightLabel: 'Xuất sắc',
        isPrimary: true,
      },
    ],
    teacherComment: {
      teacherName: 'Cô Nguyễn Minh Thư',
      teacherRoleLabel: 'Giáo viên bộ môn',
      teacherAvatarUrl: 'https://i.pravatar.cc/96?img=25',
      content: 'Em tiếp thu bài nhanh, cẩn thận trong trình bày, cần phát huy thêm các bài toán nâng cao.',
    },
  },
}

export async function getScoreSubjectDetail(subjectId: string) {
  await new Promise((resolve) => {
    setTimeout(resolve, 250)
  })

  return scoreSubjectDetails[subjectId] ?? null
}
