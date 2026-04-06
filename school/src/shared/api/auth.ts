import { httpRequest } from '@/shared/api/http-client'
import type {
  TeacherChangePasswordRequest,
  TeacherChangePasswordResponse,
  TeacherLoginRequest,
  TeacherLoginResponse,
  TeacherProfileResponse,
  TeacherUpdateProfileRequest,
} from '@/shared/api/auth.types'

const TEACHER_LOGIN_PATH = '/teachers/auth/login'
const TEACHER_PROFILE_PATH = '/teachers/auth/me'
const TEACHER_PASSWORD_PATH = '/teachers/auth/password'

export function loginTeacher(payload: TeacherLoginRequest) {
  return httpRequest<TeacherLoginResponse>(TEACHER_LOGIN_PATH, {
    body: payload,
    method: 'POST',
  })
}

export function getTeacherProfile(token: string) {
  return httpRequest<TeacherProfileResponse>(TEACHER_PROFILE_PATH, {
    token,
  })
}

export function updateTeacherProfile(token: string, payload: TeacherUpdateProfileRequest) {
  return httpRequest<TeacherProfileResponse>(TEACHER_PROFILE_PATH, {
    body: payload,
    method: 'PATCH',
    token,
  })
}

export function changeTeacherPassword(token: string, payload: TeacherChangePasswordRequest) {
  return httpRequest<TeacherChangePasswordResponse>(TEACHER_PASSWORD_PATH, {
    body: payload,
    method: 'PATCH',
    token,
  })
}
