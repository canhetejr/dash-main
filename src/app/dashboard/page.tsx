import { Suspense } from 'react';
import { executeSurveyPipeline } from '@/lib/supabase-pipeline';
import { MvpKpis } from '@/components/dashboard/mvp/mvp-kpis';
import { MvpCharts } from '@/components/dashboard/mvp/mvp-charts';
import { MvpTable } from '@/components/dashboard/mvp/mvp-table';
import { MvpFilters } from '@/components/dashboard/mvp/mvp-filters';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage({ searchParams }: { searchParams: { centro?: string; disciplina?: string } }) {
  const data = await executeSurveyPipeline({
    centro: searchParams.centro,
    disciplina: searchParams.disciplina,
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard MVP</h1>
        <p className="text-muted-foreground">
          Visão geral da Pesquisa da Disciplina (Dados carregados diretamente do pipeline Supabase).
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
      
      <MvpTable disciplinas={data.byDisciplina} />
    </div>
  );
}
