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
 * Busca todos os registros da tabela `surveys`.
 * Usa paginação interna do Supabase para lidar com volumes grandes.
 *
 * @returns Array de registros brutos
 * @throws Error se a query falhar
 */
export async function fetchAllSurveys(): Promise<SupabaseSurveyRow[]> {
  const PAGE_SIZE = 1000;
  const allRows: SupabaseSurveyRow[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('surveys')
      .select('id, submitted_at, course_label, q1, q2, q3, q4, q5, q6, suggestion, disciplina, external_id, centro')
      .range(from, from + PAGE_SIZE - 1);

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

  return allRows;
}

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
  // 1. Fetch
  const rawRows = await fetchAllSurveys();

  // 2. Transform
  let rows = transformAllSupabaseRows(rawRows);

  // Compute filter options before filtering
  const filterOptions = {
    centros: Array.from(new Set(rows.map(r => r.centroSigla).filter(Boolean))).sort(),
    disciplinas: Array.from(new Set(rows.map(r => r.disciplina).filter(Boolean))).sort()
  };

  // Apply filters
  if (filters?.centro) {
    rows = rows.filter(r => r.centroSigla === filters.centro || r.centroDisplay === filters.centro);
  }
  if (filters?.disciplina) {
    rows = rows.filter(r => r.disciplina === filters.disciplina);
  }

  // 3. Aggregate
  const aggregation = computeGeneralAggregation(rows);
  const byQuestion = aggregateByQuestion(rows);
  const byCentro = aggregateByCentro(rows);
  const byDisciplina = aggregateByDisciplina(rows);
  const likertDistribution = computeLikertDistribution(rows);

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
