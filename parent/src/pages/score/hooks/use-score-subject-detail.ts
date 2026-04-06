import { useQuery } from '@tanstack/react-query'

import { getScoreSubjectDetail } from '@/pages/score/service/get-score-subject-detail'
import { queryKeys } from '@/shared/api/query-keys'

export function useScoreSubjectDetail(subjectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.score.detail(subjectId ?? 'unknown'),
    queryFn: () => getScoreSubjectDetail(subjectId ?? ''),
    enabled: Boolean(subjectId),
    staleTime: 1000 * 30,
  })
}
