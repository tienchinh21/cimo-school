import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthActions, useAuthUser } from '@/app/contexts/AuthContext'
import { PageTitleHeader } from '@/app/components/page-title-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatHomeDate, normalizeHomeImageUrl } from '@/pages/home/home-page.utils'
import { formatParentGender } from '@/shared/api/auth.types'

function buildInitials(name?: string) {
  const trimmed = name?.trim()

  if (!trimmed) {
    return 'PH'
  }

  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthUser()
  const { logout } = useAuthActions()

  const profileItems = useMemo(() => {
    if (!user) {
      return []
    }

    return [
      { label: 'Ho va ten', value: user.name || 'Chua cap nhat' },
      { label: 'So dien thoai', value: user.phone || 'Chua cap nhat' },
      { label: 'Email', value: user.email || 'Chua cap nhat' },
      { label: 'Quan he voi hoc sinh', value: user.relation || 'Chua cap nhat' },
      { label: 'Nghe nghiep', value: user.job || 'Chua cap nhat' },
      { label: 'Gioi tinh', value: formatParentGender(user.gender) },
      { label: 'Ngay sinh', value: user.dob ? formatHomeDate(user.dob) : 'Chua cap nhat' },
      { label: 'Dia chi', value: user.address || 'Chua cap nhat' },
      { label: 'CCCD', value: user.nationalId || 'Chua cap nhat' },
    ]
  }, [user])

  if (!user) {
    return (
      <section className="mx-auto w-full max-w-3xl pb-24">
        <PageTitleHeader title="Hồ sơ" titleClassName="text-lg md:text-xl" />
        <section className="ui-card mt-4 rounded-3xl p-5 text-center">
          <p className="text-sm font-semibold text-destructive">Không tìm thấy thông tin phụ huynh</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Phiên đăng nhập hiện tại chưa có dữ liệu hồ sơ. Vui lòng đăng nhập lại để tiếp tục.
          </p>
          <Button
            type="button"
            className="mt-4 rounded-full px-6"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
          >
              Đăng xuất
          </Button>
        </section>
      </section>
    )
  }

  const avatarUrl = normalizeHomeImageUrl(user.avt)
  const studentCount = user.students?.length ?? 0

  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <PageTitleHeader title="Hồ sơ" titleClassName="text-lg md:text-xl" />

      <div className="mt-4 space-y-5">
        <section className="ui-section rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-18 border-2 border-primary/20 shadow-sm">
              <AvatarImage src={avatarUrl} alt={user.name} />
              <AvatarFallback>{buildInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-black tracking-tight text-foreground">{user.name}</p>
              <p className="mt-1 truncate text-sm font-medium text-muted-foreground">{user.email || user.phone}</p>
              <div className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Phụ huynh
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <article className="ui-card rounded-2xl px-4 py-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Học sinh</p>
              <p className="mt-2 text-2xl font-black text-foreground">{studentCount}</p>
            </article>
            <article className="ui-card rounded-2xl px-4 py-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Trạng thái</p>
              <p className="mt-2 text-sm font-bold text-emerald-600">Đang đăng nhập</p>
            </article>
          </div>
        </section>

        <section className="ui-card rounded-3xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">Thông tin tài khoản</h2>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
            >
              Đăng xuất
            </Button>
          </div>

          <div className="space-y-3">
            {profileItems.map((item) => (
              <article key={item.label} className="rounded-2xl border border-border bg-background px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-foreground">{item.value}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
