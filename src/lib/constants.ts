export const SCORE_MAP: Record<string, number> = {
  'Concordo Totalmente': 5, 'Concordo totalmente': 5,
  'Concordo Parcialmente': 4, 'Concordo parcialmente': 4,
  'Indiferente': 3,
  'Discordo Parcialmente': 2, 'Discordo parcialmente': 2,
  'Discordo Totalmente': 1, 'Discordo totalmente': 1,
};

export const SENTIMENT_THRESHOLDS = { excellent: 4.5, good: 4.0, regular: 3.0 } as const;

export const QUESTION_LABELS: Record<string, string> = {
  q1: 'Satisfação Geral', q2: 'Material Didático', q3: 'Atividades Propostas',
  q4: 'Videoaulas', q5: 'Mediador', q6: 'Materiais Complementares',
};

export const SENTIMENT_COLORS: Record<string, string> = {
  'Excelente': '#4E6930', 'Bom': '#60a5fa', 'Regular': '#D99528', 'Crítico': '#ef4444',
};

export const LIKERT_COLORS: Record<string, string> = {
  'Discordo Totalmente': '#ef4444',
  'Discordo Parcialmente': '#f97316',
  'Indiferente': '#D99528',
  'Concordo Parcialmente': '#60a5fa',
  'Concordo Totalmente': '#4E6930',
};

export const CHART_COLORS = [
  '#4E6930', '#D99528', '#60a5fa', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1',
];

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

export const SHEETS_CONFIG = { range: 'TRATAMENTO!A:M', headerRow: 0 } as const;

/**
 * A(0)=timestamp B(1)=courseLabel C-H(2-7)=q1-q6 I(8)=suggestion
 * J(9)=disciplina K(10)=id L(11)=chave M(12)=centro
 */
export const COLUMN_MAP = {
  0: 'timestamp', 1: 'courseLabel', 2: 'q1', 3: 'q2', 4: 'q3', 5: 'q4', 6: 'q5', 7: 'q6',
  8: 'suggestion', 9: 'disciplina', 10: 'id', 11: 'chave', 12: 'centro',
} as const;
