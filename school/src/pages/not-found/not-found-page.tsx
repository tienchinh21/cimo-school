import { IconArrowLeft, IconCalendarCheck, IconHome2, IconUsers } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { usePageSeo } from '@/shared/lib'

export function NotFoundPage() {
  usePageSeo({
    title: 'Không tìm thấy trang',
    description:
      'Trang bạn truy cập không tồn tại hoặc đã thay đổi đường dẫn trên Cimo School Teacher.',
    noindex: true,
  })

  return (
    <section className="page-shell mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center gap-4">
      <div className="ui-section relative overflow-hidden space-y-4 p-6 text-center">
        <span className="absolute -right-8 -top-8 size-24 rounded-full bg-blue-100/70" />
        <span className="absolute -bottom-8 -left-8 size-24 rounded-full bg-cyan-100/70" />

        <div className="relative space-y-2">
          <p className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            Mã lỗi 404
          </p>
          <h2 className="text-3xl font-bold tracking-tight">Không tìm thấy trang</h2>
          <p className="text-sm text-muted-foreground">
            Đường dẫn này không tồn tại hoặc tài khoản của bạn chưa có quyền truy cập.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="default">
            <Link to="/">
              <IconHome2 className="mr-1 size-4" />
              Về tổng quan
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/attendance">
              <IconCalendarCheck className="mr-1 size-4" />
              Vào điểm danh
            </Link>
          </Button>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link to="/students">
            <IconUsers className="mr-1 size-4" />
            Mở danh sách học sinh
          </Link>
        </Button>
      </div>

      <Button asChild variant="ghost" className="mx-auto">
        <Link to="/">
          <IconArrowLeft className="mr-1 size-4" />
          Quay lại trang chủ
        </Link>
      </Button>
    </section>
  )
}
