/**
 * supabase-transform.ts
 *
 * Camada de transformação para dados vindos do Supabase.
 * Converte registros brutos da tabela `surveys` em estruturas tipadas
 * com scores, médias e classificações.
 *
 * Regras obrigatórias:
 * - NÃO altera textos Likert
 * - NÃO altera distribuição
 * - NÃO cria novos valores
 * - NÃO aplica lógica diferente do sistema atual
 * - NÃO mistura scoring com UI
 */

import type { SentimentLabel } from '@/types/survey';
import {
  likertToScore,
  isValidScore,
  computeAverage,
  classifySentiment,
  computeFavorabilityDistribution,
  type FavorabilityDistribution,
} from './supabase-scoring';
import { normalizeCentro } from './centro';
import { QUESTION_LABELS } from './constants';

// ---------------------------------------------------------------------------
// Tipos — Supabase row e row transformada
// ---------------------------------------------------------------------------

/** Registro bruto vindo diretamente da tabela `surveys` no Supabase. */
export interface SupabaseSurveyRow {
  id: string;
  submitted_at: string | null;
  course_label: string | null;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  q4: string | null;
  q5: string | null;
  q6: string | null;
  suggestion: string | null;
  disciplina: string | null;
  external_id: string | null;
  centro: string | null;
}

/** Registro transformado com scores calculados — pronto para o dashboard. */
export interface TransformedSurveyRow {
  // Dados originais
  id: string;
  submittedAt: string;
  courseLabel: string;
  disciplina: string;
  externalId: string;
  centro: string;
  centroSigla: string;
  centroDisplay: string;
  centroRaw: string;
  centroValid: boolean;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  suggestion: string;

  // Scores numéricos (q1–q6)
  scoreQ1: number;
  scoreQ2: number;
  scoreQ3: number;
  scoreQ4: number;
  scoreQ5: number;
  scoreQ6: number;

  // Média Likert da linha (q1–q6)
  likertAverage: number;

  // Favorabilidade da linha
  favorableRate: number;
  neutralRate: number;
  unfavorableRate: number;

  // Classificação agregada da linha
  classificationBadge: SentimentLabel;
}

/** Agregação geral do dashboard. */
export interface SurveyAggregation {
  totalResponses: number;
  totalAnswers: number;
  likertAverage: number;
  distribution: FavorabilityDistribution;
  classificationBadge: SentimentLabel;
  uniqueDisciplinas: number;
  uniqueCentros: number;
  uniqueExternalIds: number;
}

/** Agregação por pergunta (q1–q6). */
export interface QuestionAggregation {
  questionKey: string;
  questionLabel: string;
  avgScore: number;
  totalResponses: number;
  distribution: FavorabilityDistribution;
  likertDistribution: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Transformação de linha individual
// ---------------------------------------------------------------------------

/**
 * Transforma um registro bruto do Supabase em um registro completo
 * com scores calculados, sem alterar os textos Likert originais.
 */
export function transformSupabaseRow(raw: SupabaseSurveyRow): TransformedSurveyRow {
  const q1 = (raw.q1 ?? '').trim();
  const q2 = (raw.q2 ?? '').trim();
  const q3 = (raw.q3 ?? '').trim();
  const q4 = (raw.q4 ?? '').trim();
  const q5 = (raw.q5 ?? '').trim();
  const q6 = (raw.q6 ?? '').trim();

  const scoreQ1 = likertToScore(q1);
  const scoreQ2 = likertToScore(q2);
  const scoreQ3 = likertToScore(q3);
  const scoreQ4 = likertToScore(q4);
  const scoreQ5 = likertToScore(q5);
  const scoreQ6 = likertToScore(q6);

  const scores = [scoreQ1, scoreQ2, scoreQ3, scoreQ4, scoreQ5, scoreQ6];
  const validScores = scores.filter(isValidScore);
  const totalValid = validScores.length;

  const likertAverage = computeAverage(scores);

  const favorableAnswers = validScores.filter((s) => s >= 4).length;
  const neutralAnswers = validScores.filter((s) => s === 3).length;
  const unfavorableAnswers = validScores.filter((s) => s <= 2).length;

  const favorableRate = totalValid > 0 ? favorableAnswers / totalValid : 0;
  const neutralRate = totalValid > 0 ? neutralAnswers / totalValid : 0;
  const unfavorableRate = totalValid > 0 ? unfavorableAnswers / totalValid : 0;

  const classificationBadge = classifySentiment(likertAverage);

  const nc = normalizeCentro(raw.centro ?? '');

  return {
    id: raw.id,
    submittedAt: raw.submitted_at ?? '',
    courseLabel: (raw.course_label ?? '').trim(),
    disciplina: (raw.disciplina ?? '').trim(),
    externalId: (raw.external_id ?? '').trim(),
    centro: nc.sigla,
    centroSigla: nc.sigla,
    centroDisplay: nc.valid ? nc.display : 'Não classificado',
    centroRaw: nc.raw,
    centroValid: nc.valid,
    q1, q2, q3, q4, q5, q6,
    suggestion: (raw.suggestion ?? '').trim(),
    scoreQ1, scoreQ2, scoreQ3, scoreQ4, scoreQ5, scoreQ6,
    likertAverage,
    favorableRate,
    neutralRate,
    unfavorableRate,
    classificationBadge,
  };
}

/**
 * Transforma um lote de registros brutos do Supabase.
 */
export function transformAllSupabaseRows(rawRows: SupabaseSurveyRow[]): TransformedSurveyRow[] {
  return rawRows.map(transformSupabaseRow);
}

// ---------------------------------------------------------------------------
// Agregações
// ---------------------------------------------------------------------------

/**
 * Calcula a agregação geral a partir de linhas já transformadas.
 * Agrega TODAS as respostas individuais (q1–q6 × N linhas).
 */
export function computeGeneralAggregation(rows: TransformedSurveyRow[]): SurveyAggregation {
  const allScores: number[] = [];

  rows.forEach((r) => {
    [r.scoreQ1, r.scoreQ2, r.scoreQ3, r.scoreQ4, r.scoreQ5, r.scoreQ6].forEach((v) => {
      if (isValidScore(v)) {
        allScores.push(v);
      }
    });
  });

  const totalAnswers = allScores.length;
  const likertAverage = computeAverage(allScores);
  const distribution = computeFavorabilityDistribution(allScores);
  const classificationBadge = classifySentiment(likertAverage);

  return {
    totalResponses: rows.length,
    totalAnswers,
    likertAverage,
    distribution,
    classificationBadge,
    uniqueDisciplinas: new Set(rows.map((r) => r.disciplina)).size,
    uniqueCentros: new Set(rows.map((r) => r.centroSigla).filter(Boolean)).size,
    uniqueExternalIds: new Set(rows.map((r) => r.externalId)).size,
  };
}

/**
 * Agrega por pergunta (q1–q6).
 * Para cada pergunta, calcula média, total de respostas,
 * distribuição de favorabilidade e distribuição Likert por texto.
 */
export function aggregateByQuestion(rows: TransformedSurveyRow[]): QuestionAggregation[] {
  const keys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

  return keys.map((key) => {
    const scoreKey = `score${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof TransformedSurveyRow;
    const scores = rows
      .map((r) => r[scoreKey] as number)
      .filter(isValidScore);

    const avgScore = computeAverage(scores);
    const distribution = computeFavorabilityDistribution(scores);

    // Distribuição dos textos Likert (sem alterar)
    const likertDistribution: Record<string, number> = {};
    rows.forEach((r) => {
      const answer = r[key] as string;
      if (answer) {
        likertDistribution[answer] = (likertDistribution[answer] ?? 0) + 1;
      }
    });

    return {
      questionKey: key,
      questionLabel: QUESTION_LABELS[key] ?? key,
      avgScore,
      totalResponses: scores.length,
      distribution,
      likertDistribution,
    };
  });
}

/**
 * Agrega por centro acadêmico.
 */
export function aggregateByCentro(rows: TransformedSurveyRow[]) {
  const map = new Map<string, TransformedSurveyRow[]>();

  rows
    .filter((r) => r.centroValid)
    .forEach((r) => {
      const list = map.get(r.centroSigla) ?? [];
      list.push(r);
      map.set(r.centroSigla, list);
    });

  return Array.from(map.entries())
    .map(([centroSigla, items]) => {
      const allScores: number[] = [];
      items.forEach((r) => {
        [r.scoreQ1, r.scoreQ2, r.scoreQ3, r.scoreQ4, r.scoreQ5, r.scoreQ6].forEach((v) => {
          if (isValidScore(v)) allScores.push(v);
        });
      });

      const likertAverage = computeAverage(allScores);
      const distribution = computeFavorabilityDistribution(allScores);

      return {
        centro: items[0].centroDisplay,
        centroSigla,
        totalResponses: items.length,
        likertAverage,
        favorableRate: distribution.favorableRate,
        classificationBadge: classifySentiment(likertAverage),
      };
    })
    .sort((a, b) => b.totalResponses - a.totalResponses);
}

/**
 * Agrega por disciplina.
 */
export function aggregateByDisciplina(rows: TransformedSurveyRow[]) {
  const map = new Map<string, TransformedSurveyRow[]>();

  rows.forEach((r) => {
    const list = map.get(r.disciplina) ?? [];
    list.push(r);
    map.set(r.disciplina, list);
  });

  return Array.from(map.entries())
    .map(([disciplina, items]) => {
      const allScores: number[] = [];
      items.forEach((r) => {
        [r.scoreQ1, r.scoreQ2, r.scoreQ3, r.scoreQ4, r.scoreQ5, r.scoreQ6].forEach((v) => {
          if (isValidScore(v)) allScores.push(v);
        });
      });

      const likertAverage = computeAverage(allScores);
      const distribution = computeFavorabilityDistribution(allScores);

      return {
        disciplina,
        externalId: items[0].externalId,
        centro: items[0].centroDisplay,
        totalResponses: items.length,
        likertAverage,
        favorableRate: distribution.favorableRate,
        classificationBadge: classifySentiment(likertAverage),
      };
    })
    .sort((a, b) => b.likertAverage - a.likertAverage);
}

/**
 * Calcula a distribuição Likert global (contagem e percentual por nível).
 * Preserva exatamente os labels do sistema atual.
 */
export function computeLikertDistribution(rows: TransformedSurveyRow[]) {
  const labelsByScore = {
    1: 'Discordo Totalmente',
    2: 'Discordo Parcialmente',
    3: 'Indiferente',
    4: 'Concordo Parcialmente',
    5: 'Concordo Totalmente',
  } as const;

  const order = [1, 2, 3, 4, 5] as const;
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;

  rows.forEach((r) => {
    [r.scoreQ1, r.scoreQ2, r.scoreQ3, r.scoreQ4, r.scoreQ5, r.scoreQ6].forEach((s) => {
      if (isValidScore(s)) {
        counts[s] += 1;
        total += 1;
      }
    });
  });

  return order.map((score) => {
    const count = counts[score];
    return {
      label: labelsByScore[score],
      score,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
    };
  });
}
