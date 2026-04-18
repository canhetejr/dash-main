/**
 * validate_scoring.ts
 *
 * Script de validação standalone para o pipeline de scoring.
 * Executa contra o Supabase real e imprime os resultados para comparação
 * com o sistema atual.
 *
 * Uso:
 *   npx tsx scripts/validate_scoring.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Importações inline das funções de scoring (evita dependência de path aliases)
// ---------------------------------------------------------------------------

// Mapeamento Likert congelado
const LIKERT_SCORE_MAP: Record<string, number> = {
  'Concordo Totalmente': 5, 'Concordo totalmente': 5,
  'Concordo Parcialmente': 4, 'Concordo parcialmente': 4,
  'Indiferente': 3,
  'Discordo Parcialmente': 2, 'Discordo parcialmente': 2,
  'Discordo Totalmente': 1, 'Discordo totalmente': 1,
};

const CLASSIFICATION_THRESHOLDS = { excellent: 4.5, good: 4.0, regular: 3.0 };

function likertToScore(text: string): number {
  return LIKERT_SCORE_MAP[(text ?? '').trim()] ?? 0;
}

function isValidScore(score: number): boolean {
  return score === 1 || score === 2 || score === 3 || score === 4 || score === 5;
}

function classifySentiment(avg: number): string {
  if (avg >= CLASSIFICATION_THRESHOLDS.excellent) return 'Excelente';
  if (avg >= CLASSIFICATION_THRESHOLDS.good) return 'Bom';
  if (avg >= CLASSIFICATION_THRESHOLDS.regular) return 'Regular';
  return 'Crítico';
}

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ Variáveis de ambiente ausentes: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔄 Buscando dados do Supabase...\n');

  // Fetch paginado
  const PAGE_SIZE = 1000;
  const allRows: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('surveys')
      .select('q1, q2, q3, q4, q5, q6, disciplina, external_id, centro')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Erro: ${error.message}`);
    if (!data || data.length === 0) { hasMore = false; break; }

    allRows.push(...data);
    from += PAGE_SIZE;
    if (data.length < PAGE_SIZE) hasMore = false;
  }

  console.log(`📋 Total de registros: ${allRows.length}\n`);

  // Processar scores
  let totalAnswers = 0;
  let sumScores = 0;
  let favorable = 0;
  let neutral = 0;
  let unfavorable = 0;
  const questionScores: Record<string, number[]> = {
    q1: [], q2: [], q3: [], q4: [], q5: [], q6: [],
  };
  const likertCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  allRows.forEach((row) => {
    ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].forEach((qKey) => {
      const score = likertToScore(row[qKey] ?? '');
      if (isValidScore(score)) {
        totalAnswers += 1;
        sumScores += score;
        likertCounts[score] += 1;
        questionScores[qKey].push(score);

        if (score >= 4) favorable += 1;
        else if (score === 3) neutral += 1;
        else unfavorable += 1;
      }
    });
  });

  const likertAverage = totalAnswers > 0 ? Number((sumScores / totalAnswers).toFixed(2)) : 0;

  // Output
  console.log('='.repeat(60));
  console.log('📊 VALIDAÇÃO DO SCORING');
  console.log('='.repeat(60));

  console.log(`\n📋 Total de respostas (registros): ${allRows.length}`);
  console.log(`📋 Total de respostas individuais (q1–q6): ${totalAnswers}`);

  console.log(`\n📈 Média Likert geral: ${likertAverage}`);
  console.log(`🏷️  Classificação: ${classifySentiment(likertAverage)}`);

  console.log(`\n✅ Favorável:     ${favorable} (${(favorable / totalAnswers * 100).toFixed(1)}%)`);
  console.log(`➖ Neutro:        ${neutral} (${(neutral / totalAnswers * 100).toFixed(1)}%)`);
  console.log(`❌ Desfavorável:  ${unfavorable} (${(unfavorable / totalAnswers * 100).toFixed(1)}%)`);

  console.log('\n📊 Média por pergunta:');
  Object.entries(questionScores).forEach(([key, scores]) => {
    const avg = scores.length > 0
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
      : 0;
    console.log(`   ${key}: ${avg} (${scores.length} respostas)`);
  });

  console.log('\n📊 Distribuição Likert:');
  const labels: Record<number, string> = {
    1: 'Discordo Totalmente',
    2: 'Discordo Parcialmente',
    3: 'Indiferente',
    4: 'Concordo Parcialmente',
    5: 'Concordo Totalmente',
  };
  [1, 2, 3, 4, 5].forEach((s) => {
    const pct = totalAnswers > 0 ? ((likertCounts[s] / totalAnswers) * 100).toFixed(1) : '0.0';
    console.log(`   ${labels[s]}: ${likertCounts[s]} (${pct}%)`);
  });

  // Centros únicos
  const centros = new Set(allRows.map((r: any) => r.centro).filter(Boolean));
  console.log(`\n🏛️  Centros únicos: ${centros.size}`);

  // Disciplinas únicas
  const disciplinas = new Set(allRows.map((r: any) => r.disciplina).filter(Boolean));
  console.log(`📚 Disciplinas únicas: ${disciplinas.size}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Validação concluída — compare com o sistema atual');
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
