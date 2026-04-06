export interface SendOtpResponse {
  message: string
}

export interface VerifyOtpRequest {
  phone: string
  otp: string
}

export interface VerifyOtpApiResponse {
  message?: string
  token?: string
  accessToken?: string
  data?: {
    token?: string
    accessToken?: string
  }
}

export interface VerifyOtpResponse {
  message?: string
  token: string
}

export const parentGenders = {
  MALE: true,
  FEMALE: false,
} as const

export type ParentGender = (typeof parentGenders)[keyof typeof parentGenders]

export const parentGenderLabels = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
} as const

export function formatParentGender(gender: ParentGender) {
  return gender ? parentGenderLabels.MALE : parentGenderLabels.FEMALE
}

export interface ParentTeacherResponse {
  id: string
  username: string
  password?: string
  name: string
  phone: string
  nationalId: string
  avt: string
  address: string
  email: string
  dob: string
  soRoleIds?: string[]
}

export interface ParentClassResponse {
  id: string
  name: string
  soUsers?: ParentTeacherResponse[]
}

export interface ParentStudentResponse {
  id: string
  name: string
  dob: string
  gender: ParentGender
  phone: string
  email: string
  address: string
  nationalId: string
  avt: string
  soClassId: string
  soClass?: ParentClassResponse
}

export interface ParentProfileResponse {
  id: string
  name: string
  phone: string
  gender: ParentGender
  nationalId: string
  relation: string
  avt: string
  dob: string
  email: string
  address: string
  job: string
  students: ParentStudentResponse[]
}
