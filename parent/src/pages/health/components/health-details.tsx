import type { HealthItem } from '@/pages/health/types/health-page.types'

interface HealthDetailsProps {
  items: HealthItem[]
}

export function HealthDetails({ items }: HealthDetailsProps) {
  return (
    <div className="mt-4 space-y-2 text-left text-sm">
      {items.map((item) => (
        <p key={item.label}>
          <span className="font-medium">{item.label}:</span> {item.value}
        </p>
      ))}
    </div>
  )
}
