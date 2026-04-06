import { IconMoonStars, IconSun } from '@tabler/icons-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      variant="secondary"
      size="icon"
      type="button"
      aria-label="Đổi giao diện sáng tối"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="size-[44px] rounded-full"
    >
      {isDark ? <IconSun /> : <IconMoonStars />}
    </Button>
  )
}
