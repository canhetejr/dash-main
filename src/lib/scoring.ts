import { SCORE_MAP, SENTIMENT_THRESHOLDS } from './constants';
import type { SentimentLabel } from '@/types/survey';

export function textToScore(text: string): number {
  const normalized = text.trim();
  return SCORE_MAP[normalized] ?? 0;
}

export function computeAverageScore(scores: number[]): number {
  const valid = scores.filter((s) => s > 0);
  if (valid.length === 0) return 0;
  return Number((valid.reduce((sum, s) => sum + s, 0) / valid.length).toFixed(2));
}

export function countPositiveAnswers(scores: number[]): number {
  return scores.filter((s) => s >= 4).length;
}

export function computePositiveRate(positiveCount: number, total: number): number {
  if (total === 0) return 0;
  return Number((positiveCount / total).toFixed(4));
}

export function classifySentiment(avgScore: number): SentimentLabel {
  if (avgScore >= SENTIMENT_THRESHOLDS.excellent) return 'Excelente';
  if (avgScore >= SENTIMENT_THRESHOLDS.good) return 'Bom';
  if (avgScore >= SENTIMENT_THRESHOLDS.regular) return 'Regular';
  return 'Crítico';
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}
