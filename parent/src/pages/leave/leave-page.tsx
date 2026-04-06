import { PageTitleHeader } from '@/app/components/page-title-header'
import { useNavigate } from 'react-router-dom'
import { StudentSelectorCard } from '@/pages/attendance/components/student-selector-card'
import { LeaveCreateCta } from '@/pages/leave/components/leave-create-cta'
import { LeaveHistoryList } from '@/pages/leave/components/leave-history-list'
import { LeavePageSkeleton, LeaveStateCard } from '@/pages/leave/components/leave-page-state'
import { LeavePolicyCard } from '@/pages/leave/components/leave-policy-card'
import { LeaveSummaryStats } from '@/pages/leave/components/leave-summary-stats'
import { useLeavePage } from '@/pages/leave/hooks/use-leave-page'

export function LeavePage() {
  const navigate = useNavigate()
  const query = useLeavePage()

  if (query.isLoading) {
    return <LeavePageSkeleton />
  }

  if (query.isError || !query.data) {
    return (
      <section className="mx-auto w-full max-w-3xl py-8">
        <LeaveStateCard
          icon="error"
          title="Không thể tải dữ liệu nghỉ học"
          description="Dữ liệu đơn nghỉ hoặc thông tin học sinh chưa sẵn sàng. Vui lòng thử tải lại."
          actionLabel="Tải lại"
          onAction={() => void query.refetch()}
        />
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <PageTitleHeader title="Nghỉ học" titleClassName="text-lg md:text-xl" />

      <div className="mt-4 flex flex-col gap-5">
        <StudentSelectorCard student={query.data.student} />
        <LeaveSummaryStats stats={query.data.summaryStats} />
        <LeaveCreateCta onCreate={() => navigate('/leave/create')} />
        <LeaveHistoryList items={query.data.history} />
        <LeavePolicyCard policy={query.data.policy} />
      </div>
    </section>
  )
}
