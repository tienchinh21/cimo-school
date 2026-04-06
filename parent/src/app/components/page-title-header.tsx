import { IconArrowLeft } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { matchPath, useLocation, useNavigate, type To } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib'

interface PageTitleHeaderProps {
  title: string
  leftAction?: ReactNode
  rightAction?: ReactNode
  className?: string
  titleClassName?: string
  backTo?: To
}

const DEFAULT_BACK_TARGET = '/'
const PAGE_TITLE_HEADER_SPACER_CLASS = 'h-20 md:h-22'

function resolveDefaultBackTarget(pathname: string) {
  if (
    matchPath('/leave/create', pathname) ||
    matchPath('/leave/:requestId', pathname) ||
    matchPath('/leave/:requestId/edit', pathname)
  ) {
    return '/leave'
  }

  if (matchPath('/score/subject/:subjectId', pathname)) {
    return '/score'
  }

  if (
    matchPath('/attendance', pathname) ||
    matchPath('/leave', pathname) ||
    matchPath('/news', pathname) ||
    matchPath('/schedule', pathname)
  ) {
    return DEFAULT_BACK_TARGET
  }

  return DEFAULT_BACK_TARGET
}

function DefaultBackButton({ backTo }: Pick<PageTitleHeaderProps, 'backTo'>) {
  const location = useLocation()
  const navigate = useNavigate()
  const target = backTo ?? resolveDefaultBackTarget(location.pathname)

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label="Quay lại"
      className="size-9 rounded-full"
      onClick={() => navigate(target, { replace: true })}
    >
      <IconArrowLeft />
    </Button>
  )
}

export function PageTitleHeader({
  title,
  leftAction,
  rightAction,
  className,
  titleClassName,
  backTo,
}: PageTitleHeaderProps) {
  return (
    <>
      <div aria-hidden="true" className={PAGE_TITLE_HEADER_SPACER_CLASS} />
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div
          className={cn(
            'mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-5 md:px-6 md:py-6',
            className,
          )}
        >
          {leftAction ?? <DefaultBackButton backTo={backTo} />}
          <h1 className={cn('text-lg font-bold leading-none tracking-tight text-foreground md:text-xl', titleClassName)}>
            {title}
          </h1>
          {rightAction ?? <div aria-hidden="true" className="size-9 shrink-0" />}
        </div>
      </header>
    </>
  )
}
