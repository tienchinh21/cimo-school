import { IconPlus } from '@tabler/icons-react'

interface LeaveCreateCtaProps {
  onCreate?: () => void
}

export function LeaveCreateCta({ onCreate }: LeaveCreateCtaProps) {
  return (
    <button
      type="button"
      onClick={onCreate}
      className="group flex w-full items-center justify-center gap-3 rounded-full bg-primary py-4 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
    >
      <span className="rounded-full bg-white/20 p-1 transition-transform group-hover:scale-110">
        <IconPlus className="size-6" />
      </span>
      <span className="text-base font-bold tracking-wide">Tạo đơn xin nghỉ học</span>
    </button>
  )
}
