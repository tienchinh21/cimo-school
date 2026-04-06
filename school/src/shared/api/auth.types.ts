export interface TeacherAuthClass {
  id: string
  name: string
}

export interface TeacherProfileResponse {
  id: string
  username: string
  name: string
  phone?: string
  nationalId?: string
  avt?: string
  address?: string
  email?: string
  dob?: string
  soClasses?: TeacherAuthClass[]
}

export interface TeacherUpdateProfileRequest {
  address?: string
  avt?: string
  dob?: string
  email?: string
  name?: string
  phone?: string
}

export interface TeacherChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface TeacherChangePasswordResponse {
  message: string
}

export interface TeacherLoginRequest {
  credential: string
  secret: string
}

export interface TeacherLoginResponse {
  token: string
}
