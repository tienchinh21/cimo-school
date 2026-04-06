import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib'

interface BottomModalProps {
  children: ReactNode
  onClose: () => void
  open: boolean
  panelClassName?: string
}

export function BottomModal({ children, onClose, open, panelClassName }: BottomModalProps) {
  useEffect(() => {
    if (!open || typeof window === 'undefined') {
      return
    }

    const scrollY = window.scrollY
    const { body, documentElement } = document
    const previousBodyOverflow = body.style.overflow
    const previousBodyPosition = body.style.position
    const previousBodyTop = body.style.top
    const previousBodyLeft = body.style.left
    const previousBodyRight = body.style.right
    const previousBodyWidth = body.style.width
    const previousHtmlOverflow = documentElement.style.overflow

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    documentElement.style.overflow = 'hidden'

    return () => {
      body.style.overflow = previousBodyOverflow
      body.style.position = previousBodyPosition
      body.style.top = previousBodyTop
      body.style.left = previousBodyLeft
      body.style.right = previousBodyRight
      body.style.width = previousBodyWidth
      documentElement.style.overflow = previousHtmlOverflow
      window.scrollTo(0, scrollY)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="mx-auto flex h-full w-full max-w-md items-end">
        <section
          className={cn(
            'w-full max-h-[88vh] overflow-y-auto rounded-t-3xl bg-background pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl',
            panelClassName,
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </section>
      </div>
    </div>
  )
}
