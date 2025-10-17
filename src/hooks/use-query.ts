'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@stackframe/stack';

interface UseQueryOptions {
  enabled?: boolean;
}

export function useQuery<T>(
  url: string,
  options: UseQueryOptions = { enabled: true }
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(options.enabled);
  const [error, setError] = useState<Error | null>(null);
  const auth = useAuth();

  const fetchData = useCallback(async () => {
    if (!options.enabled || !auth.authenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to fetch ${url}: ${res.statusText}`);
      }
      const jsonData = await res.json();
      setData(jsonData);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [url, options.enabled, auth.authenticated]);

  useEffect(() => {
    if (options.enabled && auth.authenticated) {
      fetchData();
    } else if (!auth.authenticated) {
        setIsLoading(false);
        setData(null);
    }
  }, [fetchData, options.enabled, auth.authenticated]);

  const refetch = () => {
    fetchData();
  };

  return { data, isLoading, error, refetch };
}
