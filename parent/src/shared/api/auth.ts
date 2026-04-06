import { httpRequest } from '@/shared/api/http-client'
import type {
  ParentProfileResponse,
  SendOtpResponse,
  VerifyOtpApiResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@/shared/api/auth.types'

const SEND_OTP_PATH = '/auth/send-otp'
const VERIFY_OTP_PATH = '/auth/login-with-otp'
const PARENT_PROFILE_PATH = '/auth/me'

function extractAuthToken(payload: VerifyOtpApiResponse) {
  const token =
    payload.token?.trim() ||
    payload.accessToken?.trim() ||
    payload.data?.token?.trim() ||
    payload.data?.accessToken?.trim()

  if (!token) {
    throw new Error('Không tìm thấy token trong response xác thực OTP.')
  }

  return token
}

export function sendParentOtp(phone: string) {
  return httpRequest<SendOtpResponse>(SEND_OTP_PATH, {
    method: 'POST',
    body: { phone },
  })
}

export async function verifyParentOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  const response = await httpRequest<VerifyOtpApiResponse>(VERIFY_OTP_PATH, {
    method: 'POST',
    body: payload,
  })

  return {
    message: response.message,
    token: extractAuthToken(response),
  }
}

export function getParentProfile(token: string) {
  return httpRequest<ParentProfileResponse>(PARENT_PROFILE_PATH, {
    token,
  })
}
