import { useNavigate, useParams } from 'react-router-dom'

import { PageTitleHeader } from '@/app/components/page-title-header'
import { Button } from '@/components/ui/button'
import { LeaveDetailInfoCard } from '@/pages/leave/components/leave-detail-info-card'
import { LeaveDetailStatusBanner } from '@/pages/leave/components/leave-detail-status-banner'
import { LeaveDetailTimeline } from '@/pages/leave/components/leave-detail-timeline'
import { LeaveDetailSkeleton, LeaveStateCard } from '@/pages/leave/components/leave-page-state'
import { useLeaveRequestDetail } from '@/pages/leave/hooks/use-leave-request-detail'
import { leaveRequestStatuses } from '@/pages/leave/types/leave-page.types'

export function LeaveDetailPage() {
  const navigate = useNavigate()
  const { requestId } = useParams<{ requestId: string }>()
  const query = useLeaveRequestDetail(requestId)

  if (query.isLoading) {
    return <LeaveDetailSkeleton />
  }

  if (query.isError) {
    return (
      <section className="mx-auto w-full max-w-3xl py-8">
        <LeaveStateCard
          icon="error"
          title="Không thể tải chi tiết đơn nghỉ"
          description="Kết nối đang gián đoạn hoặc dữ liệu đơn nghỉ chưa đồng bộ. Vui lòng thử tải lại."
          actionLabel="Tải lại"
          onAction={() => void query.refetch()}
        />
      </section>
    )
  }

  if (!query.data) {
    return (
      <section className="mx-auto w-full max-w-3xl py-8">
        <LeaveStateCard
          icon="empty"
          title="Không tìm thấy chi tiết đơn nghỉ"
          description="Đơn nghỉ có thể đã bị xóa hoặc mã đơn không còn hợp lệ."
          actionLabel="Quay lại danh sách"
          onAction={() => navigate('/leave')}
        />
      </section>
    )
  }

  const detail = query.data

  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <PageTitleHeader title="Chi tiết đơn nghỉ học" titleClassName="text-lg md:text-xl" />

      <div className="mt-4 flex flex-col gap-4">
        <LeaveDetailStatusBanner detail={detail} />
        <LeaveDetailInfoCard detail={detail} />
        <LeaveDetailTimeline items={detail.timeline} />

        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <Button type="button" className="h-11 w-full rounded-xl" onClick={() => navigate('/leave')}>
            Quay lại danh sách
          </Button>
          {detail.status === leaveRequestStatuses.PENDING ? (
            <Button
              type="button"
              variant="secondary"
              className="h-11 w-full rounded-xl"
              onClick={() => navigate(`/leave/${detail.id}/edit`)}
            >
              Chỉnh sửa đơn nghỉ
            </Button>
          ) : (
            <Button type="button" variant="secondary" className="h-11 w-full rounded-xl text-muted-foreground" disabled>
              Chỉ sửa được khi chờ duyệt
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
