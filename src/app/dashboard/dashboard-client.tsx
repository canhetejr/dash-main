'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { searchParamsToFilters, filtersToSearchParams } from '@/lib/filters';
import type { FilterState } from '@/types/dashboard';
import { FiltersBar } from '@/components/dashboard/filters-bar';
import { ActionBar } from '@/components/dashboard/action-bar';
import { KPIGrid } from '@/components/dashboard/kpi-grid';
import { ChartsSection } from '@/components/dashboard/charts-section';
import { DisciplinaTable } from '@/components/dashboard/disciplina-table';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV, exportToXLSX } from '@/lib/export';
import { exportDashboardPDF } from '@/lib/pdf';
import { formatDateISO } from '@/lib/slugify';
import { PageHero } from '@/components/dashboard/page-hero';

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = useMemo<FilterState>(
    () => searchParamsToFilters(searchParams),
    [searchParams]
  );

  const { data, filterOptions, isLoading, error, refetch } = useDashboardData(filters);

  const handleFiltersChange = useCallback(
    (f: FilterState) => {
      const q = filtersToSearchParams(f).toString();
      router.replace(q ? `/dashboard?${q}` : '/dashboard');
    },
    [router]
  );

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-medium text-red-800">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          aria-label="Tentar novamente"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Visão Geral"
        subtitle="KPIs, gráficos e ranking por disciplina com exportações para relatórios."
        right={
          <ActionBar
            contextLabel="Dashboard filtrado"
            onExportPDF={async () => {
              if (!data) return;
              const now = new Date();
              const filename = `dashboard-pesquisa-filtrado-${formatDateISO(now)}`;
              const lines: string[] = [];
              if (filters.centro.length) lines.push(`Centros: ${filters.centro.join(', ')}`);
              if (filters.disciplina.length) lines.push(`Disciplinas: ${filters.disciplina.join(', ')}`);
              if (filters.id.length) lines.push(`ID(s): ${filters.id.join(', ')}`);
              if (filters.sentimentLabel.length) lines.push(`Classificação: ${filters.sentimentLabel.join(', ')}`);
              if (filters.dateFrom || filters.dateTo)
                lines.push(`Datas: ${filters.dateFrom ?? '—'} até ${filters.dateTo ?? '—'}`);
              if (filters.scoreMin !== null || filters.scoreMax !== null)
                lines.push(`Média Likert: ${filters.scoreMin ?? '—'} até ${filters.scoreMax ?? '—'}`);
              if (filters.search) lines.push(`Busca: "${filters.search}"`);

              exportDashboardPDF({
                data,
                filename: `${filename}.pdf`,
                filters: { label: 'Filtros aplicados', lines },
              });
            }}
            onExportCSV={async () => {
              if (!data) return;
              const now = new Date();
              const filename = `dashboard-pesquisa-filtrado-${formatDateISO(now)}`;
              exportToCSV(data.rows, filename);
            }}
            onExportXLSX={async () => {
              if (!data) return;
              const now = new Date();
              const filename = `dashboard-pesquisa-filtrado-${formatDateISO(now)}`;
              exportToXLSX(data.rows, data.summary, filename);
            }}
          />
        }
      />

      <FiltersBar
        filters={filters}
        filterOptions={filterOptions}
        onFiltersChange={handleFiltersChange}
        isLoading={isLoading}
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <KPIGrid summary={data?.summary ?? null} isLoading={false} />
          <ChartsSection data={data} isLoading={false} />
          <DisciplinaTable disciplinas={data?.byDisciplina ?? []} />
        </>
      )}
    </div>
  );
}

