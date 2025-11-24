/**
 * React Hook для защищенных HTTP запросов
 */

import { useState, useCallback } from 'react';
import { protectedFetch } from '@/utils/ddos-protection';
import { useToast } from '@/hooks/use-toast';

interface UseProtectedFetchOptions {
  showErrors?: boolean;
  retries?: number;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useProtectedFetch<T = any>(
  options: UseProtectedFetchOptions = {}
) {
  const { showErrors = true, retries = 3 } = options;
  const { toast } = useToast();
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(
    async (url: string, fetchOptions?: RequestInit): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await protectedFetch(url, fetchOptions, retries);
        const data = await response.json();

        setState({ data, loading: false, error: null });
        return data;

      } catch (error) {
        const err = error as Error;
        setState({ data: null, loading: false, error: err });

        if (showErrors) {
          toast({
            title: 'Ошибка запроса',
            description: err.message,
            variant: 'destructive',
            duration: 5000
          });
        }

        return null;
      }
    },
    [retries, showErrors, toast]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

export default useProtectedFetch;
