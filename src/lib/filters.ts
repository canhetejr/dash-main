import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { SurveyRow } from '@/types/survey';
import type { FilterState, FilterOptions, FilterOption } from '@/types/dashboard';
import { CENTRO_CANONICO_SIGLA_SET } from './centro';

export const EMPTY_FILTERS: FilterState = {
  centro: [],
  disciplina: [],
  id: [],
  sentimentLabel: [],
  dateFrom: null,
  dateTo: null,
  scoreMin: null,
  scoreMax: null,
  search: '',
};

export function applyFilters(rows: SurveyRow[], filters: FilterState): SurveyRow[] {
  return rows.filter((row) => {
    if (filters.centro.length > 0 && !filters.centro.includes(row.centroSigla)) return false;
    if (filters.disciplina.length > 0 && !filters.disciplina.includes(row.disciplina))
      return false;
    if (filters.id.length > 0 && !filters.id.includes(row.id)) return false;
    if (
      filters.sentimentLabel.length > 0 &&
      !filters.sentimentLabel.includes(row.sentimentLabel)
    )
      return false;

    if (filters.dateFrom && row.date < filters.dateFrom) return false;
    if (filters.dateTo && row.date > filters.dateTo) return false;

    if (filters.scoreMin !== null && row.averageScore < filters.scoreMin) return false;
    if (filters.scoreMax !== null && row.averageScore > filters.scoreMax) return false;

    if (filters.search) {
      const term = filters.search.toLowerCase();
      const searchable = [
        row.disciplina,
        row.centroDisplay,
        row.centroSigla,
        row.courseLabel,
        row.id,
        row.suggestion,
        row.sentimentLabel,
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(term)) return false;
    }

    return true;
  });
}

function buildOptions(rows: SurveyRow[], field: keyof SurveyRow): FilterOption[] {
  const counts = new Map<string, number>();
  rows.forEach((r) => {
    const val = String(r[field]);
    if (val) counts.set(val, (counts.get(val) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function buildCentroOptions(rows: SurveyRow[]): FilterOption[] {
  const map = new Map<string, { display: string; count: number }>();
  rows.forEach((r) => {
    if (!r.centroSigla) return;
    if (!CENTRO_CANONICO_SIGLA_SET.has(r.centroSigla)) return;
    const entry = map.get(r.centroSigla);
    if (entry) {
      entry.count++;
    } else {
      map.set(r.centroSigla, { display: r.centroDisplay, count: 1 });
    }
  });
  return Array.from(map.entries())
    .map(([sigla, { display, count }]) => ({ value: sigla, label: display, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildFilterOptions(rows: SurveyRow[]): FilterOptions {
  const dates = rows.map((r) => r.date).filter(Boolean).sort();
  const scores = rows.map((r) => r.averageScore).filter((s) => s > 0);

  return {
    centros: buildCentroOptions(rows),
    disciplinas: buildOptions(rows, 'disciplina'),
    ids: buildOptions(rows, 'id'),
    sentimentLabels: buildOptions(rows, 'sentimentLabel'),
    dateRange: {
      min: dates[0] ?? '',
      max: dates[dates.length - 1] ?? '',
    },
    scoreRange: {
      min: scores.length > 0 ? Math.min(...scores) : 1,
      max: scores.length > 0 ? Math.max(...scores) : 5,
    },
  };
}

export function filtersToSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.centro.length) params.set('centro', filters.centro.join(','));
  if (filters.disciplina.length) params.set('disciplina', filters.disciplina.join(','));
  if (filters.id.length) params.set('id', filters.id.join(','));
  if (filters.sentimentLabel.length)
    params.set('sentimento', filters.sentimentLabel.join(','));
  if (filters.dateFrom) params.set('de', filters.dateFrom);
  if (filters.dateTo) params.set('ate', filters.dateTo);
  if (filters.scoreMin !== null) params.set('scoreMin', String(filters.scoreMin));
  if (filters.scoreMax !== null) params.set('scoreMax', String(filters.scoreMax));
  if (filters.search) params.set('q', filters.search);

  return params;
}

function safeParseNumber(val: string | null): number | null {
  if (!val) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export function searchParamsToFilters(
  params: URLSearchParams | ReadonlyURLSearchParams
): FilterState {
  return {
    centro: params.get('centro')?.split(',').filter(Boolean) ?? [],
    disciplina: params.get('disciplina')?.split(',').filter(Boolean) ?? [],
    id: params.get('id')?.split(',').filter(Boolean) ?? [],
    sentimentLabel: params.get('sentimento')?.split(',').filter(Boolean) ?? [],
    dateFrom: params.get('de') ?? null,
    dateTo: params.get('ate') ?? null,
    scoreMin: safeParseNumber(params.get('scoreMin')),
    scoreMax: safeParseNumber(params.get('scoreMax')),
    search: params.get('q') ?? '',
  };
}

export function isFilterActive(filters: FilterState): boolean {
  return (
    filters.centro.length > 0 ||
    filters.disciplina.length > 0 ||
    filters.id.length > 0 ||
    filters.sentimentLabel.length > 0 ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.scoreMin !== null ||
    filters.scoreMax !== null ||
    filters.search !== ''
  );
}

export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.centro.length > 0) count++;
  if (filters.disciplina.length > 0) count++;
  if (filters.id.length > 0) count++;
  if (filters.sentimentLabel.length > 0) count++;
  if (filters.dateFrom || filters.dateTo) count++;
  if (filters.scoreMin !== null || filters.scoreMax !== null) count++;
  if (filters.search) count++;
  return count;
}
