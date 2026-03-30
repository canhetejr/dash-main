'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Area,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDecimal, formatNumber, formatMonthLabel } from '@/lib/formatters';
import { QUESTION_LABELS } from '@/lib/constants';
import type { DashboardData } from '@/types/survey';

interface Props { data: DashboardData | null; isLoading: boolean; }

const H = 260;
const tip = { backgroundColor: '#fff', border: '1px solid #E2E5EB', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '8px 12px', fontSize: '12px', color: '#374151' };
const ax = { fontSize: 11, fill: '#6B7280' };
const grid = '#E2E5EB';

function Empty() {
  return <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-surface-300 text-sm text-surface-500">Sem dados</div>;
}

function C({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-[13px] font-semibold text-surface-700">{title}</CardTitle>
        {subtitle ? <p className="mt-1 text-xs text-surface-600">{subtitle}</p> : null}
      </CardHeader>
      <CardContent className="pb-4 pt-0">{children}</CardContent>
    </Card>
  );
}

export function ChartsSection({ data, isLoading }: Props) {
  if (isLoading) return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <Skeleton className="h-[260px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const bc = data?.byCentro ?? [];
  const ts = data?.timeSeries ?? [];
  const bq = data?.byQuestion ?? [];
  const byDisc = data?.byDisciplina ?? [];

  const globalLikertAverage = data?.summary?.likertAverage ?? 0;

  const canonicalCentroShort = (centroDisplay: string) => {
    const parts = centroDisplay.split('—');
    return parts[0]?.trim() || centroDisplay;
  };

  const worstByAvg = [...byDisc].sort((a, b) => a.likertAverage - b.likertAverage).slice(0, 5);
  const topByVolume = [...byDisc].sort((a, b) => b.totalResponses - a.totalResponses).slice(0, 5);

  const centrosByMean = [...bc].sort((a, b) => b.likertAverage - a.likertAverage);
  const centrosByFavor = [...bc].sort((a, b) => b.favorableRate - a.favorableRate);
  const questionsByWorstMean = [...bq].sort((a, b) => a.avgScore - b.avgScore);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" role="region" aria-label="Gráficos">
      {/* Média Likert por Centro (canônico) */}
      <C
        title="Média Likert por centro"
        subtitle="Likert 1..5 (maior para menor)"
      >
        {bc.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={H}>
            <BarChart
              data={centrosByMean
                .map((d) => ({
                  centro: canonicalCentroShort(d.centro),
                  full: d.centro,
                  avg: d.likertAverage,
                }))
                .sort((a, b) => b.avg - a.avg)}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 5]}
                tick={ax}
                tickFormatter={(v) => formatDecimal(v)}
              />
              <YAxis type="category" dataKey="centro" width={110} tick={{ ...ax, fontSize: 10 }} />
              <Tooltip
                contentStyle={tip}
                formatter={(v: number) => [formatDecimal(v), 'Média Likert']}
                labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ''}
              />
              <Bar
                dataKey="avg"
                fill="#D99528"
                radius={[0, 6, 6, 0]}
                label={{
                  position: 'right',
                  formatter: (v: number) => formatDecimal(v),
                  fill: '#6B7280',
                  fontSize: 11,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </C>

      {/* Favorabilidade por centro */}
      <C
        title="Favorabilidade por centro"
        subtitle="% favorável consolidado (Likert 4 ou 5)"
      >
        {bc.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={H}>
            <BarChart
              data={centrosByFavor
                .map((d) => ({
                  centro: canonicalCentroShort(d.centro),
                  v: d.favorableRate,
                  full: d.centro,
                }))
                .sort((a, b) => b.v - a.v)}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 1]}
                tick={ax}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              />
              <YAxis type="category" dataKey="centro" width={110} tick={{ ...ax, fontSize: 10 }} />
              <Tooltip
                contentStyle={tip}
                formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, '% favorável']}
                labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ''}
              />
              <Bar
                dataKey="v"
                fill="#4E6930"
                radius={[0, 6, 6, 0]}
                label={{
                  position: 'right',
                  formatter: (v: number) => `${(v * 100).toFixed(0)}%`,
                  fill: '#6B7280',
                  fontSize: 11,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </C>

      <div className="lg:col-span-2">
        <C
          title="Média Likert por pergunta"
          subtitle={`Benchmark global: ${formatDecimal(globalLikertAverage)} (Likert 1..5)`}
        >
          {bq.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={H}>
              <BarChart
                data={questionsByWorstMean.map((q) => ({
                  question: QUESTION_LABELS[q.questionKey] ?? q.question,
                  avg: q.avgScore,
                }))}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={ax} tickFormatter={(v) => formatDecimal(v)} />
                <YAxis type="category" dataKey="question" width={220} tick={{ ...ax, fontSize: 10 }} />
                <Tooltip contentStyle={tip} formatter={(v: number) => [formatDecimal(v), 'Média Likert']} />
                <ReferenceLine x={globalLikertAverage} stroke="#6B7280" strokeDasharray="4 4" strokeWidth={1.2} />
                <Bar
                  dataKey="avg"
                  fill="#4E6930"
                  radius={[0, 6, 6, 0]}
                  label={{
                    position: 'right',
                    formatter: (v: number) => formatDecimal(v),
                    fill: '#6B7280',
                    fontSize: 11,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </C>
      </div>

      <div className="lg:col-span-2">
        <C title="Evolução temporal" subtitle="Média Likert e volume por período">
          {ts.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-surface-200 bg-surface-50/40 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-surface-700">Média Likert</div>
                  <div className="text-[11px] text-surface-500">
                    Atual: <span className="font-medium text-surface-900">{formatDecimal(ts[ts.length - 1]?.likertAverage ?? 0)}</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <ComposedChart
                    data={ts.map((d) => ({ label: formatMonthLabel(d.period), avg: d.likertAverage }))}
                    margin={{ top: 8, right: 24, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                    <XAxis dataKey="label" tick={ax} />
                    <YAxis tick={ax} domain={[0, 5]} />
                    <Tooltip contentStyle={tip} formatter={(v: number) => [formatDecimal(v), 'Média Likert']} />
                    <Line type="monotone" dataKey="avg" name="Média Likert" stroke="#D99528" strokeWidth={2} dot={{ r: 2.5, fill: '#D99528' }} />
                    <ReferenceLine y={globalLikertAverage} stroke="#6B7280" strokeDasharray="4 4" strokeWidth={1.2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-lg border border-surface-200 bg-surface-50/40 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-surface-700">Volume de respostas</div>
                  <div className="text-[11px] text-surface-500">
                    Atual: <span className="font-medium text-surface-900">{formatNumber(ts[ts.length - 1]?.totalResponses ?? 0)}</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <ComposedChart
                    data={ts.map((d) => ({ label: formatMonthLabel(d.period), resp: d.totalResponses }))}
                    margin={{ top: 8, right: 24, left: 0, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="gRespHome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4E6930" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#4E6930" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                    <XAxis dataKey="label" tick={ax} />
                    <YAxis tick={ax} />
                    <Tooltip contentStyle={tip} formatter={(v: number) => [formatNumber(v), 'Respostas']} />
                    <Area type="monotone" dataKey="resp" name="Respostas" stroke="#4E6930" fill="url(#gRespHome)" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </C>
      </div>

      <div className="lg:col-span-2">
        {/* Ranking gerencial */}
        <C title="Disciplinas com atenção" subtitle="Piores médias Likert e maior volume de respostas">
          {byDisc.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                Piores médias
              </div>
              <div className="space-y-2">
                {worstByAvg.map((d) => (
                  <div key={`${d.disciplina}-${d.id}`} className="flex items-start justify-between gap-3 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-surface-900">{d.disciplina}</div>
                      <div className="mt-0.5 text-[11px] text-surface-500">{canonicalCentroShort(d.centro)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-surface-900">{formatDecimal(d.likertAverage)} / 5</div>
                      <div className="mt-0.5 text-[11px] text-surface-600">{formatNumber(d.totalResponses)} resp.</div>
                      <Badge variant={d.classificationBadge === 'Excelente' ? 'success' : d.classificationBadge === 'Bom' ? 'default' : d.classificationBadge === 'Regular' ? 'warning' : 'destructive'}>{d.classificationBadge}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                Maior volume
              </div>
              <div className="space-y-2">
                {topByVolume.map((d) => (
                  <div key={`${d.disciplina}-${d.id}`} className="flex items-start justify-between gap-3 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-surface-900">{d.disciplina}</div>
                      <div className="mt-0.5 text-[11px] text-surface-500">{canonicalCentroShort(d.centro)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-surface-900">{formatNumber(d.totalResponses)} resp.</div>
                      <div className="mt-0.5 text-[11px] text-surface-600">{formatDecimal(d.likertAverage)} média</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
          )}
        </C>
      </div>
    </div>
  );
}
