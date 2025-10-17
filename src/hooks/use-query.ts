'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

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
  const { data: session } = useSession();

  const fetchData = useCallback(async () => {
    if (!options.enabled || !session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
      }
      const jsonData = await res.json();
      setData(jsonData);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [url, options.enabled, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = () => {
    fetchData();
  };

  return { data, isLoading, error, refetch };
}