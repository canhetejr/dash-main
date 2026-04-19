import { Suspense } from 'react';
import { getCachedPipeline, getPaginatedTableRows } from '@/lib/supabase-pipeline';
import { MvpKpis } from '@/components/dashboard/mvp/mvp-kpis';
import { MvpCharts } from '@/components/dashboard/mvp/mvp-charts';
import { MvpTable } from '@/components/dashboard/mvp/mvp-table';
import { MvpFilters } from '@/components/dashboard/mvp/mvp-filters';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage({ 
  searchParams 
}: { 
  searchParams: { centro?: string; disciplina?: string; page?: string; pageSize?: string } 
}) {
  const page = parseInt(searchParams.page || '1', 10);
  const pageSize = parseInt(searchParams.pageSize || '50', 10);
  
  const filters = {
    centro: searchParams.centro,
    disciplina: searchParams.disciplina,
  };

  // Resolve as duas trilhas em paralelo:
  // Trilha 1: Dashboard Base (Agregações Globais cacheadas, muito rápido)
  const dataPromise = getCachedPipeline(filters.centro, filters.disciplina);
  
  // Trilha 2: Tabela Paginada (Apenas 50 registros, DB nativo limit/offset)
  const tablePromise = getPaginatedTableRows(filters, page, pageSize);

  const [data, tableData] = await Promise.all([dataPromise, tablePromise]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-surface-900">Visão Analítica</h1>
        <p className="text-surface-500">
          Acompanhe os resultados e métricas de satisfação da Pesquisa da Disciplina.
        </p>
      </div>

      <MvpFilters 
        centros={data.filterOptions.centros} 
        disciplinas={data.filterOptions.disciplinas} 
        currentCentro={searchParams.centro || ''}
        currentDisciplina={searchParams.disciplina || ''}
      />

      <MvpKpis aggregation={data.aggregation} />
      
      <MvpCharts 
        likertDistribution={data.likertDistribution} 
        byQuestion={data.byQuestion} 
      />
      
      <MvpTable 
        rows={tableData.rows} 
        totalCount={tableData.totalCount}
        currentPage={page}
        totalPages={tableData.totalPages}
      />
    </div>
  );
}
