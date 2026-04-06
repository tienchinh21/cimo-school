import type { ScoreTermKey } from '@/pages/score/types/score-page.types'
import { scoreTermKeys } from '@/pages/score/types/score-page.types'
import { cn } from '@/shared/lib'

interface ScoreTermTabsProps {
  value: ScoreTermKey
  onChange: (key: ScoreTermKey) => void
}

const termLabels: Record<ScoreTermKey, string> = {
  [scoreTermKeys.TERM_1]: 'Học kỳ 1',
  [scoreTermKeys.TERM_2]: 'Học kỳ 2',
  [scoreTermKeys.FULL_YEAR]: 'Cả năm',
}

export function ScoreTermTabs({ value, onChange }: ScoreTermTabsProps) {
  return (
    <section className="flex rounded-full bg-muted p-1">
      {(Object.values(scoreTermKeys) as ScoreTermKey[]).map((termKey) => {
        const isActive = termKey === value

        return (
          <button
            key={termKey}
            type="button"
            onClick={() => onChange(termKey)}
            className={cn(
              'flex-1 rounded-full py-2.5 text-xs font-bold transition-colors',
              isActive ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-primary',
            )}
          >
            {termLabels[termKey]}
          </button>
        )
      })}
    </section>
  )
}
