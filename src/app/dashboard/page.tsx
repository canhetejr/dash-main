import { getCachedPipeline, getPaginatedTableRows } from '@/lib/supabase-pipeline';
import { MvpKpis } from '@/components/dashboard/mvp/mvp-kpis';
import { MvpCharts } from '@/components/dashboard/mvp/mvp-charts';
import { MvpTable } from '@/components/dashboard/mvp/mvp-table';
import { MvpFilters } from '@/components/dashboard/mvp/mvp-filters';
import { createClient } from '@/lib/supabase/server';
import { TrendingUp, LinkIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage({
  searchParams
}: {
  searchParams: {
    centro?: string;
    disciplina?: string;
    page?: string;
    pageSize?: string;
    /** filtro por external_id do moodle — ativado por link no perfil */
    externalId?: string;
  }
}) {
  const page     = parseInt(searchParams.page     || '1',  10);
  const pageSize = parseInt(searchParams.pageSize || '50', 10);

  // BLOCO 1: moodle_id como filtro — busca o moodle_id do usuário logado quando
  // externalId=mine for passado, ou usa externalId diretamente da query string.
  let resolvedExternalId: string | undefined = searchParams.externalId;

  if (searchParams.externalId === 'mine') {
    // Busca o moodle_id do perfil do usuário logado
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('moodle_id')
        .eq('id', user.id)
        .single();
      resolvedExternalId = profile?.moodle_id ?? undefined;
    }
  }

  const filters = {
    centro:     searchParams.centro,
    disciplina: searchParams.disciplina,
    externalId: resolvedExternalId,
  };

  // Trilha 1 (cache): Agregações globais — KPIs + gráficos
  // Trilha 2: Tabela paginada, isolada para não bloquear KPIs
  // Nota: quando externalId está ativo, pipeline roda sem cache (dados personalizados)
  const [data, tableData] = await Promise.all([
    resolvedExternalId
      ? // Não cachear dados filtrados por usuário específico
        (async () => {
          const { executeSurveyPipeline } = await import('@/lib/supabase-pipeline');
          return executeSurveyPipeline(filters);
        })()
      : getCachedPipeline(filters.centro, filters.disciplina),
    getPaginatedTableRows(filters, page, pageSize),
  ]);

  console.log('[DEBUG DashboardPage] Aggregation responses:', data.aggregation?.totalResponses);
  console.log('[DEBUG DashboardPage] byQuestion length:', data.byQuestion?.length);


  const hasFilters = !!(searchParams.centro || searchParams.disciplina);
  const hasMoodleFilter = !!resolvedExternalId;

  return (
    <div className="space-y-3 pb-6">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b border-surface-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-unicive-green-pale">
              <TrendingUp className="h-3 w-3 text-unicive-green" aria-hidden />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-unicive-green">
              Visão Institucional
            </span>
          </div>
          <h1
            className="text-xl sm:text-2xl font-extrabold tracking-tight text-surface-900 leading-none"
            style={{ fontFamily: 'var(--font-kumbh, "Kumbh Sans", sans-serif)' }}
          >
            Qualidade Acadêmica
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13px] text-surface-500 leading-relaxed">
            Indicadores de satisfação e experiência discente — Pesquisa da Disciplina.
          </p>
        </div>

        {/* Badges de contexto ativo */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {hasFilters && (
            <div className="rounded-lg bg-white border border-surface-200 shadow-sm px-3.5 py-2 text-xs">
              <p className="font-semibold text-surface-700 mb-0.5">Filtros ativos</p>
              <p className="text-surface-500 text-[12px]">
                {[
                  searchParams.centro     && `Centro: ${searchParams.centro}`,
                  searchParams.disciplina && `Disciplina: ${searchParams.disciplina}`,
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}
          {hasMoodleFilter && (
            <div className="rounded-lg bg-unicive-green-pale border border-unicive-green/20 px-3.5 py-2 text-xs flex items-center gap-2">
              <LinkIcon className="h-3 w-3 text-unicive-green shrink-0" aria-hidden />
              <div>
                <p className="font-semibold text-unicive-green">Minha turma</p>
                <p className="text-unicive-green/70">ID Moodle: {resolvedExternalId}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 1. KPIs ──────────────────────────────────────────────── */}
      <MvpKpis aggregation={data.aggregation} />

      {/* ── 2. Filtros ───────────────────────────────────────────── */}
      <MvpFilters
        centros={data.filterOptions.centros}
        disciplinas={data.filterOptions.disciplinas}
        currentCentro={searchParams.centro || ''}
        currentDisciplina={searchParams.disciplina || ''}
      />

      {/* ── 3. Gráficos ──────────────────────────────────────────── */}
      <MvpCharts
        likertDistribution={data.likertDistribution}
        byQuestion={data.byQuestion}
        byCentro={data.byCentro}
        byDisciplina={data.byDisciplina}
        timeSeries={data.timeSeries}
      />

      {/* ── 4. Tabela ────────────────────────────────────────────── */}
      <MvpTable
        rows={tableData.rows}
        totalCount={tableData.totalCount}
        currentPage={page}
        totalPages={tableData.totalPages}
      />
    </div>
  );
}
