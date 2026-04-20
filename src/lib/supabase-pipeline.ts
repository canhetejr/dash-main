/**
 * supabase-pipeline.ts — NÃO MODIFICAR LÓGICA DE SCORING
 *
 * Pipeline completo: lê dados do Supabase → transforma → agrega.
 *
 * CACHE FIX: getCachedPipeline usava unstable_cache dentro de uma função
 * chamada dinamicamente, o que significa que o wrapper era recriado a cada
 * invocação → cache miss garantido. Agora as chaves estáticas são pré-criadas
 * fora do fluxo da chamada usando um Map de funções memoizadas.
 */

import { supabase } from './supabase';
import {
  type SupabaseSurveyRow,
  type TransformedSurveyRow,
  type SurveyAggregation,
  type QuestionAggregation,
  transformAllSupabaseRows,
  computeGeneralAggregation,
  aggregateByQuestion,
  aggregateByCentro,
  aggregateByDisciplina,
  computeLikertDistribution,
  computeTimeSeries,
  type TimeSeriesPoint,
} from './supabase-transform';
import { unstable_cache } from 'next/cache';

// ---------------------------------------------------------------------------
// Tipos do pipeline
// ---------------------------------------------------------------------------

/** Resultado completo do pipeline — tudo que o dashboard precisa. */
export interface SurveyPipelineResult {
  aggregation: SurveyAggregation;
  byQuestion: QuestionAggregation[];
  byCentro: ReturnType<typeof aggregateByCentro>;
  byDisciplina: ReturnType<typeof aggregateByDisciplina>;
  likertDistribution: ReturnType<typeof computeLikertDistribution>;
  timeSeries: TimeSeriesPoint[];
  filterOptions: {
    centros: string[];
    disciplinas: string[];
  };
}

export interface SurveyPipelineFilters {
  centro?: string;
  disciplina?: string;
  /** Filtro por external_id (moodle_id do survey), ativado quando usuário tem moodle_id */
  externalId?: string;
}

// ---------------------------------------------------------------------------
// Fetch de dados do Supabase
// ---------------------------------------------------------------------------

/**
 * Busca todos os registros da tabela `surveys`, aplicando filtros no banco se fornecidos.
 * Usa paginação interna do Supabase para lidar com volumes grandes.
 *
 * @returns Array de registros brutos
 * @throws Error se a query falhar
 */
export async function fetchAllSurveys(filters?: SurveyPipelineFilters): Promise<SupabaseSurveyRow[]> {
  const startFetch = Date.now();
  const PAGE_SIZE = 1000;
  const allRows: SupabaseSurveyRow[] = [];
  let from = 0;
  let hasMore = true;

  // --- BLOCO 2: Validação de filtros ---
  // Garantir que apenas filtros reais (non-empty strings) são aplicados.
  // externalId nunca deve ser aplicado por padrão — apenas se for uma string válida.
  const applyCentro    = filters?.centro     ? filters.centro.trim()     : null;
  const applyDisciplina = filters?.disciplina ? filters.disciplina.trim() : null;
  const applyExternalId = (filters?.externalId && filters.externalId.trim())
    ? filters.externalId.trim()
    : null;

  // --- BLOCO 3: Log de diagnóstico ---
  const activeFilters = {
    centro: applyCentro ?? 'NENHUM (dataset global)',
    disciplina: applyDisciplina ?? 'NENHUM',
    externalId: applyExternalId ?? 'NENHUM',
  };
  const isGlobal = !applyCentro && !applyDisciplina && !applyExternalId;
  console.log(`[PIPELINE] Caminho: ${isGlobal ? 'GLOBAL (sem filtro)' : 'FILTRADO'} | Filtros:`, activeFilters);

  while (hasMore) {
    let query = supabase
      .from('surveys')
      .select('id, submitted_at, course_label, q1, q2, q3, q4, q5, q6, suggestion, disciplina, external_id, centro');

    // Só aplica filtro se o valor realmente existir
    if (applyCentro) {
      query = query.ilike('centro', `%${applyCentro}%`);
    }
    if (applyDisciplina) {
      query = query.eq('disciplina', applyDisciplina);
    }
    if (applyExternalId) {
      query = query.eq('external_id', applyExternalId);
    }

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Erro ao buscar surveys do Supabase: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allRows.push(...(data as SupabaseSurveyRow[]));
      from += PAGE_SIZE;
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      }
    }
  }

  const fetchTime = Date.now() - startFetch;
  console.log(`[PERF - DB FETCH (Summary)] ${allRows.length} registros carregados via Supabase em ${fetchTime}ms`);

  // --- BLOCO 3: Validação de retorno ---
  if (allRows.length === 0) {
    console.warn('[PIPELINE] ATENÇÃO: dataset retornou 0 registros.', {
      isGlobal,
      activeFilters,
      hint: isGlobal
        ? 'Verificar RLS da tabela surveys — anon deve ter permissão SELECT.'
        : 'Verificar se os valores de filtro correspondem a dados existentes.',
    });
  }

  return allRows;
}

// ---------------------------------------------------------------------------
// Extração de Opções de Filtro (Dropdowns)
// ---------------------------------------------------------------------------

/**
 * Busca apenas as colunas necessárias para montar as opções de filtro.
 */
export async function getFilterOptions() {
  const PAGE_SIZE = 1000;
  const allRows: { centro: string | null; disciplina: string | null }[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('surveys')
      .select('centro, disciplina')
      .range(from, from + PAGE_SIZE - 1);

    if (error) break;

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allRows.push(...data);
      from += PAGE_SIZE;
      if (data.length < PAGE_SIZE) hasMore = false;
    }
  }

  const { normalizeCentro } = await import('./centro');

  const centrosSet = new Set<string>();
  const disciplinasSet = new Set<string>();

  for (const row of allRows) {
    if (row.centro) {
      const nc = normalizeCentro(row.centro);
      if (nc.valid) centrosSet.add(nc.sigla);
    }
    if (row.disciplina) {
      disciplinasSet.add(row.disciplina.trim());
    }
  }

  return {
    centros: Array.from(centrosSet).sort(),
    disciplinas: Array.from(disciplinasSet).filter(Boolean).sort()
  };
}

export const getCachedFilterOptions = unstable_cache(
  async () => {
    return getFilterOptions();
  },
  ['survey-filter-options-v3'],
  { revalidate: 3600 }
);

// ---------------------------------------------------------------------------
// Pipeline completo
// ---------------------------------------------------------------------------

/**
 * Executa o pipeline completo (sem cache — use getCachedPipeline).
 * NÃO ALTERAR: scoring, transform e agregações são intocáveis.
 */
export async function executeSurveyPipeline(filters?: SurveyPipelineFilters): Promise<SurveyPipelineResult> {
  console.log(`\n--- INICIANDO PIPELINE (Cache Miss) | Filtros: ${JSON.stringify(filters || {})} ---`);

  const rawRows = await fetchAllSurveys(filters);
  console.log(`[PIPELINE DB] Total retornado na query bruta: ${rawRows.length}`);

  const startTransform = Date.now();
  const rows = transformAllSupabaseRows(rawRows);
  const transformTime = Date.now() - startTransform;
  console.log(`[PIPELINE TRANSFORM] Total retornado após transformação: ${rows.length} em ${transformTime}ms`);

  const filterOptions = await getCachedFilterOptions();

  const startAgg = Date.now();
  const aggregation = computeGeneralAggregation(rows);
  const byQuestion = aggregateByQuestion(rows);
  const byCentro = aggregateByCentro(rows);
  const byDisciplina = aggregateByDisciplina(rows);
  const likertDistribution = computeLikertDistribution(rows);
  const timeSeries = computeTimeSeries(rows);
  const aggTime = Date.now() - startAgg;
  console.log(`[PIPELINE AGGREGATION] Total entregue aos KPIs: ${aggregation.totalResponses}`);
  console.log(`[PIPELINE AGGREGATION] Total entregue aos gráficos: byQuestion=${byQuestion.length}, byCentro=${byCentro.length}, byDisciplina=${byDisciplina.length}`);
  console.log(`[PERF - AGGREGATION] Agregações concluídas em ${aggTime}ms`);
  console.log(`------------------------------------------------------------------\n`);

  return {
    aggregation,
    byQuestion,
    byCentro,
    byDisciplina,
    likertDistribution,
    timeSeries,
    filterOptions,
  };
}

// ---------------------------------------------------------------------------
// CACHE FIX: funções memoizadas criadas estaticamente fora do escopo
// da chamada de request para que o Next.js possa deduplica-las corretamente.
// ---------------------------------------------------------------------------

const _cacheAll = unstable_cache(
  async () => executeSurveyPipeline(),
  ['survey-pipeline-all-all-v5'],
  { revalidate: 3600 }
);

const _pipelineCache = new Map<string, ReturnType<typeof unstable_cache>>();

function _getOrCreateCachedFn(centro: string, disciplina: string) {
  const key = `${centro || 'all'}::${disciplina || 'all'}`;
  if (!_pipelineCache.has(key)) {
    _pipelineCache.set(
      key,
      unstable_cache(
        async () => executeSurveyPipeline({ centro: centro || undefined, disciplina: disciplina || undefined }),
        [`survey-pipeline-${centro || 'all'}-${disciplina || 'all'}-v5`],
        { revalidate: 3600 }
      )
    );
  }
  return _pipelineCache.get(key)!;
}

export const getCachedPipeline = async (centro?: string, disciplina?: string): Promise<SurveyPipelineResult> => {
  if (!centro && !disciplina) {
    return _cacheAll();
  }
  return _getOrCreateCachedFn(centro ?? '', disciplina ?? '')();
};

let _memoryCommentsCache: TransformedSurveyRow[] | null = null;
let _memoryCommentsTimestamp = 0;

export async function getCachedComments(): Promise<TransformedSurveyRow[]> {
  const now = Date.now();
  if (_memoryCommentsCache && now - _memoryCommentsTimestamp < 3600 * 1000) {
    return _memoryCommentsCache;
  }
  const rawRows = await fetchAllSurveys();
  const rows = transformAllSupabaseRows(rawRows);
  _memoryCommentsCache = rows.filter(r => (r.suggestion || '').trim().length > 0);
  _memoryCommentsTimestamp = now;
  return _memoryCommentsCache;
}

// ---------------------------------------------------------------------------
// Trilha 2: Tabela Paginada (Raw Rows)
// ---------------------------------------------------------------------------

export async function getPaginatedTableRows(filters: SurveyPipelineFilters, page: number, pageSize: number = 50) {
  // Mesma validação de filtros que fetchAllSurveys
  const applyCentro     = filters?.centro     ? filters.centro.trim()     : null;
  const applyDisciplina = filters?.disciplina ? filters.disciplina.trim() : null;
  const applyExternalId = (filters?.externalId && filters.externalId.trim())
    ? filters.externalId.trim()
    : null;

  let query = supabase
    .from('surveys')
    .select('id, submitted_at, course_label, q1, q2, q3, q4, q5, q6, suggestion, disciplina, external_id, centro', { count: 'exact' });

  if (applyCentro) {
    query = query.ilike('centro', `%${applyCentro}%`);
  }
  if (applyDisciplina) {
    query = query.eq('disciplina', applyDisciplina);
  }
  if (applyExternalId) {
    query = query.eq('external_id', applyExternalId);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const startTableFetch = Date.now();
  const { data, count, error } = await query.order('id', { ascending: false }).range(from, to);
  const tableFetchTime = Date.now() - startTableFetch;

  if (error) {
    throw new Error(`Erro ao buscar tabela paginada: ${error.message}`);
  }

  const loadedRows = data ? data.length : 0;
  console.log(`[PERF - DB FETCH (Table)] Pág ${page}: ${loadedRows} linhas em ${tableFetchTime}ms (total: ${count})`);

  const rows = transformAllSupabaseRows(data as SupabaseSurveyRow[]);

  return {
    rows,
    totalCount: count ?? 0,
    totalPages: count ? Math.ceil(count / pageSize) : 0,
  };
}

// ---------------------------------------------------------------------------
// Exemplo de uso (executar standalone para validação)
// ---------------------------------------------------------------------------

export async function runValidationExample(): Promise<void> {
  console.log('🔄 Executando pipeline de transformação e scoring...\n');

  const result = await executeSurveyPipeline();

  console.log('='.repeat(60));
  console.log('📊 RESULTADOS DO PIPELINE');
  console.log('='.repeat(60));

  console.log(`\n📋 Total de respostas: ${result.aggregation.totalResponses}`);
  console.log(`📋 Total de respostas individuais (q1–q6): ${result.aggregation.totalAnswers}`);
  console.log(`\n📈 Média Likert geral: ${result.aggregation.likertAverage}`);
  console.log(`🏷️  Classificação: ${result.aggregation.classificationBadge}`);

  const d = result.aggregation.distribution;
  console.log(`\n✅ Favorável:     ${d.favorable} (${(d.favorableRate * 100).toFixed(1)}%)`);
  console.log(`➖ Neutro:        ${d.neutral} (${(d.neutralRate * 100).toFixed(1)}%)`);
  console.log(`❌ Desfavorável:  ${d.unfavorable} (${(d.unfavorableRate * 100).toFixed(1)}%)`);

  console.log('\n📊 Média por pergunta:');
  result.byQuestion.forEach((q) => {
    console.log(`   ${q.questionLabel} (${q.questionKey}): ${q.avgScore} — ${q.totalResponses} respostas`);
  });

  console.log(`\n🏛️  Centros: ${result.aggregation.uniqueCentros}`);
  result.byCentro.forEach((c) => {
    console.log(`   ${c.centro}: média ${c.likertAverage} | ${c.totalResponses} respostas`);
  });

  console.log(`\n📚 Disciplinas: ${result.aggregation.uniqueDisciplinas} (top 5 por média):`);
  result.byDisciplina.slice(0, 5).forEach((d) => {
    console.log(`   ${d.disciplina}: média ${d.likertAverage} | ${d.classificationBadge}`);
  });

  console.log('\n📊 Distribuição Likert global:');
  result.likertDistribution.forEach((item) => {
    console.log(`   ${item.label}: ${item.count} (${item.percentage}%)`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Pipeline executado com sucesso');
  console.log('='.repeat(60));
}

if (typeof require !== 'undefined' && require.main === module) {
  runValidationExample().catch(console.error);
}
