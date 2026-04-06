import type { NewsCategoryFilterItem, NewsCategoryFilterValue } from '@/pages/news/types/news-page.types'
import { cn } from '@/shared/lib'

interface NewsFilterTabsProps {
  items: NewsCategoryFilterItem[]
  value: NewsCategoryFilterValue
  onChange: (value: NewsCategoryFilterValue) => void
}

export function NewsFilterTabs({ items, value, onChange }: NewsFilterTabsProps) {
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const isActive = item.value === value

        return (
          <button
            key={item.value ?? 'null'}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              isActive
                ? 'border-transparent bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'border-border bg-card text-muted-foreground',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
