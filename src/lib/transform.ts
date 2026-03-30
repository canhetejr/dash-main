import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type {
  SurveyRawRow,
  SurveyRow,
  DashboardSummary,
  QuestionAggregate,
  CentroAggregate,
  DisciplinaAggregate,
  TimeSeriesPoint,
  SentimentLabel,
  LikertDistribution,
  DashboardData,
} from '@/types/survey';
import { QUESTION_LABELS } from './constants';
import {
  textToScore,
  computeAverageScore,
  classifySentiment,
} from './scoring';
import { normalizeCentro } from './centro';

dayjs.extend(customParseFormat);

const DATE_FORMATS = ['DD/MM/YYYY HH:mm:ss', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'];

function parseTimestamp(raw: string): dayjs.Dayjs {
  for (const fmt of DATE_FORMATS) {
    const parsed = dayjs(raw, fmt);
    if (parsed.isValid()) return parsed;
  }
  const fallback = dayjs(raw);
  return fallback.isValid() ? fallback : dayjs();
}

export function transformRow(raw: SurveyRawRow): SurveyRow {
  const parsed = parseTimestamp(raw.timestamp);

  const scoreQ1 = textToScore(raw.q1);
  const scoreQ2 = textToScore(raw.q2);
  const scoreQ3 = textToScore(raw.q3);
  const scoreQ4 = textToScore(raw.q4);
  const scoreQ5 = textToScore(raw.q5);
  const scoreQ6 = textToScore(raw.q6);

  const scores = [scoreQ1, scoreQ2, scoreQ3, scoreQ4, scoreQ5, scoreQ6];
  const validScores = scores.filter((s) => s > 0);
  const totalValidAnswers = validScores.length;

  const averageScore = computeAverageScore(validScores);

  const favorableAnswers = validScores.filter((s) => s >= 4).length;
  const neutralAnswers = validScores.filter((s) => s === 3).length;
  const unfavorableAnswers = validScores.filter((s) => s <= 2).length;

  const favorableRate = totalValidAnswers > 0 ? favorableAnswers / totalValidAnswers : 0;
  const neutralRate = totalValidAnswers > 0 ? neutralAnswers / totalValidAnswers : 0;
  const unfavorableRate = totalValidAnswers > 0 ? unfavorableAnswers / totalValidAnswers : 0;

  const classificationBadge = classifySentiment(averageScore);

  return {
    timestamp: raw.timestamp,
    date: parsed.format('YYYY-MM-DD'),
    month: parsed.format('YYYY-MM'),
    year: parsed.year(),
    courseLabel: raw.courseLabel.trim(),
    disciplina: raw.disciplina.trim(),
    id: raw.id.trim(),
    ...(() => {
      const nc = normalizeCentro(raw.centro);
      return {
        centro: nc.sigla,
        centroCanonico: nc.sigla,
        centroRaw: nc.raw,
        centroSigla: nc.sigla,
        centroDisplay: nc.valid ? nc.display : 'Não classificado',
      };
    })(),
    q1: raw.q1.trim(),
    q2: raw.q2.trim(),
    q3: raw.q3.trim(),
    q4: raw.q4.trim(),
    q5: raw.q5.trim(),
    q6: raw.q6.trim(),
    suggestion: raw.suggestion.trim(),
    scoreQ1,
    scoreQ2,
    scoreQ3,
    scoreQ4,
    scoreQ5,
    scoreQ6,
    likertAverage: averageScore,
    favorableRate,
    neutralRate,
    unfavorableRate,
    classificationBadge,
    moodleUrl: '',

    // Legado (compatibilidade interna)
    averageScore,
    positiveAnswers: favorableAnswers,
    positiveRate: favorableRate,
    sentimentLabel: classificationBadge,
  };
}

type MoodleUrlById = Map<string, string>;

function resolveMoodleUrl(id: string, moodleUrlById?: MoodleUrlById, moodleUrlTemplate?: string): string {
  const cleanId = (id ?? '').trim();
  if (!cleanId) return '';

  const direct = moodleUrlById?.get(cleanId);
  if (direct) return direct;

  const tpl = moodleUrlTemplate?.trim();
  if (tpl) return tpl.replaceAll('{{id}}', encodeURIComponent(cleanId));

  return '';
}

export function transformAll(
  rawRows: SurveyRawRow[],
  moodleUrlById?: MoodleUrlById,
  moodleUrlTemplate?: string
): SurveyRow[] {
  return rawRows.map((r) => {
    const row = transformRow(r);
    row.moodleUrl = resolveMoodleUrl(row.id, moodleUrlById, moodleUrlTemplate);
    return row;
  });
}

export function computeSummary(rows: SurveyRow[]): DashboardSummary {
  const totalResponses = rows.length;
  const uniqueDisciplines = new Set(rows.map((r) => r.disciplina)).size;
  const uniqueIds = new Set(rows.map((r) => r.id)).size;
  const uniqueCenters = new Set(rows.map((r) => r.centroCanonico).filter(Boolean)).size;

  // Likert real agregando todas as respostas numéricas válidas (Q1..Q6).
  let totalAnswers = 0;
  let sumScores = 0;
  let favorableAnswers = 0;
  let neutralAnswers = 0;
  let unfavorableAnswers = 0;

  rows.forEach((r) => {
    const vals = [r.scoreQ1, r.scoreQ2, r.scoreQ3, r.scoreQ4, r.scoreQ5, r.scoreQ6];
    vals.forEach((v) => {
      if (!(v === 1 || v === 2 || v === 3 || v === 4 || v === 5)) return;
      totalAnswers += 1;
      sumScores += v;
      if (v >= 4) favorableAnswers += 1;
      else if (v === 3) neutralAnswers += 1;
      else unfavorableAnswers += 1;
    });
  });

  const likertAverage = totalAnswers > 0 ? Number((sumScores / totalAnswers).toFixed(2)) : 0;
  const favorableRate = totalAnswers > 0 ? Number((favorableAnswers / totalAnswers).toFixed(4)) : 0;
  const neutralRate = totalAnswers > 0 ? Number((neutralAnswers / totalAnswers).toFixed(4)) : 0;
  const unfavorableRate = totalAnswers > 0 ? Number((unfavorableAnswers / totalAnswers).toFixed(4)) : 0;

  const criticalCount = rows.filter((r) => r.classificationBadge === 'Crítico').length;
  const excellentCount = rows.filter((r) => r.classificationBadge === 'Excelente').length;

  return {
    totalResponses,
    uniqueDisciplines,
    uniqueIds,
    uniqueCenters,
    likertAverage,
    favorableRate,
    neutralRate,
    unfavorableRate,

    // Legado (compatibilidade interna)
    avgScore: likertAverage,
    positiveRate: favorableRate,

    criticalCount,
    excellentCount,
  };
}

export function aggregateByQuestion(rows: SurveyRow[]): QuestionAggregate[] {
  const keys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

  return keys.map((key) => {
    const scoreKey = `score${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof SurveyRow;
    const scores = rows.map((r) => r[scoreKey] as number).filter((s) => s > 0);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const distribution: Record<string, number> = {};
    rows.forEach((r) => {
      const answer = r[key] as string;
      if (answer) {
        distribution[answer] = (distribution[answer] ?? 0) + 1;
      }
    });

    return {
      question: QUESTION_LABELS[key] ?? key,
      questionKey: key,
      avgScore: Number(avg.toFixed(2)),
      totalResponses: scores.length,
      distribution,
    };
  });
}

export function aggregateByCentro(rows: SurveyRow[]): CentroAggregate[] {
  const map = new Map<string, SurveyRow[]>();
  rows
    .filter((r) => r.centroCanonico)
    .forEach((r) => {
    const key = r.centroSigla;
    const list = map.get(key) ?? [];
    list.push(r);
    map.set(key, list);
  });

  return Array.from(map.entries())
    .map(([centro, items]) => {
      let totalAnswers = 0;
      let sumScores = 0;
      let favorableAnswers = 0;

      items.forEach((r) => {
        const vals = [r.scoreQ1, r.scoreQ2, r.scoreQ3, r.scoreQ4, r.scoreQ5, r.scoreQ6];
        vals.forEach((v) => {
          if (!(v === 1 || v === 2 || v === 3 || v === 4 || v === 5)) return;
          totalAnswers += 1;
          sumScores += v;
          if (v >= 4) favorableAnswers += 1;
        });
      });

      const likertAverage = totalAnswers > 0 ? Number((sumScores / totalAnswers).toFixed(2)) : 0;
      const favorableRate = totalAnswers > 0 ? Number((favorableAnswers / totalAnswers).toFixed(4)) : 0;

      return {
        centro: items[0].centroDisplay,
        totalResponses: items.length,
        likertAverage,
        favorableRate,
      };
    })
    .sort((a, b) => b.totalResponses - a.totalResponses);
}

export function aggregateByDisciplina(rows: SurveyRow[]): DisciplinaAggregate[] {
  const map = new Map<string, SurveyRow[]>();
  rows.forEach((r) => {
    const list = map.get(r.disciplina) ?? [];
    list.push(r);
    map.set(r.disciplina, list);
  });

  return Array.from(map.entries())
    .map(([disciplina, items]) => {
      let totalAnswers = 0;
      let sumScores = 0;
      let favorableAnswers = 0;

      items.forEach((r) => {
        const vals = [r.scoreQ1, r.scoreQ2, r.scoreQ3, r.scoreQ4, r.scoreQ5, r.scoreQ6];
        vals.forEach((v) => {
          if (!(v === 1 || v === 2 || v === 3 || v === 4 || v === 5)) return;
          totalAnswers += 1;
          sumScores += v;
          if (v >= 4) favorableAnswers += 1;
        });
      });

      const likertAverage = totalAnswers > 0 ? Number((sumScores / totalAnswers).toFixed(2)) : 0;
      const favorableRate = totalAnswers > 0 ? Number((favorableAnswers / totalAnswers).toFixed(4)) : 0;

      const classificationBadge = classifySentiment(likertAverage);
      return {
        disciplina,
        id: items[0].id,
        centro: items[0].centroDisplay,
        totalResponses: items.length,
        likertAverage,
        favorableRate,
        classificationBadge,
        moodleUrl: items[0].moodleUrl,
      };
    })
    .sort((a, b) => b.likertAverage - a.likertAverage);
}

export function computeTimeSeries(rows: SurveyRow[]): TimeSeriesPoint[] {
  const map = new Map<string, SurveyRow[]>();
  rows.forEach((r) => {
    const list = map.get(r.month) ?? [];
    list.push(r);
    map.set(r.month, list);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, items]) => {
      let totalAnswers = 0;
      let sumScores = 0;
      let favorableAnswers = 0;

      items.forEach((r) => {
        const vals = [r.scoreQ1, r.scoreQ2, r.scoreQ3, r.scoreQ4, r.scoreQ5, r.scoreQ6];
        vals.forEach((v) => {
          if (!(v === 1 || v === 2 || v === 3 || v === 4 || v === 5)) return;
          totalAnswers += 1;
          sumScores += v;
          if (v >= 4) favorableAnswers += 1;
        });
      });

      const likertAverage = totalAnswers > 0 ? Number((sumScores / totalAnswers).toFixed(2)) : 0;
      const favorableRate = totalAnswers > 0 ? Number((favorableAnswers / totalAnswers).toFixed(4)) : 0;

      return {
        period,
        totalResponses: items.length,
        likertAverage,
        favorableRate,
      };
    });
}

export function computeLikertDistribution(rows: SurveyRow[]) {
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
    const scores = [r.scoreQ1, r.scoreQ2, r.scoreQ3, r.scoreQ4, r.scoreQ5, r.scoreQ6];
    scores.forEach((s) => {
      if (s === 1 || s === 2 || s === 3 || s === 4 || s === 5) {
        counts[s] += 1;
        total += 1;
      }
    });
  });

  return order.map((score) => {
    const count = counts[score];
    return {
      label: labelsByScore[score],
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
    };
  });
}

export function buildDashboardData(rows: SurveyRow[]): DashboardData {
  return {
    rows,
    summary: computeSummary(rows),
    byQuestion: aggregateByQuestion(rows),
    byCentro: aggregateByCentro(rows),
    byDisciplina: aggregateByDisciplina(rows),
    timeSeries: computeTimeSeries(rows),
    likertDistribution: computeLikertDistribution(rows),
  };
}
