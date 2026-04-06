import { IconChevronLeft, IconLogout2 } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthActions } from '@/app/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib'

interface PageTitleHeaderProps {
  className?: string
  showBackButton?: boolean
  subtitle?: string
  title: string
  trailing?: ReactNode
}

export function PageTitleHeader({
  className,
  showBackButton = false,
  subtitle,
  title,
  trailing,
}: PageTitleHeaderProps) {
  const navigate = useNavigate()
  const { logout } = useAuthActions()

  return (
    <header className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {showBackButton ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="mt-0.5 size-9 rounded-full"
            onClick={() => navigate(-1)}
          >
            <IconChevronLeft className="size-5" />
          </Button>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {trailing ?? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-9 rounded-full"
          onClick={logout}
        >
          <IconLogout2 className="size-4.5" />
        </Button>
      )}
    </header>
  )
}
