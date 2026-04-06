import {
  IconCalendarCheck,
  IconHome2,
  IconNews,
  IconSchool,
  IconUsers,
} from '@tabler/icons-react'
import type { ComponentType, SVGProps } from 'react'
import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/shared/lib'

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>

interface BottomNavItem {
  activeIconClassName: string
  end?: boolean
  icon: NavIcon
  label: string
  to: string
}

const bottomNavItems: BottomNavItem[] = [
  {
    activeIconClassName: 'bg-blue-600 text-white',
    label: 'Tổng quan',
    to: '/',
    icon: IconHome2,
    end: true,
  },
  { activeIconClassName: 'bg-indigo-600 text-white', label: 'Lớp học', to: '/classes', icon: IconSchool },
  {
    activeIconClassName: 'bg-emerald-600 text-white',
    label: 'Điểm danh',
    to: '/attendance',
    icon: IconCalendarCheck,
  },
  { activeIconClassName: 'bg-violet-600 text-white', label: 'Tin tức', to: '/news', icon: IconNews },
  { activeIconClassName: 'bg-sky-600 text-white', label: 'Học sinh', to: '/students', icon: IconUsers },
]

export function BottomNavigation() {
  const [pressedItem, setPressedItem] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    },
    [],
  )

  const handleItemPress = (itemPath: string) => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }

    setPressedItem(itemPath)

    timerRef.current = window.setTimeout(() => {
      setPressedItem((current) => (current === itemPath ? null : current))
    }, 360)
  }

  return (
    <nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-2 z-40 w-full px-2.5 sm:px-3">
      <div className="mx-auto max-w-md rounded-[1.8rem] border border-border/70 bg-card/90 px-1 py-1 shadow-2xl backdrop-blur-xl">
        <ul className="flex items-end justify-between gap-0.5 pb-[calc(env(safe-area-inset-bottom)+0.15rem)] pt-0.5">
          {bottomNavItems.map((item) => {
            const Icon = item.icon

            return (
              <li key={item.to} className="min-w-0 flex-1">
                <NavLink
                  to={item.to}
                  end={item.end}
                  onPointerDown={() => handleItemPress(item.to)}
                  className={({ isActive }) =>
                    cn(
                      'flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-1.5 text-[10px] font-semibold transition-all duration-200 active:scale-[0.96]',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/*
                        Click animation is scoped per item so quick taps feel responsive
                        even when route transition is still in progress.
                      */}
                      <span
                        className={cn(
                          'relative flex size-[2.125rem] items-center justify-center rounded-full transition-all duration-300 sm:size-9',
                          isActive ? `${item.activeIconClassName} -translate-y-0.5 shadow-md` : 'bg-muted',
                          pressedItem === item.to ? 'bottom-nav-pop' : '',
                        )}
                      >
                        {pressedItem === item.to ? <span className="bottom-nav-ripple opacity-100" /> : null}
                        <Icon
                          className={cn(
                            'relative size-4.5 transition-transform duration-200 sm:size-5',
                            isActive || pressedItem === item.to ? 'scale-110' : '',
                          )}
                        />
                      </span>
                      <span
                        className={cn(
                          'block w-full truncate px-0.5 text-center leading-none transition-colors',
                          isActive ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {item.label}
                      </span>
                    </>
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
