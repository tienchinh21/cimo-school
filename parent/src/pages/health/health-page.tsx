import { Button } from '@/components/ui/button'
import { HealthDetails } from '@/pages/health/components/health-details'
import { useHealthPage } from '@/pages/health/hooks/use-health-page'

export function HealthPage() {
  const { data, isLoading, isError, errorMessage, refetch, isFetching, items } = useHealthPage()

  return (
    <section className="mx-auto w-full max-w-3xl rounded-2xl border bg-card p-6 shadow-sm md:p-8">
      <h2 className="text-2xl font-semibold tracking-tight">Health check</h2>
      {isLoading ? <p className="mt-2 text-muted-foreground">Loading status...</p> : null}

      {isError ? (
        <div className="mt-4 space-y-3">
          <p className="text-destructive">{errorMessage}</p>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            Retry
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && data ? <HealthDetails items={items} /> : null}
    </section>
  )
}
