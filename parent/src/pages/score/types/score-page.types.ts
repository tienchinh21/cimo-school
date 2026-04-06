export const scoreTermKeys = {
  TERM_1: 'term_1',
  TERM_2: 'term_2',
  FULL_YEAR: 'full_year',
} as const

export type ScoreTermKey = (typeof scoreTermKeys)[keyof typeof scoreTermKeys]

export interface ScoreStudent {
  id: string
  name: string
  grade: string
  avatarUrl: string
}

export interface ScoreOverview {
  averageScore: number
  rankLabel: string
  trendLabel: string
}

export const scoreSubjectStates = {
  GOOD: 'GOOD',
  STABLE: 'STABLE',
  NEED_ATTENTION: 'NEED_ATTENTION',
} as const

export type ScoreSubjectState = (typeof scoreSubjectStates)[keyof typeof scoreSubjectStates]

export interface ScoreSubjectItem {
  id: string
  name: string
  score: number
  state: ScoreSubjectState
}

export interface ScoreAssessmentItem {
  id: string
  title: string
  dateLabel: string
  score: number
  categoryLabel: string
  weightLabel: string
}

export interface ScoreExamCardItem {
  id: string
  title: string
  dateLabel: string
  score: number
  highlightLabel: string
  isPrimary?: boolean
}

export interface ScoreTeacherComment {
  teacherName: string
  teacherRoleLabel: string
  teacherAvatarUrl: string
  content: string
}

export interface ScoreSubjectDetail {
  id: string
  subjectName: string
  averageScore: number
  rankLabel: string
  rankDetailLabel: string
  assessments: ScoreAssessmentItem[]
  exams: ScoreExamCardItem[]
  teacherComment: ScoreTeacherComment
}

export interface ScoreTermData {
  overview: ScoreOverview
  subjects: ScoreSubjectItem[]
}

export interface ScoreDashboard {
  student: ScoreStudent
  terms: Record<ScoreTermKey, ScoreTermData>
}
