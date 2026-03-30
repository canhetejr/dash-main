'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FilterState } from '@/types/dashboard';
import type { DashboardData } from '@/types/survey';
import type { FilterOptions } from '@/types/dashboard';
import { filtersToSearchParams } from '@/lib/filters';

interface ApiResponse {
  success: boolean;
  data: DashboardData;
  filterOptions: FilterOptions;
  totalUnfiltered: number;
  error?: string;
  details?: string;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  filterOptions: FilterOptions | null;
  totalUnfiltered: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(filters: FilterState): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [totalUnfiltered, setTotalUnfiltered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    try {
      const params = filtersToSearchParams(filters);
      const queryString = params.toString();
      const url = queryString ? `/api/survey?${queryString}` : '/api/survey';
      const res = await fetch(url, { signal: controller.signal });

      if (controller.signal.aborted) return;

      let json: ApiResponse;
      try {
        json = await res.json();
      } catch {
        throw new Error('Resposta inválida do servidor');
      }

      if (!res.ok) {
        throw new Error(json.error ?? json.details ?? 'Falha ao carregar dados');
      }

      if (!json.success || !json.data) {
        throw new Error(json.error ?? 'Resposta inválida da API');
      }

      if (!controller.signal.aborted) {
        setData(json.data);
        setFilterOptions(json.filterOptions ?? null);
        setTotalUnfiltered(json.totalUnfiltered ?? 0);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setData(null);
      setFilterOptions(null);
      setTotalUnfiltered(0);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return {
    data,
    filterOptions,
    totalUnfiltered,
    isLoading,
    error,
    refetch: fetchData,
  };
}
