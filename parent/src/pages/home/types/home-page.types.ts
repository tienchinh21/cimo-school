export interface HomeHeroStudentViewModel {
  id: string
  name: string
  grade: string
  dobLine: string
  avatarUrl: string
}

export interface HomeTeacherContactViewModel {
  name: string
  phone?: string
  email?: string
  avatarUrl?: string
  homeroom?: string
}

export interface HomeFeaturedNewsViewModel {
  id: string
  title: string
  summary: string
  imageUrl: string
  createdAtLabel: string
}
