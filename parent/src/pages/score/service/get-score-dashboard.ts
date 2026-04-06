import { scoreSubjectStates, scoreTermKeys, type ScoreDashboard } from '@/pages/score/types/score-page.types'

const scoreDashboardMock: ScoreDashboard = {
  student: {
    id: 'student-1',
    name: 'Nguyễn Văn A',
    grade: 'Lớp 5A',
    avatarUrl: 'https://i.pravatar.cc/96?img=12',
  },
  terms: {
    [scoreTermKeys.TERM_1]: {
      overview: {
        averageScore: 8.5,
        rankLabel: 'Giỏi',
        trendLabel: 'Tăng 0.4 so với tháng trước',
      },
      subjects: [
        { id: 'math', name: 'Toán', score: 9.2, state: scoreSubjectStates.GOOD },
        { id: 'vietnamese', name: 'Tiếng Việt', score: 8.0, state: scoreSubjectStates.STABLE },
        { id: 'english', name: 'Tiếng Anh', score: 8.8, state: scoreSubjectStates.GOOD },
        { id: 'science', name: 'Khoa học', score: 7.5, state: scoreSubjectStates.NEED_ATTENTION },
        { id: 'history-geo', name: 'Lịch sử & Địa lý', score: 8.2, state: scoreSubjectStates.STABLE },
      ],
    },
    [scoreTermKeys.TERM_2]: {
      overview: {
        averageScore: 8.2,
        rankLabel: 'Khá',
        trendLabel: 'Ổn định so với tháng trước',
      },
      subjects: [],
    },
    [scoreTermKeys.FULL_YEAR]: {
      overview: {
        averageScore: 8.4,
        rankLabel: 'Giỏi',
        trendLabel: 'Tăng 0.3 so với đầu năm',
      },
      subjects: [],
    },
  },
}

export async function getScoreDashboard() {
  await new Promise((resolve) => {
    setTimeout(resolve, 250)
  })

  return scoreDashboardMock
}
