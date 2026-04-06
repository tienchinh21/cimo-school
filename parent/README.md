# Cimo School Parent - React Base

Base frontend scaffold with:
- React 19 + TypeScript + Vite
- Tailwind CSS v4
- TanStack React Query
- lodash
- shadcn/ui foundation

## Run

```bash
yarn install
yarn dev
```

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

- `VITE_API_BASE_URL`: API prefix or full API host. Default is `/api`.

## Folder structure

```text
src/
  app/
    providers/      # global providers (router, query client)
    router/         # route config
  pages/            # page modules (angular-like split)
    <page-name>/
      components/
      hooks/
      types/
      <page-name>-page.tsx
      index.ts
  features/         # domain modules
    health/
      api/          # endpoint functions + feature DTOs
      hooks/        # react-query hooks per feature
  shared/
    api/            # http client, api types, query keys/options
    config/         # app/site config
    lib/            # shared utils (cn, helpers)
  components/
    ui/             # reusable UI components (shadcn style)
  styles/
    globals.css
```

## API layer pattern

### 1) Shared HTTP client
- `src/shared/api/http-client.ts`
- Handles base URL, query params, JSON parsing, and throws `ApiError`.

### 2) Feature API
- Example: `src/features/health/api/get-health.ts`
- Only endpoint call logic + response types.

### 3) React Query hook
- Example: `src/features/health/hooks/use-health-query.ts`
- Owns `queryKey`, `queryFn`, and query config overrides.

### 4) Page hook (composition layer)
- Example: `src/pages/health/hooks/use-health-page.ts`
- Maps feature data into UI-friendly view model for page components.

Use this pattern for each feature:
- `src/features/<feature>/api/*.ts`
- `src/features/<feature>/hooks/*.ts`

## Current sample endpoint

`HealthPage` uses `useHealthQuery()` and calls:
- `GET {VITE_API_BASE_URL}/health`

Response shape:

```ts
{
  status: 'ok' | 'degraded' | 'down'
  service: string
  timestamp: string
}
```
