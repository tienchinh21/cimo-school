import { IconBook2 } from '@tabler/icons-react'

import type { LeavePolicyInfo } from '@/pages/leave/types/leave-page.types'

interface LeavePolicyCardProps {
  policy: LeavePolicyInfo
}

export function LeavePolicyCard({ policy }: LeavePolicyCardProps) {
  return (
    <section className="rounded-3xl bg-muted p-5 text-center">
      <IconBook2 className="mx-auto size-7 text-muted-foreground" />
      <h3 className="mt-2 text-sm font-bold text-foreground">{policy.title}</h3>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{policy.description}</p>
      <button type="button" className="mt-3 inline-flex rounded-full bg-background px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm transition-colors hover:bg-background/80">
        {policy.actionLabel}
      </button>
    </section>
  )
}
