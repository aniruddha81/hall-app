import { useQueryClient } from '@tanstack/react-query';

import { useFocusQuery } from '@/hooks/use-focus-query';
import { queryKeys } from '@/lib/query-keys';
import { getMyApplicationStatus, getMyDues } from '@/lib/services/student.service';

export function useMyDuesQuery() {
  return useFocusQuery(queryKeys.student.dues(), ({ signal }) => getMyDues({ signal }));
}

export function useMyApplicationQuery() {
  return useFocusQuery(queryKeys.student.application(), ({ signal }) =>
    getMyApplicationStatus({ signal }),
  );
}

export function useInvalidateStudentQueries() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: queryKeys.student.all });
}
