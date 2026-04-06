import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  IconAlertCircle,
  IconBuildingCommunity,
  IconIdBadge2,
  IconLock,
  IconMail,
  IconMapPin,
  IconPhone,
  IconSchool,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageTitleHeader } from '@/app/components/page-title-header'
import { useAuthActions, useAuthToken, useAuthUser } from '@/app/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { changeTeacherPassword, updateTeacherProfile } from '@/shared/api/auth'
import { toApiAssetUrl } from '@/shared/api/env'
import { queryKeys } from '@/shared/api/query-keys'
import { toDateInputValue, usePageSeo } from '@/shared/lib'

type ProfileForm = {
  address: string
  avt: string
  dob: string
  email: string
  name: string
  phone: string
}

type PasswordForm = {
  confirmPassword: string
  currentPassword: string
  newPassword: string
}

function toDateField(value?: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return toDateInputValue(date)
}

function buildFormFromUser(user: ReturnType<typeof useAuthUser>): ProfileForm {
  return {
    address: user?.address ?? '',
    avt: user?.avt ?? '',
    dob: toDateField(user?.dob),
    email: user?.email ?? '',
    name: user?.name ?? '',
    phone: user?.phone ?? '',
  }
}

function getInitials(name?: string | null) {
  const value = name?.trim()
  if (!value) {
    return 'GV'
  }

  const parts = value.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return `${first}${last}`.toUpperCase()
}

export function ProfilePage() {
  usePageSeo({
    title: 'Quản lý hồ sơ giáo viên',
    description:
      'Cập nhật hồ sơ cá nhân giáo viên gồm tên hiển thị, liên hệ và thông tin lớp phụ trách.',
    keywords: ['profile giao vien', 'ho so giao vien', 'teacher profile', 'cimo school'],
  })

  const user = useAuthUser()
  const token = useAuthToken()
  const { hydratePersistedUser } = useAuthActions()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProfileForm>(() => buildFormFromUser(user))
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    confirmPassword: '',
    currentPassword: '',
    newPassword: '',
  })
  const avatarUrl = useMemo(() => toApiAssetUrl(form.avt || user?.avt), [form.avt, user?.avt])

  const completionStats = useMemo(() => {
    const fields = [form.phone, form.email, form.address, form.dob, form.avt]
    const completed = fields.filter((item) => Boolean(item.trim())).length
    const total = fields.length
    const percent = Math.round((completed / total) * 100)

    return { completed, percent, total }
  }, [form.address, form.avt, form.dob, form.email, form.phone])

  const isDirty = useMemo(() => {
    const snapshot = buildFormFromUser(user)

    return (
      snapshot.name !== form.name ||
      snapshot.phone !== form.phone ||
      snapshot.email !== form.email ||
      snapshot.address !== form.address ||
      snapshot.dob !== form.dob ||
      snapshot.avt !== form.avt
    )
  }, [form.address, form.avt, form.dob, form.email, form.name, form.phone, user])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      }

      const name = form.name.trim()
      if (!name) {
        throw new Error('Tên hiển thị là bắt buộc.')
      }

      return updateTeacherProfile(token, {
        address: form.address.trim() || undefined,
        avt: form.avt.trim() || undefined,
        dob: form.dob ? new Date(`${form.dob}T00:00:00`).toISOString() : undefined,
        email: form.email.trim() || undefined,
        name,
        phone: form.phone.trim() || undefined,
      })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ.'
      toast.error(message)
    },
    onSuccess: (profile) => {
      hydratePersistedUser(profile)
      setForm(buildFormFromUser(profile))
      toast.success('Đã cập nhật thông tin hồ sơ giáo viên.')
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
    },
  })

  const passwordHint = useMemo(() => {
    const currentPassword = passwordForm.currentPassword.trim()
    const newPassword = passwordForm.newPassword.trim()
    const confirmPassword = passwordForm.confirmPassword.trim()

    if (!currentPassword && !newPassword && !confirmPassword) {
      return null
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return 'Vui lòng nhập đủ 3 trường mật khẩu.'
    }

    if (newPassword.length < 6) {
      return 'Mật khẩu mới cần tối thiểu 6 ký tự.'
    }

    if (currentPassword === newPassword) {
      return 'Mật khẩu mới cần khác mật khẩu hiện tại.'
    }

    if (newPassword !== confirmPassword) {
      return 'Xác nhận mật khẩu mới chưa khớp.'
    }

    return null
  }, [passwordForm.confirmPassword, passwordForm.currentPassword, passwordForm.newPassword])

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      }

      const currentPassword = passwordForm.currentPassword.trim()
      const newPassword = passwordForm.newPassword.trim()
      const confirmPassword = passwordForm.confirmPassword.trim()

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Vui lòng nhập đầy đủ thông tin mật khẩu.')
      }

      if (newPassword.length < 6) {
        throw new Error('Mật khẩu mới cần tối thiểu 6 ký tự.')
      }

      if (currentPassword === newPassword) {
        throw new Error('Mật khẩu mới cần khác mật khẩu hiện tại.')
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Xác nhận mật khẩu mới chưa khớp.')
      }

      return changeTeacherPassword(token, { currentPassword, newPassword })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Không thể đổi mật khẩu.'
      toast.error(message)
    },
    onSuccess: (result) => {
      setPasswordForm({
        confirmPassword: '',
        currentPassword: '',
        newPassword: '',
      })
      toast.success(result.message || 'Đã đổi mật khẩu thành công.')
    },
  })

  return (
    <section className="page-shell mx-auto w-full max-w-md space-y-4">
      <div className="ui-section space-y-4 p-4">
        <PageTitleHeader
          title="Quản lý Profile"
          subtitle="Cập nhật thông tin cá nhân giáo viên để đồng bộ trên toàn hệ thống"
        />

        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-indigo-700 to-sky-600 p-4 text-white">
          <span className="absolute -right-8 -top-8 size-24 rounded-full bg-white/10" />
          <span className="absolute -bottom-8 -left-8 size-20 rounded-full bg-white/10" />
          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <Avatar className="size-11 border border-white/40">
                <AvatarImage src={avatarUrl} alt={form.name || user?.name || 'Giáo viên'} />
                <AvatarFallback className="bg-white/20 text-sm font-bold text-white">
                  {getInitials(form.name || user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-base font-bold">{user?.name || 'Giáo viên'}</p>
                <p className="truncate text-xs text-white/85">@{user?.username || 'teacher'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/85">Lớp phụ trách</p>
                <p className="text-base font-bold">{user?.soClasses?.length ?? 0}</p>
              </div>
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/85">Hồ sơ hoàn thiện</p>
                <p className="text-base font-bold">{completionStats.percent}%</p>
              </div>
              <div className="rounded-xl bg-white/15 px-2 py-2">
                <p className="text-[11px] text-white/85">Mục đã điền</p>
                <p className="text-base font-bold">
                  {completionStats.completed}/{completionStats.total}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="ui-subtle-panel space-y-3 p-3">
          <p className="text-sm font-semibold">Thông tin chính</p>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tên hiển thị</p>
            <Input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nhập tên hiển thị"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Số điện thoại</p>
              <div className="relative">
                <IconPhone className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="pl-9"
                  placeholder="09xxxxxxxx"
                />
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ngày sinh</p>
              <Input
                type="date"
                value={form.dob}
                onChange={(event) => setForm((prev) => ({ ...prev, dob: event.target.value }))}
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
            <div className="relative">
              <IconMail className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="pl-9"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Địa chỉ</p>
            <div className="relative">
              <IconMapPin className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                className="pl-9"
                placeholder="Nhập địa chỉ liên hệ"
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ảnh đại diện (URL)</p>
            <Input
              value={form.avt}
              onChange={(event) => setForm((prev) => ({ ...prev, avt: event.target.value }))}
              placeholder="https://..."
            />
            <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-muted/70 bg-muted/20 px-2.5 py-2">
              <Avatar className="size-9">
                <AvatarImage src={avatarUrl} alt={form.name || user?.name || 'Giáo viên'} />
                <AvatarFallback className="bg-indigo-100 text-xs font-bold text-indigo-700">
                  {getInitials(form.name || user?.name)}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground">Ảnh xem trước sẽ tự cập nhật theo URL.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={saveMutation.isPending || !isDirty}
              onClick={() => setForm(buildFormFromUser(user))}
            >
              Hoàn tác
            </Button>
            <Button
              type="button"
              disabled={saveMutation.isPending || !isDirty || !form.name.trim()}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu Profile'}
            </Button>
          </div>
        </div>
      </div>

      <section className="ui-section space-y-3 p-4">
        <h2 className="text-base font-bold">Thông tin tài khoản</h2>

        <div className="ui-subtle-panel space-y-2 p-3 text-sm">
          <p className="inline-flex items-center gap-1.5 text-muted-foreground">
            <IconIdBadge2 className="size-4" />
            Username: {user?.username || '--'}
          </p>
          <p className="inline-flex items-center gap-1.5 text-muted-foreground">
            <IconIdBadge2 className="size-4" />
            CCCD/CMND: {user?.nationalId || 'Chưa cập nhật'}
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Lớp đang phụ trách</p>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {(user?.soClasses ?? []).length === 0 ? (
              <p className="ui-subtle-panel px-3 py-2 text-xs text-muted-foreground">
                Chưa có lớp được phân công.
              </p>
            ) : (
              (user?.soClasses ?? []).map((item) => (
                <span
                  key={item.id}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700"
                >
                  <IconSchool className="size-3.5" />
                  {item.name}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="ui-section space-y-3 p-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <IconLock className="size-4.5" />
          </span>
          <div>
            <h2 className="text-base font-bold">Đổi mật khẩu</h2>
            <p className="text-xs text-muted-foreground">Tăng bảo mật tài khoản giáo viên trên ứng dụng.</p>
          </div>
        </div>

        <div className="ui-subtle-panel space-y-3 p-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mật khẩu hiện tại</p>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
              }
              placeholder="Nhập mật khẩu hiện tại"
              autoComplete="current-password"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mật khẩu mới</p>
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
              }
              placeholder="Tối thiểu 6 ký tự"
              autoComplete="new-password"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Xác nhận mật khẩu mới
            </p>
            <Input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
            />
          </div>

          {passwordHint ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {passwordHint}
            </p>
          ) : (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Mật khẩu hợp lệ, bạn có thể xác nhận thay đổi.
            </p>
          )}

          <Button
            type="button"
            className="w-full"
            disabled={passwordMutation.isPending || Boolean(passwordHint)}
            onClick={() => passwordMutation.mutate()}
          >
            {passwordMutation.isPending ? 'Đang cập nhật mật khẩu...' : 'Xác nhận đổi mật khẩu'}
          </Button>
        </div>
      </section>

      {saveMutation.isError ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <IconAlertCircle className="size-4" />
          <p>Không thể cập nhật hồ sơ. Vui lòng thử lại sau.</p>
        </div>
      ) : null}

      {completionStats.percent < 60 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <p className="inline-flex items-center gap-1">
            <IconBuildingCommunity className="size-4" />
            Gợi ý: hoàn thiện profile để nhà trường liên hệ thuận tiện hơn khi có thông báo khẩn.
          </p>
        </div>
      ) : null}
    </section>
  )
}
