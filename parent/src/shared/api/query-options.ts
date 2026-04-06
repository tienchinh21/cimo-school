import type { UseQueryOptions } from '@tanstack/react-query'

export type QueryConfig<TData, TError = Error> = Omit<
  UseQueryOptions<TData, TError, TData>,
  'queryKey' | 'queryFn'
>
