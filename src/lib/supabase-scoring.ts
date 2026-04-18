/**
 * supabase-scoring.ts
 *
 * Camada de scoring isolada — funções puras, sem UI.
 * Preserva exatamente a lógica congelada do sistema atual.
 *
 * Mapeamento Likert (congelado):
 *   Concordo Totalmente    → 5
 *   Concordo Parcialmente  → 4
 *   Indiferente            → 3
 *   Discordo Parcialmente  → 2
 *   Discordo Totalmente    → 1
 *
 * Classificação agregada (congelada):
 *   >= 4.5 → Excelente
 *   >= 4.0 → Bom
 *   >= 3.0 → Regular
 *   <  3.0 → Crítico
 */

import type { SentimentLabel } from '@/types/survey';

// ---------------------------------------------------------------------------
// Constantes congeladas — NÃO ALTERAR
// ---------------------------------------------------------------------------

/** Mapeamento Likert → número (aceita variações de capitalização). */
export const LIKERT_SCORE_MAP: Record<string, number> = {
  'Concordo Totalmente': 5, 'Concordo totalmente': 5,
  'Concordo Parcialmente': 4, 'Concordo parcialmente': 4,
  'Indiferente': 3,
  'Discordo Parcialmente': 2, 'Discordo parcialmente': 2,
  'Discordo Totalmente': 1, 'Discordo totalmente': 1,
};

/** Thresholds de classificação agregada (congelados). */
export const CLASSIFICATION_THRESHOLDS = {
  excellent: 4.5,
  good: 4.0,
  regular: 3.0,
} as const;

// ---------------------------------------------------------------------------
// 1. Conversão Likert → número
// ---------------------------------------------------------------------------

/**
 * Converte texto Likert em valor numérico.
 * Retorna 0 se o texto não corresponder a nenhuma resposta válida.
 *
 * @example
 *   likertToScore('Concordo Totalmente') // → 5
 *   likertToScore('Indiferente')         // → 3
 *   likertToScore('')                    // → 0
 */
export function likertToScore(text: string): number {
  const normalized = (text ?? '').trim();
  return LIKERT_SCORE_MAP[normalized] ?? 0;
}

/**
 * Verifica se um score numérico é válido (1–5).
 */
export function isValidScore(score: number): boolean {
  return score === 1 || score === 2 || score === 3 || score === 4 || score === 5;
}

// ---------------------------------------------------------------------------
// 2. Cálculo de média
// ---------------------------------------------------------------------------

/**
 * Calcula a média de um array de scores, ignorando valores inválidos (0).
 * Retorna 0 se não houver scores válidos.
 *
 * @example
 *   computeAverage([5, 4, 3, 4, 5, 4]) // → 4.17
 *   computeAverage([0, 0])              // → 0
 */
export function computeAverage(scores: number[]): number {
  const valid = scores.filter(isValidScore);
  if (valid.length === 0) return 0;
  return Number((valid.reduce((sum, s) => sum + s, 0) / valid.length).toFixed(2));
}

/**
 * Calcula a média de q1–q6 para uma linha individual.
 * Recebe os 6 textos Likert, converte e calcula.
 *
 * @example
 *   computeRowAverage('Concordo Totalmente', 'Concordo Parcialmente', 'Indiferente',
 *                     'Concordo Totalmente', 'Concordo Parcialmente', 'Concordo Totalmente')
 *   // → 4.17
 */
export function computeRowAverage(
  q1: string, q2: string, q3: string,
  q4: string, q5: string, q6: string,
): number {
  const scores = [
    likertToScore(q1), likertToScore(q2), likertToScore(q3),
    likertToScore(q4), likertToScore(q5), likertToScore(q6),
  ];
  return computeAverage(scores);
}

// ---------------------------------------------------------------------------
// 3. Classificação (favorável / neutro / desfavorável)
// ---------------------------------------------------------------------------

export type FavorabilityCategory = 'favorável' | 'neutro' | 'desfavorável';

/**
 * Classifica um score individual em favorável, neutro ou desfavorável.
 *
 * - Favorável:      score >= 4 (Concordo Parcialmente, Concordo Totalmente)
 * - Neutro:         score === 3 (Indiferente)
 * - Desfavorável:   score <= 2 (Discordo Parcialmente, Discordo Totalmente)
 */
export function classifyScore(score: number): FavorabilityCategory | null {
  if (!isValidScore(score)) return null;
  if (score >= 4) return 'favorável';
  if (score === 3) return 'neutro';
  return 'desfavorável';
}

/**
 * Classifica a média Likert agregada em Excelente/Bom/Regular/Crítico.
 * Preserva exatamente os thresholds do sistema atual.
 */
export function classifySentiment(avgScore: number): SentimentLabel {
  if (avgScore >= CLASSIFICATION_THRESHOLDS.excellent) return 'Excelente';
  if (avgScore >= CLASSIFICATION_THRESHOLDS.good) return 'Bom';
  if (avgScore >= CLASSIFICATION_THRESHOLDS.regular) return 'Regular';
  return 'Crítico';
}

// ---------------------------------------------------------------------------
// 4. Distribuição (favorável / neutro / desfavorável)
// ---------------------------------------------------------------------------

export interface FavorabilityDistribution {
  favorable: number;
  neutral: number;
  unfavorable: number;
  total: number;
  favorableRate: number;
  neutralRate: number;
  unfavorableRate: number;
}

/**
 * Calcula a distribuição de favorabilidade a partir de um array de scores válidos.
 * Usado para agregar respostas individuais (q1–q6) de um ou mais registros.
 */
export function computeFavorabilityDistribution(scores: number[]): FavorabilityDistribution {
  let favorable = 0;
  let neutral = 0;
  let unfavorable = 0;

  scores.forEach((s) => {
    if (!isValidScore(s)) return;
    if (s >= 4) favorable += 1;
    else if (s === 3) neutral += 1;
    else unfavorable += 1;
  });

  const total = favorable + neutral + unfavorable;

  return {
    favorable,
    neutral,
    unfavorable,
    total,
    favorableRate: total > 0 ? Number((favorable / total).toFixed(4)) : 0,
    neutralRate: total > 0 ? Number((neutral / total).toFixed(4)) : 0,
    unfavorableRate: total > 0 ? Number((unfavorable / total).toFixed(4)) : 0,
  };
}
