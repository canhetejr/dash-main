/** Raw row from Google Sheets TRATAMENTO tab (columns A–M). */
export interface SurveyRawRow {
  timestamp: string;
  courseLabel: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  suggestion: string;
  disciplina: string;
  id: string;
  chave: string;
  centro: string;
}

/** Transformed row with computed scores and derived fields. */
export interface SurveyRow {
  timestamp: string;
  date: string;
  month: string;
  year: number;
  courseLabel: string;
  disciplina: string;
  id: string;
  centro: string;
  /** Sigla canônica do centro (entre as 7 válidas) ou string vazia se inválido. */
  centroCanonico: string;
  centroRaw: string;
  centroSigla: string;
  centroDisplay: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  suggestion: string;
  scoreQ1: number;
  scoreQ2: number;
  scoreQ3: number;
  scoreQ4: number;
  scoreQ5: number;
  scoreQ6: number;
  /** Média Likert (1..5) usando as respostas numéricas válidas. */
  likertAverage: number;
  /** % de respostas favoráveis (Likert 4 ou 5). */
  favorableRate: number;
  /** % de respostas neutras (Likert 3). */
  neutralRate: number;
  /** % de respostas desfavoráveis (Likert 1 ou 2). */
  unfavorableRate: number;

  /**
   * Classificação agregada (camada derivada) por média Likert:
   * Excelente / Bom / Regular / Crítico.
   */
  classificationBadge: SentimentLabel;

  /** URL para abrir a disciplina no Moodle. Pode ser string vazia. */
  moodleUrl: string;

  // Campos legados (mantidos para compatibilidade interna)
  averageScore: number;
  positiveAnswers: number;
  positiveRate: number;
  sentimentLabel: SentimentLabel;
}

export type SentimentLabel = 'Excelente' | 'Bom' | 'Regular' | 'Crítico';

export type LikertLabel =
  | 'Discordo Totalmente'
  | 'Discordo Parcialmente'
  | 'Indiferente'
  | 'Concordo Parcialmente'
  | 'Concordo Totalmente';

export interface DashboardSummary {
  totalResponses: number;
  uniqueDisciplines: number;
  uniqueIds: number;
  uniqueCenters: number;
  /** Média Likert (1..5). */
  likertAverage: number;
  /** % favorável (Likert 4..5). */
  favorableRate: number;
  /** % neutro (Likert 3). */
  neutralRate: number;
  /** % desfavorável (Likert 1..2). */
  unfavorableRate: number;

  // Legado (compatibilidade)
  avgScore: number;
  positiveRate: number;

  criticalCount: number;
  excellentCount: number;
}

export interface QuestionAggregate {
  question: string;
  questionKey: string;
  avgScore: number;
  totalResponses: number;
  distribution: Record<string, number>;
}

export interface CentroAggregate {
  centro: string;
  totalResponses: number;
  likertAverage: number;
  favorableRate: number;
}

export interface DisciplinaAggregate {
  disciplina: string;
  id: string;
  centro: string;
  totalResponses: number;
  likertAverage: number;
  favorableRate: number;
  classificationBadge: SentimentLabel;
  moodleUrl: string;
}

export interface TimeSeriesPoint {
  period: string;
  totalResponses: number;
  likertAverage: number;
  favorableRate: number;
}

export interface LikertDistribution {
  label: LikertLabel;
  count: number;
  percentage: number;
}

export interface DashboardData {
  rows: SurveyRow[];
  summary: DashboardSummary;
  byQuestion: QuestionAggregate[];
  byCentro: CentroAggregate[];
  byDisciplina: DisciplinaAggregate[];
  timeSeries: TimeSeriesPoint[];
  likertDistribution: LikertDistribution[];
}
