import { IconCirclePlusFilled } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

export function AttendanceRequestCta() {
  return (
    <div className="sticky bottom-4 z-30 flex justify-center px-2 pb-[calc(env(safe-area-inset-bottom)+0.25rem)]">
      <Button type="button" className="h-12 w-full max-w-104 rounded-2xl text-base font-bold shadow-lg shadow-blue-600/30">
        <IconCirclePlusFilled className="mr-2 size-6" />
        Xin nghỉ học / Gửi yêu cầu
      </Button>
    </div>
  )
}
