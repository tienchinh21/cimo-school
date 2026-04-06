import { startCase } from 'lodash'

export const siteConfig = {
  name: startCase('cimo school parent app'),
  description: 'Base React structure with TypeScript, Tailwind, React Query, lodash, and shadcn/ui',
} as const
