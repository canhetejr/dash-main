/**
 * supabase-pipeline.ts
 *
 * Pipeline completo: lê dados do Supabase → transforma → agrega.
 * Pronto para conectar ao dashboard.
 *
 * Este módulo NÃO contém UI — apenas orquestra a leitura e transformação.
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
} from './supabase-transform';
import { unstable_cache } from 'next/cache';

// ---------------------------------------------------------------------------
// Tipos do pipeline
// ---------------------------------------------------------------------------

/** Resultado completo do pipeline — tudo que o dashboard precisa. */
export interface SurveyPipelineResult {
  rows: TransformedSurveyRow[];
  aggregation: SurveyAggregation;
  byQuestion: QuestionAggregation[];
  byCentro: ReturnType<typeof aggregateByCentro>;
  byDisciplina: ReturnType<typeof aggregateByDisciplina>;
  likertDistribution: ReturnType<typeof computeLikertDistribution>;
  filterOptions: {
    centros: string[];
    disciplinas: string[];
  };
}

export interface SurveyPipelineFilters {
  centro?: string;
  disciplina?: string;
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

  while (hasMore) {
    let query = supabase
      .from('surveys')
      .select('id, submitted_at, course_label, q1, q2, q3, q4, q5, q6, suggestion, disciplina, external_id, centro');

    if (filters?.centro) {
      // Como o banco guarda variações (ex: "CEHLA-SINCRONA"), o ilike resolve.
      query = query.ilike('centro', `%${filters.centro}%`);
    }
    if (filters?.disciplina) {
      query = query.eq('disciplina', filters.disciplina);
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
      // Se retornou menos que PAGE_SIZE, não há mais páginas
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      }
    }
  }

  const fetchTime = Date.now() - startFetch;
  console.log(`[PERF - DB FETCH (Summary)] ${allRows.length} registros carregados via Supabase em ${fetchTime}ms`);

  return allRows;
}

// ---------------------------------------------------------------------------
// Extração de Opções de Filtro (Dropdowns)
// ---------------------------------------------------------------------------

/**
 * Busca apenas as colunas necessárias para montar as opções de filtro.
 * Isso impede que a consulta principal precise trazer 10k linhas apenas para os dropdowns.
 */
export async function getFilterOptions() {
  const PAGE_SIZE = 1000;
  const allRows: any[] = [];
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

  // Use dynamic import or require here? We can just import normalizeCentro at top, but since we are in file scope, we should import it at the top. Wait, normalizeCentro is already imported? No, it's not. Let's assume it's not imported in this file directly. Wait, the pipeline file doesn't import `normalizeCentro`, only `supabase-transform.ts` does. Let's just import it at the top or dynamically import it.
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
  ['survey-filter-options-v1'],
  { revalidate: 3600 } // cache de 1 hora
);

// ---------------------------------------------------------------------------
// Pipeline completo
// ---------------------------------------------------------------------------

/**
 * Executa o pipeline completo:
 * 1. Busca dados do Supabase
 * 2. Transforma (Likert → scores)
 * 3. Calcula agregações
 *
 * @returns Objeto com todas as estruturas necessárias para o dashboard
 */
export async function executeSurveyPipeline(filters?: SurveyPipelineFilters): Promise<SurveyPipelineResult> {
  console.log(`\n--- INICIANDO PIPELINE (Cache Miss) | Filtros: ${JSON.stringify(filters || {})} ---`);
  
  // 1. Fetch COM push-down de filtros para o banco de dados
  const rawRows = await fetchAllSurveys(filters);

  // 2. Transform (agora processa apenas os registros já filtrados)
  const startTransform = Date.now();
  let rows = transformAllSupabaseRows(rawRows);
  const transformTime = Date.now() - startTransform;
  console.log(`[PERF - TRANSFORM] Transformação de ${rows.length} registros em ${transformTime}ms`);

  // Busca as opções completas via cache (não depende das linhas filtradas)
  const filterOptions = await getCachedFilterOptions();

  // 3. Aggregate
  const startAgg = Date.now();
  const aggregation = computeGeneralAggregation(rows);
  const byQuestion = aggregateByQuestion(rows);
  const byCentro = aggregateByCentro(rows);
  const byDisciplina = aggregateByDisciplina(rows);
  const likertDistribution = computeLikertDistribution(rows);
  const aggTime = Date.now() - startAgg;
  console.log(`[PERF - AGGREGATION] Agregações matemáticas concluídas em ${aggTime}ms`);
  console.log(`------------------------------------------------------------------\n`);

  return {
    rows,
    aggregation,
    byQuestion,
    byCentro,
    byDisciplina,
    likertDistribution,
    filterOptions,
  };
}

export const getCachedPipeline = async (centro?: string, disciplina?: string) => {
  // A chave de cache DEVE incluir os filtros, senão todos batem no mesmo cache.
  const cacheKey = `survey-pipeline-${centro || 'all'}-${disciplina || 'all'}`;

  const fetchFn = unstable_cache(
    async () => {
      return executeSurveyPipeline({ centro, disciplina });
    },
    [cacheKey],
    { revalidate: 3600 }
  );

  return fetchFn();
};

// ---------------------------------------------------------------------------
// Trilha 2: Tabela Paginada (Raw Rows)
// ---------------------------------------------------------------------------

export async function getPaginatedTableRows(filters: SurveyPipelineFilters, page: number, pageSize: number = 50) {
  let query = supabase
    .from('surveys')
    .select('id, submitted_at, course_label, q1, q2, q3, q4, q5, q6, suggestion, disciplina, external_id, centro', { count: 'exact' });

  if (filters?.centro) {
    query = query.ilike('centro', `%${filters.centro}%`);
  }
  if (filters?.disciplina) {
    query = query.eq('disciplina', filters.disciplina);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const startTableFetch = Date.now();
  // Usa ordenação por submissão mais recente se disponível, ou id
  const { data, count, error } = await query.order('id', { ascending: false }).range(from, to);
  const tableFetchTime = Date.now() - startTableFetch;

  if (error) {
    throw new Error(`Erro ao buscar tabela paginada: ${error.message}`);
  }

  const loadedRows = data ? data.length : 0;
  console.log(`[PERF - DB FETCH (Table)] Pág ${page}: ${loadedRows} linhas exibidas carregadas em ${tableFetchTime}ms. (Total no banco para o filtro: ${count})`);

  // Não recalcula scoring na UI: usa a base analítica transformAllSupabaseRows
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

/**
 * Função de exemplo para validação standalone.
 * Pode ser executada diretamente para verificar os resultados.
 *
 * Uso:
 *   npx tsx src/lib/supabase-pipeline.ts
 *
 * (requer variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */
export async function runValidationExample(): Promise<void> {
  console.log('🔄 Executando pipeline de transformação e scoring...\n');

  const result = await executeSurveyPipeline();

  console.log('='.repeat(60));
  console.log('📊 RESULTADOS DO PIPELINE');
  console.log('='.repeat(60));

  // Contagem total
  console.log(`\n📋 Total de respostas: ${result.aggregation.totalResponses}`);
  console.log(`📋 Total de respostas individuais (q1–q6): ${result.aggregation.totalAnswers}`);

  // Média geral
  console.log(`\n📈 Média Likert geral: ${result.aggregation.likertAverage}`);
  console.log(`🏷️  Classificação: ${result.aggregation.classificationBadge}`);

  // Distribuição
  const d = result.aggregation.distribution;
  console.log(`\n✅ Favorável:     ${d.favorable} (${(d.favorableRate * 100).toFixed(1)}%)`);
  console.log(`➖ Neutro:        ${d.neutral} (${(d.neutralRate * 100).toFixed(1)}%)`);
  console.log(`❌ Desfavorável:  ${d.unfavorable} (${(d.unfavorableRate * 100).toFixed(1)}%)`);

  // Média por pergunta
  console.log('\n📊 Média por pergunta:');
  result.byQuestion.forEach((q) => {
    console.log(`   ${q.questionLabel} (${q.questionKey}): ${q.avgScore} — ${q.totalResponses} respostas`);
  });

  // Centros
  console.log(`\n🏛️  Centros: ${result.aggregation.uniqueCentros}`);
  result.byCentro.forEach((c) => {
    console.log(`   ${c.centro}: média ${c.likertAverage} | ${c.totalResponses} respostas`);
  });

  // Disciplinas (top 5)
  console.log(`\n📚 Disciplinas: ${result.aggregation.uniqueDisciplinas} (top 5 por média):`);
  result.byDisciplina.slice(0, 5).forEach((d) => {
    console.log(`   ${d.disciplina}: média ${d.likertAverage} | ${d.classificationBadge}`);
  });

  // Distribuição Likert
  console.log('\n📊 Distribuição Likert global:');
  result.likertDistribution.forEach((item) => {
    console.log(`   ${item.label}: ${item.count} (${item.percentage}%)`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Pipeline executado com sucesso');
  console.log('='.repeat(60));
}

// Permite execução direta: npx tsx src/lib/supabase-pipeline.ts
if (typeof require !== 'undefined' && require.main === module) {
  runValidationExample().catch(console.error);
}
