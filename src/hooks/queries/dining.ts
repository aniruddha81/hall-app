import { useQueryClient } from '@tanstack/react-query';

import { useFocusQuery } from '@/hooks/use-focus-query';
import { refetchQueries } from '@/hooks/use-pull-to-refresh';
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

/** Refetch menus + tokens; retry tokens while SSLCommerz callback may still be finishing. */
export async function refetchDiningAfterPayment(
  refetchMenus: () => Promise<unknown>,
  refetchTokens: () => Promise<unknown>,
) {
  await refetchQueries(refetchMenus, refetchTokens);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await refetchTokens();
    const count = (result as { data?: { tokens?: unknown[] } })?.data?.tokens?.length ?? 0;
    if (count > 0) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
}
