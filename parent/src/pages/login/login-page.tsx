import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconArrowLeft, IconBook2, IconCheck, IconDeviceMobile, IconMessage2, IconSchool, IconShieldLock } from '@tabler/icons-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthActions, useAuthStatus, usePendingPhone } from '@/app/contexts/AuthContext'
import { getRedirectPath } from '@/app/router/auth-routing.utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getParentProfile, sendParentOtp, verifyParentOtp } from '@/shared/api/auth'
import { ApiError } from '@/shared/api/types'
import { cn } from '@/shared/lib'

type LoginStep = 'phone' | 'otp'

function maskPhoneNumber(phone: string) {
  if (phone.length < 4) {
    return phone
  }

  const start = phone.slice(0, 3)
  const end = phone.slice(-3)

  return `${start}****${end}`
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.payload?.message || error.message || fallbackMessage
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}

export function LoginPage() {
  const authStatus = useAuthStatus()
  const pendingPhone = usePendingPhone()
  const {
    backToPhoneEntry,
    completeAuthentication,
    markOtpRequested,
    setPendingPhone,
  } = useAuthActions()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')

  const step: LoginStep = authStatus === 'otp-pending' || authStatus === 'authenticating' ? 'otp' : 'phone'
  const maskedPhone = maskPhoneNumber(pendingPhone)
  const redirectPath = getRedirectPath(location.state)

  const sendOtpMutation = useMutation({
    mutationFn: sendParentOtp,
    onError: (mutationError) => {
      setError(getErrorMessage(mutationError, 'Không thể gửi mã OTP.'))
      setHint('')
    },
    onSuccess: (response, phone) => {
      markOtpRequested(phone)
      setError('')
      setHint(response.message || `Mã OTP đã được gửi đến ${maskPhoneNumber(phone)}.`)
      setOtp('')
    },
  })

  const verifyOtpMutation = useMutation({
    mutationFn: verifyParentOtp,
    onError: (mutationError) => {
      setError(getErrorMessage(mutationError, 'Mã OTP không hợp lệ hoặc đã hết hạn.'))
    },
    onSuccess: async (response) => {
      setError('')
      setHint('')
      queryClient.clear()

      try {
        const profile = await queryClient.fetchQuery({
          queryKey: ['auth', 'me'],
          queryFn: () => getParentProfile(response.token),
          retry: false,
          staleTime: 1000 * 60 * 5,
        })

        completeAuthentication({
          token: response.token,
          user: profile,
        })
        setOtp('')
        navigate(redirectPath, { replace: true })
      } catch (profileError) {
        setError(getErrorMessage(profileError, 'Xác thực thành công nhưng không tải được thông tin phụ huynh.'))
      }
    },
  })

  const handleSendOtp = () => {
    const normalizedPhone = pendingPhone.trim()
    const isValidPhone = /^0\d{9}$/.test(normalizedPhone)

    if (!isValidPhone) {
      setError('Vui lòng nhập số điện thoại hợp lệ (10 số, bắt đầu bằng 0).')
      setHint('')
      return
    }

    setError('')
    sendOtpMutation.mutate(normalizedPhone)
  }

  const handleVerifyOtp = () => {
    const normalizedPhone = pendingPhone.trim()
    const normalizedOtp = otp.trim()

    if (!/^\d{6}$/.test(normalizedOtp)) {
      setError('Mã OTP cần đủ 6 chữ số.')
      return
    }

    if (!/^0\d{9}$/.test(normalizedPhone)) {
      setError('Số điện thoại đăng nhập không hợp lệ. Vui lòng gửi lại OTP.')
      return
    }

    setError('')
    verifyOtpMutation.mutate({
      otp: normalizedOtp,
      phone: normalizedPhone,
    })
  }

  const isSubmitting = sendOtpMutation.isPending || verifyOtpMutation.isPending || authStatus === 'authenticating'

  return (
    <section className="flex min-h-screen w-full flex-col bg-linear-to-b from-background via-background to-blue-50/40">
      <div className="relative overflow-hidden bg-linear-to-br from-primary to-blue-700 px-6 pb-7 pt-7 text-primary-foreground">
        <span className="absolute -right-8 -top-8 size-28 rounded-full bg-white/10" />
        <span className="absolute -bottom-9 -left-9 size-24 rounded-full bg-white/10" />
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            {step === 'otp' ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="size-10 rounded-full bg-white/20 text-white hover:bg-white/30"
                onClick={() => {
                  backToPhoneEntry()
                  setError('')
                  setHint('')
                  setOtp('')
                }}
                disabled={isSubmitting}
              >
                <IconArrowLeft className="size-5" />
              </Button>
            ) : (
              <span className="size-10" />
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold">
              <IconSchool className="size-4" />
              Cimo School
            </span>
            <span className="size-10" />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Cổng Phụ Huynh</h1>
            <p className="mt-2 text-base text-white/90">Đăng nhập để theo dõi quá trình học tập của học sinh</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-4 px-4 pb-6 pt-4">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-card p-3 shadow-sm">
          <div
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold',
              step === 'phone' ? 'bg-primary/10 text-primary' : 'bg-green-100 text-green-700',
            )}
          >
            {step === 'phone' ? <IconDeviceMobile className="size-4" /> : <IconCheck className="size-4" />}
            Nhập số điện thoại
          </div>
          <span className="text-muted-foreground">→</span>
          <div
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold',
              step === 'otp' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
            )}
          >
            <IconShieldLock className="size-4" />
            Xác thực OTP
          </div>
        </div>
        {step === 'phone' ? (
          <div className="flex min-h-100 flex-col space-y-5 rounded-3xl bg-card p-5 shadow-sm">
            <div className="p-1">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <IconBook2 className="size-4" />
                <span className="text-xs font-semibold uppercase">Bước 1</span>
              </div>
              <p className="text-base font-medium text-foreground">Nhập số điện thoại phụ huynh để nhận mã OTP đăng nhập.</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Số điện thoại</label>
              <Input
                type="tel"
                value={pendingPhone}
                onChange={(event) => {
                  setPendingPhone(event.target.value.replace(/[^\d]/g, ''))
                  setError('')
                }}
                placeholder="Ví dụ: 0912345678"
                className="h-14 rounded-2xl border-border bg-background px-5 text-lg"
                disabled={isSubmitting}
              />
            </div>

            <div className="mt-auto pt-2">
              <Button
                type="button"
                className="h-14 w-full rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                onClick={handleSendOtp}
                disabled={pendingPhone.trim().length < 10 || isSubmitting}
              >
                <span className="inline-flex items-center gap-2.5">
                  <IconMessage2 className="size-6" />
                  <span>{sendOtpMutation.isPending ? 'Đang gửi OTP...' : 'Nhận OTP'}</span>
                </span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-100 flex-col space-y-5 rounded-3xl bg-card p-5 shadow-sm">
            <div className="p-1">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <IconShieldLock className="size-4" />
                <span className="text-xs font-semibold uppercase">Bước 2</span>
              </div>
              <p className="text-base font-medium text-foreground">Nhập mã OTP 6 số đã gửi về {maskedPhone} để hoàn tất đăng nhập.</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Mã OTP</label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value.replace(/[^\d]/g, ''))
                  setError('')
                }}
                placeholder="Nhập 6 số"
                className="h-14 rounded-2xl border-border bg-background text-center text-2xl tracking-[0.35em]"
                disabled={isSubmitting}
              />
            </div>

            <div className="mt-auto space-y-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full rounded-2xl text-base text-muted-foreground"
                onClick={handleSendOtp}
                disabled={isSubmitting}
              >
                {sendOtpMutation.isPending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
              </Button>
              <Button
                type="button"
                className="h-14 w-full rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                onClick={handleVerifyOtp}
                disabled={otp.trim().length < 6 || isSubmitting}
              >
                <span className="inline-flex items-center gap-2.5">
                  <IconShieldLock className="size-6" />
                  <span>{verifyOtpMutation.isPending || authStatus === 'authenticating' ? 'Đang xác thực...' : 'Xác nhận OTP'}</span>
                </span>
              </Button>
            </div>
          </div>
        )}

        {error ? <p className="px-1 text-sm font-medium text-destructive">{error}</p> : null}
        {hint && !error ? <p className="px-1 text-sm font-medium text-primary">{hint}</p> : null}
        <div className="mt-auto rounded-2xl border border-primary/15 bg-primary/5 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Cimo School</p>
          <p className="mt-1 text-sm text-muted-foreground">Kết nối phụ huynh - nhà trường nhanh chóng, an toàn.</p>
        </div>
      </div>
    </section>
  )
}
