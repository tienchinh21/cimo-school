import {
  IconHome2,
  IconNews,
  IconSchool,
} from '@tabler/icons-react'
import type { ComponentType, SVGProps } from 'react'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { NavLink, matchPath, useLocation } from 'react-router-dom'

import { useAuthUser } from '@/app/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { normalizeHomeImageUrl } from '@/pages/home/home-page.utils'
import { cn } from '@/shared/lib'

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>

interface BottomNavItem {
  label: string
  to: string
  icon?: NavIcon
  badgeCount?: number
  end?: boolean
}

const bottomNavItems: BottomNavItem[] = [
  { label: 'Trang chủ', to: '/', icon: IconHome2, end: true },
  { label: 'Học tập', to: '/score', icon: IconSchool },
  { label: 'Tin tức', to: '/news', icon: IconNews },
  { label: 'Hồ sơ', to: '/profile' },
]

const hiddenBottomNavPatterns = [
  '/leave/:requestId',
  '/news/:blogId',
  '/score/subject/:subjectId',
] as const

function shouldHideBottomNavigation(pathname: string) {
  return hiddenBottomNavPatterns.some((pattern) => {
    return matchPath(pattern, pathname) != null
  })
}

export function BottomNavigation() {
  const location = useLocation()
  const user = useAuthUser()
  const listRef = useRef<HTMLUListElement | null>(null)
  const itemRefs = useRef(new Map<string, HTMLLIElement | null>())
  const indicatorRef = useRef<HTMLDivElement | null>(null)
  const profileAvatarUrl = normalizeHomeImageUrl(user?.avt)
  const profileFallback = (user?.name?.trim()?.[0] ?? 'HS').toUpperCase()

  const activeItem = useMemo(() => {
    return bottomNavItems.find((item) => {
      return matchPath({ path: item.to, end: item.end ?? false }, location.pathname) != null
    })
  }, [location.pathname])
  const isHidden = shouldHideBottomNavigation(location.pathname)

  useLayoutEffect(() => {
    if (isHidden) {
      return
    }

    const listEl = listRef.current
    const indicatorEl = indicatorRef.current
    if (!listEl || !indicatorEl) {
      return
    }

    const update = () => {
      if (!activeItem) {
        indicatorEl.style.opacity = '0'
        return
      }

      const itemEl = itemRefs.current.get(activeItem.to)
      if (!itemEl) {
        indicatorEl.style.opacity = '0'
        return
      }

      const listRect = listEl.getBoundingClientRect()
      const itemRect = itemEl.getBoundingClientRect()

      indicatorEl.style.width = `${itemRect.width}px`
      indicatorEl.style.transform = `translateX(${itemRect.left - listRect.left}px)`
      indicatorEl.style.opacity = '1'
    }

    const raf = window.requestAnimationFrame(update)
    window.addEventListener('resize', update)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
    }
  }, [activeItem, isHidden, location.pathname])

  if (isHidden) {
    return null
  }

  return (
    <nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-2 z-40 w-full px-2.5 sm:px-3">
      <div className="mx-auto max-w-md rounded-[1.8rem] border border-border/70 bg-card/85 px-1 py-1 shadow-2xl backdrop-blur-xl">
        <ul
          ref={listRef}
          className="relative flex items-end justify-between gap-0.5 pb-[calc(env(safe-area-inset-bottom)+0.1rem)] pt-0.5"
        >
          <div
            ref={indicatorRef}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0.5 bottom-[calc(env(safe-area-inset-bottom)+0.35rem)] rounded-[1.6rem] bg-muted/60 shadow-sm ring-1 ring-inset ring-border/80 transition-[transform,width,opacity] duration-300 ease-out"
            style={{ width: 0, opacity: 0 }}
          />
          {bottomNavItems.map((item) => {
            const Icon = item.icon

            return (
              <li
                key={item.to}
                ref={(el) => {
                  itemRefs.current.set(item.to, el)
                }}
                className="min-w-0 flex-1"
              >
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl py-0.5 text-[10px] font-medium transition-colors duration-300',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <div
                      className={cn(
                        'relative z-10 flex w-full flex-col items-center justify-center gap-0.5 rounded-[1.4rem] px-0.5 py-0.5 transition-colors duration-300',
                        isActive ? 'bg-transparent' : 'bg-transparent hover:bg-muted/30',
                      )}
                    >
                      {item.to === '/profile' ? (
                        <Avatar className={cn('size-10 border-2', isActive ? 'border-primary' : 'border-border')}>
                          <AvatarImage src={profileAvatarUrl} alt={user?.name ?? item.label} />
                          <AvatarFallback>{profileFallback}</AvatarFallback>
                        </Avatar>
                      ) : Icon ? (
                        <span
                          className={cn(
                            'relative flex size-10 items-center justify-center rounded-full',
                            isActive ? 'bg-transparent' : 'bg-muted',
                          )}
                        >
                          <Icon
                            className={cn(
                              'size-6 transition-transform duration-300 sm:size-7',
                              isActive ? 'scale-105' : 'scale-100',
                            )}
                          />
                          {typeof item.badgeCount === 'number' && item.badgeCount > 0 ? (
                            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                              {item.badgeCount}
                            </span>
                          ) : null}
                        </span>
                      ) : null}
                      <span className="block w-full truncate px-0.5 text-center text-[10px] font-medium leading-none">
                        {item.label}
                      </span>
                    </div>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
