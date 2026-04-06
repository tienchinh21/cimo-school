import { useQuery } from '@tanstack/react-query'
import { mapValues, orderBy } from 'lodash'

import { getScoreDashboard } from '@/pages/score/service/get-score-dashboard'
import type { ScoreDashboard } from '@/pages/score/types/score-page.types'
import { queryKeys } from '@/shared/api/query-keys'

function mapScoreData(data: ScoreDashboard): ScoreDashboard {
  return {
    ...data,
    terms: mapValues(data.terms, (termData) => ({
      ...termData,
      subjects: orderBy(termData.subjects, ['score'], ['desc']),
    })),
  }
}

export function useScorePage() {
  return useQuery({
    queryKey: queryKeys.score.dashboard(),
    queryFn: getScoreDashboard,
    staleTime: 1000 * 30,
    select: mapScoreData,
  })
}
