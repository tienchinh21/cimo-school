import { IconAlertCircle, IconFileText, IconSparkles } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib'

interface LeaveStateCardProps {
  title: string
  description: string
  icon?: 'loading' | 'error' | 'empty'
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const stateIconMap = {
  loading: IconSparkles,
  error: IconAlertCircle,
  empty: IconFileText,
} as const

function StateSkeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-3xl bg-muted/70', className)} aria-hidden="true" />
}

export function LeaveStateCard({
  title,
  description,
  icon = 'empty',
  actionLabel,
  onAction,
  className,
}: LeaveStateCardProps) {
  const Icon = stateIconMap[icon]

  return (
    <section className={cn('ui-card flex flex-col items-center rounded-3xl px-5 py-8 text-center', className)}>
      <span
        className={cn(
          'mb-4 flex size-14 items-center justify-center rounded-full',
          icon === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="size-7" />
      </span>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button type="button" variant={icon === 'error' ? 'default' : 'secondary'} className="mt-5 rounded-full px-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </section>
  )
}

export function LeavePageSkeleton() {
  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <div className="sticky top-0 z-30 -mx-4 -mt-8 border-b border-border bg-background/95 px-4 pb-3 pt-10 backdrop-blur-sm md:-mx-6 md:-mt-10 md:px-6 md:pt-11">
        <div className="mx-auto w-full max-w-3xl">
          <StateSkeleton className="h-8 w-40" />
          <div className="mt-4">
            <StateSkeleton className="h-20" />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StateSkeleton key={index} className="h-20" />
          ))}
        </div>
        <StateSkeleton className="h-16 rounded-full" />
        <StateSkeleton className="h-44" />
        <StateSkeleton className="h-32" />
      </div>
    </section>
  )
}

export function LeaveDetailSkeleton() {
  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <div className="sticky top-0 z-30 -mx-4 -mt-8 border-b border-border bg-background/95 px-4 pb-3 pt-10 backdrop-blur-sm md:-mx-6 md:-mt-10 md:px-6 md:pt-11">
        <div className="mx-auto w-full max-w-3xl">
          <StateSkeleton className="h-8 w-56" />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <StateSkeleton className="h-24" />
        <StateSkeleton className="h-72" />
        <StateSkeleton className="h-80" />
        <StateSkeleton className="h-12 rounded-2xl" />
      </div>
    </section>
  )
}
