import { IconPhotoOff, IconSchool, IconZoomIn } from '@tabler/icons-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { LeaveRequestDetail } from '@/pages/leave/types/leave-page.types'

interface LeaveDetailInfoCardProps {
  detail: LeaveRequestDetail
}

export function LeaveDetailInfoCard({ detail }: LeaveDetailInfoCardProps) {
  return (
    <section className="space-y-4">
      <article className="ui-card flex items-center gap-4 p-5">
        <div className="relative">
          <Avatar className="size-16 rounded-2xl border border-border shadow-sm">
            <AvatarImage src={detail.student.avatarUrl} alt={detail.student.name} />
            <AvatarFallback>{detail.student.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
            <IconSchool className="size-3.5" />
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-foreground">{detail.student.name}</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
              {detail.student.grade}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">
              Năm học 2023-2024
            </span>
          </div>
        </div>
      </article>

      <article className="ui-card space-y-5 p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Ngày gửi</p>
            <p className="text-sm font-medium text-foreground">{detail.submittedDateLabel}</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Thời gian nghỉ</p>
            <p className="text-sm font-medium text-foreground">{detail.leaveDateLabel}</p>
          </div>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Lý do nghỉ</p>
          <p className="text-sm leading-relaxed text-foreground">{detail.reason}</p>
        </div>

        {detail.attachment ? (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">Minh chứng đính kèm</p>
            <button
              type="button"
              className="relative h-44 w-32 overflow-hidden rounded-xl border border-border bg-muted/40 transition-opacity hover:opacity-90"
            >
              <img src={detail.attachment.imageUrl} alt="Minh chứng đính kèm" className="size-full object-cover opacity-80" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/10 text-white">
                <IconZoomIn className="size-5" />
              </span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-5 text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
              <IconPhotoOff className="size-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-foreground">Chưa có minh chứng đính kèm</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Đơn này được gửi không kèm hình ảnh hoặc tài liệu bổ sung.
            </p>
          </div>
        )}
      </article>
    </section>
  )
}
