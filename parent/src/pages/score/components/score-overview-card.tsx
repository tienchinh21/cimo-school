import type { ScoreOverview } from '@/pages/score/types/score-page.types'

interface ScoreOverviewCardProps {
  overview: ScoreOverview
}

export function ScoreOverviewCard({ overview }: ScoreOverviewCardProps) {
  return (
    <section className="ui-card relative overflow-hidden p-6">
      <span className="absolute -right-12 -top-14 size-32 rounded-full bg-primary/5" />
      <div className="relative">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Kết quả học tập</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-5xl font-extrabold tracking-tighter text-primary">{overview.averageScore.toFixed(1)}</span>
              <span className="pb-1 text-lg font-bold text-foreground">/ 10</span>
            </div>
          </div>
          <span className="rounded-full bg-primary/15 px-4 py-1.5 text-xs font-bold uppercase text-primary">
            Xếp loại: {overview.rankLabel}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-muted-foreground">{overview.trendLabel}</span>
          </div>
          <div className="flex h-8 items-end gap-1">
            <span className="w-1.5 rounded-t-full bg-primary/20" style={{ height: '50%' }} />
            <span className="w-1.5 rounded-t-full bg-primary/30" style={{ height: '72%' }} />
            <span className="w-1.5 rounded-t-full bg-primary/45" style={{ height: '65%' }} />
            <span className="w-1.5 rounded-t-full bg-primary/70" style={{ height: '86%' }} />
            <span className="w-1.5 rounded-t-full bg-primary" style={{ height: '100%' }} />
          </div>
        </div>
      </div>
    </section>
  )
}
