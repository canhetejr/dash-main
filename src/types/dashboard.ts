/**
 * Current filter state applied to the dashboard data.
 */
export interface FilterState {
  centro: string[];
  disciplina: string[];
  id: string[];
  sentimentLabel: string[];
  dateFrom: string | null;
  dateTo: string | null;
  scoreMin: number | null;
  scoreMax: number | null;
  search: string;
}

/**
 * Single filter option with display label and occurrence count.
 */
export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

/**
 * Available filter options derived from the dataset.
 */
export interface FilterOptions {
  centros: FilterOption[];
  disciplinas: FilterOption[];
  ids: FilterOption[];
  sentimentLabels: FilterOption[];
  dateRange: { min: string; max: string };
  scoreRange: { min: number; max: number };
}

/** Sort direction for table columns */
export type SortDirection = 'asc' | 'desc';

/**
 * Table pagination and sorting state.
 */
export interface TableState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: SortDirection;
}

/** Main view tab identifier */
export type ViewTab = 'overview' | 'analytics' | 'comments';

/** Chart visualization type */
export type ChartType = 'bar' | 'line' | 'pie' | 'radar' | 'heatmap';
