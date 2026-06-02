import { useQueryClient } from '@tanstack/react-query';

import { useFocusQuery } from '@/hooks/use-focus-query';
import { queryKeys } from '@/lib/query-keys';
import { getMyActiveTokens, getTomorrowMenus } from '@/lib/services/dining.service';

export function useTomorrowMenusQuery() {
  return useFocusQuery(queryKeys.dining.tomorrowMenus(), ({ signal }) =>
    getTomorrowMenus({ signal }),
  );
}

export function useActiveMealTokensQuery() {
  return useFocusQuery(queryKeys.dining.activeTokens(), ({ signal }) =>
    getMyActiveTokens({ signal }),
  );
}

export function useInvalidateDiningQueries() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: queryKeys.dining.all });
}
