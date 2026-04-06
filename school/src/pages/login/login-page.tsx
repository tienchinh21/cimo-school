import { useMutation } from '@tanstack/react-query'
import {
  IconCheck,
  IconEye,
  IconEyeOff,
  IconLock,
  IconSchool,
  IconShieldCheck,
  IconUserCircle,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthActions } from '@/app/contexts/AuthContext'
import { getRedirectPath } from '@/app/router/auth-routing.utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getTeacherProfile, loginTeacher } from '@/shared/api/auth'
import { ApiError } from '@/shared/api/types'
import { usePageSeo } from '@/shared/lib'

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.payload?.message || error.message || fallback
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function LoginPage() {
  usePageSeo({
    title: 'Đăng nhập giáo viên',
    description:
      'Đăng nhập Cimo School Teacher để quản lý lớp học, điểm danh, đơn nghỉ và bản tin phụ huynh.',
    keywords: ['dang nhap giao vien', 'cimo school teacher', 'teacher mobile'],
    noindex: true,
  })

  const { completeAuthentication } = useAuthActions()
  const location = useLocation()
  const navigate = useNavigate()
  const [credential, setCredential] = useState('')
  const [secret, setSecret] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [error, setError] = useState('')

  const redirectPath = getRedirectPath(location.state)

  const loginMutation = useMutation({
    mutationFn: async () => {
      const auth = await loginTeacher({
        credential: credential.trim(),
        secret,
      })
      const profile = await getTeacherProfile(auth.token)

      return {
        token: auth.token,
        user: profile,
      }
    },
    onError: (mutationError) => {
      setError(resolveErrorMessage(mutationError, 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'))
    },
    onSuccess: ({ token, user }) => {
      completeAuthentication({ token, user })
      navigate(redirectPath, { replace: true })
    },
  })

  return (
    <section className="page-shell flex min-h-screen w-full flex-col bg-linear-to-b from-background via-background to-blue-50/30">
      <div className="relative overflow-hidden bg-linear-to-br from-slate-900 via-blue-700 to-cyan-500 px-6 pb-8 pt-8 text-white">
        <span className="absolute -right-8 -top-8 size-28 rounded-full bg-white/10" />
        <span className="absolute -bottom-10 -left-10 size-28 rounded-full bg-white/10" />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold">
            <IconSchool className="size-4" />
            Cimo School Teacher
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cổng Giáo Viên</h1>
            <p className="mt-2 text-sm text-white/90">
              Đăng nhập để quản lý lớp học, điểm danh, duyệt đơn nghỉ và cập nhật bản tin phụ huynh.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
              <IconCheck className="size-3.5" />
              Mobile-first
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
              <IconCheck className="size-3.5" />
              Nghiệp vụ tập trung
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
              <IconCheck className="size-3.5" />
              Điều hướng nhanh
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-5">
        <div className="ui-section space-y-4 p-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Thông tin đăng nhập</p>
            <p className="text-sm text-muted-foreground">Sử dụng tài khoản CMS có vai trò Giáo viên.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tài khoản</label>
            <div className="relative">
              <IconUserCircle className="pointer-events-none absolute left-3 top-3 size-5 text-muted-foreground" />
              <Input
                value={credential}
                onChange={(event) => {
                  setCredential(event.target.value)
                  setError('')
                }}
                className="h-11 rounded-xl pl-10"
                placeholder="Nhập username hoặc email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mật khẩu</label>
            <div className="relative">
              <IconLock className="pointer-events-none absolute left-3 top-3 size-5 text-muted-foreground" />
              <Input
                type={isPasswordVisible ? 'text' : 'password'}
                value={secret}
                onChange={(event) => {
                  setSecret(event.target.value)
                  setError('')
                }}
                className="h-11 rounded-xl px-10"
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-muted-foreground"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
              >
                {isPasswordVisible ? <IconEyeOff className="size-5" /> : <IconEye className="size-5" />}
              </button>
            </div>
          </div>

          <Button
            type="button"
            className="h-12 w-full rounded-xl text-base font-semibold"
            disabled={loginMutation.isPending || !credential.trim() || !secret.trim()}
            onClick={() => {
              if (secret.trim().length < 6) {
                setError('Mật khẩu cần ít nhất 6 ký tự.')
                return
              }

              loginMutation.mutate()
            }}
          >
            {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>

          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-2 text-sm text-emerald-700">
            <IconShieldCheck className="mt-0.5 size-4 shrink-0" />
            <p>
              Bảo mật tài khoản: không chia sẻ mật khẩu và luôn đăng xuất khi dùng thiết bị công cộng.
            </p>
          </div>
        </div>

        <div className="mt-auto rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Teacher Mobile Workspace</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Giao diện tối ưu cho thao tác nhanh, tập trung nhiệm vụ quan trọng trong ngày.
          </p>
        </div>
      </div>
    </section>
  )
}
