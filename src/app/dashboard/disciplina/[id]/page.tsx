'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  formatDecimal,
  formatPercent,
  formatDateBR,
  formatNumber,
} from '@/lib/formatters';
import { QUESTION_LABELS, SENTIMENT_COLORS, LIKERT_COLORS } from '@/lib/constants';
import type {
  SurveyRow,
  DashboardData,
  SentimentLabel,
} from '@/types/survey';
import { ActionBar } from '@/components/dashboard/action-bar';
import { exportToCSV, exportToXLSX } from '@/lib/export';
import { exportDisciplinePDF } from '@/lib/pdf';
import type { DashboardSummary } from '@/types/survey';
import { aggregateByQuestion, computeLikertDistribution, computeSummary } from '@/lib/transform';
import { formatDateTimeForFilename, slugify } from '@/lib/slugify';

const SENTIMENT_VARIANT: Record<SentimentLabel, 'success' | 'default' | 'warning' | 'destructive'> = {
  Excelente: 'success',
  Bom: 'default',
  Regular: 'warning',
  Crítico: 'destructive',
};

const UNICV_GREEN = '#4E6930';
const CHART_GRID_STROKE = '#E2E5EB';

interface ApiResponse {
  success: boolean;
  data?: DashboardData;
  error?: string;
}

type LocalFavorability = 'all' | 'favorable' | 'neutral' | 'unfavorable';

type LocalDisciplineFilters = {
  dateFrom: string | null;
  dateTo: string | null;
  classification: SentimentLabel[];
  likertMin: number | null;
  likertMax: number | null;
  favorability: LocalFavorability;
  onlyWithComment: boolean;
  onlyCritical: boolean;
  onlyFavorable: boolean;
};

function applyLocalDisciplineFilters(rows: SurveyRow[], f: LocalDisciplineFilters): SurveyRow[] {
  return rows.filter((r) => {
    if (f.dateFrom && r.date < f.dateFrom) return false;
    if (f.dateTo && r.date > f.dateTo) return false;

    if (f.classification.length > 0 && !f.classification.includes(r.classificationBadge)) return false;

    if (f.likertMin !== null && r.likertAverage < f.likertMin) return false;
    if (f.likertMax !== null && r.likertAverage > f.likertMax) return false;

    if (f.favorability !== 'all') {
      if (f.favorability === 'favorable' && r.favorableRate < 0.5) return false;
      if (f.favorability === 'neutral' && r.neutralRate < 0.5) return false;
      if (f.favorability === 'unfavorable' && r.unfavorableRate < 0.5) return false;
    }

    if (f.onlyWithComment) {
      if (!r.suggestion || r.suggestion.trim().length === 0) return false;
    }
    if (f.onlyCritical) {
      if (r.classificationBadge !== 'Crítico') return false;
    }
    if (f.onlyFavorable) {
      if (r.favorableRate < 0.5) return false;
    }

    return true;
  });
}

function DisciplineDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [localFilters, setLocalFilters] = useState<LocalDisciplineFilters>({
    dateFrom: null,
    dateTo: null,
    classification: [],
    likertMin: null,
    likertMax: null,
    favorability: 'all',
    onlyWithComment: false,
    onlyCritical: false,
    onlyFavorable: false,
  });
  const [expandedLocalFilters, setExpandedLocalFilters] = useState(false);

  useEffect(() => {
    if (!id) return;

    const ac = new AbortController();
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/survey', { signal: ac.signal });
        const json: ApiResponse = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error ?? 'Falha ao carregar dados');
        }
        setData(json.data);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };
    load();
    return () => ac.abort();
  }, [id]);

  const decodedId = id ? decodeURIComponent(id) : '';

  const disciplineData = useMemo(() => {
    if (!data || !decodedId) return null;
    const rows = data.rows.filter(
      (r) => r.disciplina === decodedId || String(r.id) === decodedId
    );
    if (rows.length === 0) return null;

    const first = rows[0];
    const totalResponses = rows.length;

    const likertAverage =
      totalResponses > 0
        ? Number(
            (rows.reduce((s, r) => s + r.likertAverage, 0) / totalResponses).toFixed(2)
          )
        : 0;

    const classificationCounts = rows.reduce<Record<SentimentLabel, number>>(
      (acc, r) => {
        acc[r.classificationBadge] = (acc[r.classificationBadge] ?? 0) + 1;
        return acc;
      },
      {} as Record<SentimentLabel, number>
    );

    const dominantClassification = (['Excelente', 'Bom', 'Regular', 'Crítico'] as const).reduce(
      (a, b) => (classificationCounts[a] >= (classificationCounts[b] ?? 0) ? a : b)
    );

    const byQuestion = aggregateByQuestion(rows);
    const likertDistribution = computeLikertDistribution(rows);

    const totalLikertAnswers = likertDistribution.reduce((sum, d) => sum + d.count, 0);
    const favorableCount =
      likertDistribution
        .filter((d) => d.label === 'Concordo Parcialmente' || d.label === 'Concordo Totalmente')
        .reduce((sum, d) => sum + d.count, 0);
    const neutralCount = likertDistribution.find((d) => d.label === 'Indiferente')?.count ?? 0;
    const unfavorableCount =
      likertDistribution
        .filter((d) => d.label === 'Discordo Parcialmente' || d.label === 'Discordo Totalmente')
        .reduce((sum, d) => sum + d.count, 0);

    const favorableRate = totalLikertAnswers > 0 ? favorableCount / totalLikertAnswers : 0;
    const neutralRate = totalLikertAnswers > 0 ? neutralCount / totalLikertAnswers : 0;
    const unfavorableRate = totalLikertAnswers > 0 ? unfavorableCount / totalLikertAnswers : 0;

    const comments = rows
      .map((r, i) => ({ text: r.suggestion, date: r.date, index: i }))
      .filter((c) => c.text && c.text.trim().length > 0);

    return {
      disciplina: first.disciplina,
      centro: first.centroDisplay,
      totalResponses,
      likertAverage,
      favorableRate,
      neutralRate,
      unfavorableRate,
      dominantClassification,
      byQuestion,
      likertDistribution,
      comments,
      rows,
    };
  }, [data, decodedId]);

  const viewRows = useMemo(() => {
    if (!disciplineData) return [];
    return applyLocalDisciplineFilters(disciplineData.rows, localFilters);
  }, [disciplineData, localFilters]);

  const viewData = useMemo(() => {
    if (!disciplineData) return null;
    const rows = viewRows;

    const summaryLocal = computeSummary(rows);

    const classificationCounts = rows.reduce<Record<SentimentLabel, number>>(
      (acc, r) => {
        acc[r.classificationBadge] = (acc[r.classificationBadge] ?? 0) + 1;
        return acc;
      },
      {} as Record<SentimentLabel, number>
    );

    const dominantClassification = rows.length
      ? (['Excelente', 'Bom', 'Regular', 'Crítico'] as const).reduce(
          (a, b) => (classificationCounts[a] >= (classificationCounts[b] ?? 0) ? a : b)
        )
      : 'Regular';

    const byQuestion = aggregateByQuestion(rows);
    const likertDistribution = computeLikertDistribution(rows);
    const comments = rows
      .map((r, i) => ({ text: r.suggestion, date: r.date, index: i }))
      .filter((c) => c.text && c.text.trim().length > 0);

    return {
      ...disciplineData,
      totalResponses: summaryLocal.totalResponses,
      likertAverage: summaryLocal.likertAverage,
      favorableRate: summaryLocal.favorableRate,
      neutralRate: summaryLocal.neutralRate,
      unfavorableRate: summaryLocal.unfavorableRate,
      dominantClassification,
      byQuestion,
      likertDistribution,
      comments,
      rows,
    };
  }, [disciplineData, viewRows]);

  useEffect(() => {
    setExpandedComments(new Set());
  }, [localFilters, decodedId]);

  const toggleComment = (index: number) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (!decodedId) {
    return (
      <div className="rounded-xl border border-surface-300 bg-white p-8 text-center text-surface-600">
        Disciplina não informada.
      </div>
    );
  }

  if (isLoading) {
    return <DisciplineDetailSkeleton />;
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center"
      >
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-500" />
        <p className="font-medium text-surface-900">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!disciplineData) {
    return (
      <div className="rounded-xl border border-surface-300 bg-white p-12 text-center">
        <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-surface-400" />
        <h2 className="text-lg font-semibold text-surface-900">
          Disciplina não encontrada
        </h2>
        <p className="mt-1 text-sm text-surface-600">
          Nenhum dado encontrado para &quot;{decodedId}&quot;.
        </p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao dashboard
          </Button>
        </Link>
      </div>
    );
  }

  if (!viewData) {
    return null;
  }

  const globalAvg = data?.summary?.likertAverage ?? 0;
  const aboveAvg = (viewData?.likertAverage ?? 0) >= globalAvg;
  const barData = (viewData?.byQuestion ?? []).map((q) => ({
    name: q.question,
    key: q.questionKey,
    value: q.avgScore,
  }));

  const insights: string[] = [];
  if ((viewData?.totalResponses ?? 0) < 5) {
    insights.push(`Volume baixo: apenas ${viewData?.totalResponses ?? 0} respostas`);
  }
  if ((viewData?.favorableRate ?? 0) >= 1) {
    insights.push('100% favorabilidade');
  }
  const q5 = (viewData?.byQuestion ?? []).find((q) => q.questionKey === 'q5');
  if (q5 && q5.avgScore < globalAvg && q5.avgScore > 0) {
    insights.push(
      `Mediação com nota ${formatDecimal(q5.avgScore)}, abaixo da média de ${formatDecimal(globalAvg)}`
    );
  }

  return (
    <div className="space-y-6">
        {/* Back navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-surface-600 transition-colors hover:text-unicv-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao dashboard
        </Link>

        <div className="rounded-xl border border-surface-300 bg-white shadow-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 min-w-0">
              {/* Header */}
              <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">
                {viewData.disciplina}
              </h1>
              <p className="mt-1 text-sm text-surface-600">
                Drilldown analítico por ID com Likert real, benchmark e exportações filtradas.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  ID {disciplineData.rows[0]?.id ?? decodedId}
                </Badge>
                <Badge variant="secondary">{viewData.centro}</Badge>
              </div>
            </div>

            {/* Action bar */}
            {viewData && disciplineData && (
              <div className="w-full lg:w-[520px]">
                <ActionBar
                  contextLabel={`Disciplina: ${viewData.disciplina}`}
                  moodleUrl={disciplineData.rows[0]?.moodleUrl || undefined}
                  onExportPDF={async () => {
                    const baseId = disciplineData.rows[0]?.id ?? decodedId;
                    const disciplineSlug = slugify(viewData.disciplina);
                    const filenamePrefix = `disciplina-${baseId}-${disciplineSlug}`;
                    const filename = `${filenamePrefix}.pdf`;

                    const lines: string[] = [];
                    if (localFilters.dateFrom || localFilters.dateTo) {
                      lines.push(
                        `Datas: ${localFilters.dateFrom ?? '—'} até ${localFilters.dateTo ?? '—'}`
                      );
                    }
                    if (localFilters.classification.length) {
                      lines.push(
                        `Classificação agregada: ${localFilters.classification.join(', ')}`
                      );
                    }
                    if (localFilters.likertMin !== null || localFilters.likertMax !== null) {
                      lines.push(
                        `Média Likert: ${localFilters.likertMin ?? '—'} até ${localFilters.likertMax ?? '—'}`
                      );
                    }
                    if (localFilters.favorability !== 'all') {
                      const map: Record<Exclude<LocalFavorability, 'all'>, string> = {
                        favorable: 'Favorável (4-5)',
                        neutral: 'Neutra (3)',
                        unfavorable: 'Desfavorável (1-2)',
                      };
                      lines.push(
                        `Favorabilidade: ${
                          map[
                            localFilters.favorability as Exclude<
                              LocalFavorability,
                              'all'
                            >
                          ]
                        }`
                      );
                    }
                    if (localFilters.onlyWithComment) lines.push('Somente com comentário');
                    if (localFilters.onlyCritical) lines.push('Somente críticas');
                    if (localFilters.onlyFavorable) lines.push('Somente favoráveis');

                    exportDisciplinePDF({
                      disciplineName: viewData.disciplina,
                      id: baseId,
                      centro: viewData.centro,
                      rows: viewData.rows,
                      filename,
                      globalSummary: data?.summary as DashboardSummary,
                      benchmarkByQuestion: disciplineData.byQuestion,
                      viewMetrics: {
                        totalResponses: viewData.totalResponses,
                        likertAverage: viewData.likertAverage,
                        favorableRate: viewData.favorableRate,
                        neutralRate: viewData.neutralRate,
                        unfavorableRate: viewData.unfavorableRate,
                        dominantClassification: viewData.dominantClassification,
                        likertDistribution: viewData.likertDistribution,
                        byQuestion: viewData.byQuestion,
                      },
                      comments: viewData.comments.map((c) => ({ text: c.text, date: c.date })),
                      filters: { label: 'Filtros locais', lines },
                    });
                  }}
                  onExportCSV={async () => {
                    const baseId = disciplineData.rows[0]?.id ?? decodedId;
                    const disciplineSlug = slugify(viewData.disciplina);
                    const filenamePrefix = `disciplina-${baseId}-${disciplineSlug}`;
                    exportToCSV(viewData.rows, filenamePrefix);
                  }}
                  onExportXLSX={async () => {
                    const baseId = disciplineData.rows[0]?.id ?? decodedId;
                    const localSummary = computeSummary(viewData.rows);
                    const disciplineSlug = slugify(viewData.disciplina);
                    const filenamePrefix = `disciplina-${baseId}-${disciplineSlug}`;
                    exportToXLSX(viewData.rows, localSummary, filenamePrefix);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Filtros locais */}
        <Card className="rounded-xl border border-surface-300 bg-surface-50/40">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={localFilters.onlyWithComment}
                      onCheckedChange={(v) =>
                        setLocalFilters((p) => ({ ...p, onlyWithComment: Boolean(v) }))
                      }
                      id="lf-only-comment"
                    />
                    <label htmlFor="lf-only-comment" className="text-xs font-medium text-surface-700">
                      Só com comentário
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={localFilters.onlyCritical}
                      onCheckedChange={(v) =>
                        setLocalFilters((p) => ({ ...p, onlyCritical: Boolean(v) }))
                      }
                      id="lf-only-critical"
                    />
                    <label htmlFor="lf-only-critical" className="text-xs font-medium text-surface-700">
                      Só críticas
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={localFilters.onlyFavorable}
                      onCheckedChange={(v) =>
                        setLocalFilters((p) => ({ ...p, onlyFavorable: Boolean(v) }))
                      }
                      id="lf-only-favorable"
                    />
                    <label htmlFor="lf-only-favorable" className="text-xs font-medium text-surface-700">
                      Só favoráveis
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-start gap-2">
                    <div className="pt-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                        Classificação
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['Excelente', 'Bom', 'Regular', 'Crítico'] as SentimentLabel[]).map((lbl) => (
                        <label key={lbl} className="flex items-center gap-2 text-xs text-surface-700">
                          <Checkbox
                            checked={localFilters.classification.includes(lbl)}
                            onCheckedChange={(v) =>
                              setLocalFilters((p) => {
                                const checked = Boolean(v);
                                const next = checked
                                  ? [...p.classification, lbl]
                                  : p.classification.filter((x) => x !== lbl);
                                return { ...p, classification: next };
                              })
                            }
                          />
                          {lbl}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-[180px]">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                        Favorabilidade
                      </span>
                      <Select
                        value={localFilters.favorability}
                        onValueChange={(v) => setLocalFilters((p) => ({ ...p, favorability: v as LocalFavorability }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="favorable">Favorável (4-5)</SelectItem>
                          <SelectItem value="neutral">Neutra (3)</SelectItem>
                          <SelectItem value="unfavorable">Desfavorável (1-2)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="min-w-[240px]">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                        Faixa média Likert
                      </span>
                      <div className="flex gap-2">
                        <Select
                          value={localFilters.likertMin === null ? 'none' : String(localFilters.likertMin)}
                          onValueChange={(v) => setLocalFilters((p) => ({ ...p, likertMin: v === 'none' ? null : Number(v) }))}
                        >
                          <SelectTrigger className="h-8 flex-1 text-xs">
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Min —</SelectItem>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={localFilters.likertMax === null ? 'none' : String(localFilters.likertMax)}
                          onValueChange={(v) => setLocalFilters((p) => ({ ...p, likertMax: v === 'none' ? null : Number(v) }))}
                        >
                          <SelectTrigger className="h-8 flex-1 text-xs">
                            <SelectValue placeholder="Max" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Max —</SelectItem>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-surface-600">
                    Mostrando {viewData.totalResponses} de {disciplineData.totalResponses} linhas
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setExpandedLocalFilters((v) => !v)}
                  aria-expanded={expandedLocalFilters}
                >
                  {expandedLocalFilters ? 'Ocultar' : 'Mais'} filtros de data
                </Button>
              </div>
            </div>

            {expandedLocalFilters && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                    Data início
                  </span>
                  <Input
                    type="date"
                    value={localFilters.dateFrom ?? ''}
                    onChange={(e) =>
                      setLocalFilters((p) => ({ ...p, dateFrom: e.target.value || null }))
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                    Data fim
                  </span>
                  <Input
                    type="date"
                    value={localFilters.dateTo ?? ''}
                    onChange={(e) =>
                      setLocalFilters((p) => ({ ...p, dateTo: e.target.value || null }))
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                    Limpar
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() =>
                      setLocalFilters({
                        dateFrom: null,
                        dateTo: null,
                        classification: [],
                        likertMin: null,
                        likertMax: null,
                        favorability: 'all',
                        onlyWithComment: false,
                        onlyCritical: false,
                        onlyFavorable: false,
                      })
                    }
                  >
                    Limpar filtros locais
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-surface-600">
                    Respostas
                  </p>
                  <p className="text-xl font-bold text-surface-900">
                    {formatNumber(viewData.totalResponses)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-unicv-green/15">
                  <Target className="h-5 w-5 text-unicv-green" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-surface-600">
                    Média Likert
                  </p>
                  <p className="text-xl font-bold text-surface-900">
                    {formatDecimal(viewData.likertAverage)} / 5
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-surface-600">
                    % Favorável
                  </p>
                  <p className="text-xl font-bold text-surface-900">
                    {formatPercent(viewData.favorableRate)}
                  </p>
                  <p className="mt-1 text-xs text-surface-600">
                    Neutro: {formatPercent(viewData.neutralRate)} • Desfavorável: {formatPercent(viewData.unfavorableRate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${SENTIMENT_COLORS[viewData.dominantClassification] ?? '#6B7280'}20`,
                  }}
                >
                  <Target
                    className="h-5 w-5"
                    style={{
                      color: SENTIMENT_COLORS[viewData.dominantClassification] ?? '#6B7280',
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-surface-600">
                    Classificação agregada
                  </p>
                  <Badge variant={SENTIMENT_VARIANT[viewData.dominantClassification]}>
                    {viewData.dominantClassification}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benchmark insight */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {aboveAvg ? (
              <TrendingUp className="h-6 w-6 shrink-0 text-unicv-green" />
            ) : (
              <TrendingDown className="h-6 w-6 shrink-0 text-unicv-gold" />
            )}
            <div>
              <p className="font-medium text-surface-900">
                {aboveAvg
                  ? 'Acima da média institucional'
                  : 'Abaixo da média institucional'}
              </p>
              <p className="text-sm text-surface-600">
                Média da disciplina: {formatDecimal(viewData.likertAverage)} • Média
                global: {formatDecimal(globalAvg)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Automatic insights */}
        {insights.length > 0 && (
          <Card className="border-unicv-gold/30 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-unicv-gold" />
                Insights automáticos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1 text-sm text-surface-700">
                {insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-unicv-gold">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Média por Pergunta */}
        <Card>
          <CardHeader>
            <CardTitle>Média por Pergunta</CardTitle>
            <CardDescription>
              Comparação com a média global ({formatDecimal(globalAvg)})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 100, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                  <XAxis
                    type="number"
                    domain={[0, 5]}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={{ stroke: CHART_GRID_STROKE }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={95}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E5EB',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [formatDecimal(value), 'Média Likert']}
                    labelFormatter={(label) => label}
                  />
                  <ReferenceLine
                    x={globalAvg}
                    stroke="#D99528"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <Bar
                    dataKey="value"
                    fill={UNICV_GREEN}
                    radius={[0, 4, 4, 0]}
                    name="Média Likert"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição Likert */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Likert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={viewData.likertDistribution}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      label={({ label, percentage }) =>
                        percentage > 0 ? `${label} ${percentage}%` : ''
                      }
                    >
                      {viewData.likertDistribution.map((entry, i) => (
                        <Cell
                          key={entry.label}
                          fill={LIKERT_COLORS[entry.label] ?? '#9CA3AF'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E2E5EB',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number, name: string) =>
                        [`${value}`, name]
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-1 flex-wrap gap-2">
                {viewData.likertDistribution.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2"
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: LIKERT_COLORS[s.label] ?? '#9CA3AF',
                      }}
                    />
                    <span className="text-sm font-medium text-surface-800">
                      {s.label}
                    </span>
                    <span className="text-xs text-surface-600">
                      {s.count} ({formatDecimal(s.percentage)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comentários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentários
            </CardTitle>
            <CardDescription>
                    {viewData.comments.length} comentário(s) para esta disciplina
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewData.comments.length === 0 ? (
              <p className="py-8 text-center text-sm text-surface-600">
                Nenhum comentário registrado.
              </p>
            ) : (
              <ul className="space-y-3">
                {viewData.comments.map((c) => {
                  const isLong = c.text.length > 150;
                  const isExpanded = expandedComments.has(c.index);
                  const displayText =
                    isLong && !isExpanded ? c.text.slice(0, 150) + '…' : c.text;

                  return (
                    <li
                      key={c.index}
                      className="rounded-lg border border-surface-200 bg-surface-50 p-3"
                    >
                      <p className="whitespace-pre-wrap text-sm text-surface-800">
                        {displayText}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-surface-500">
                          {formatDateBR(c.date)}
                        </span>
                        {isLong && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => toggleComment(c.index)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                Recolher
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                Expandir
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

function DisciplineDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default DisciplineDetailPage;
