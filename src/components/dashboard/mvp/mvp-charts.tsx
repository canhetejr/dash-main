'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  ReferenceLine, LineChart, Line, PieChart, Pie, Legend,
  AreaChart, Area, ComposedChart
} from 'recharts';
import type { QuestionAggregation, TimeSeriesPoint } from '@/lib/supabase-transform';
import { AlertTriangle, TrendingDown, TrendingUp, Users } from 'lucide-react';

interface LikertDist {
  label: string;
  count: number;
  percentage: number;
}

interface ByCentroItem {
  centro: string;
  centroSigla: string;
  totalResponses: number;
  likertAverage: number;
  favorableRate: number;
  classificationBadge: string;
}

interface ByDisciplinaItem {
  disciplina: string;
  externalId: string;
  centro: string;
  totalResponses: number;
  likertAverage: number;
  favorableRate: number;
  classificationBadge: string;
}

// Unicive brand-aligned chart colors
const LIKERT_COLORS: Record<string, string> = {
  'Discordo Totalmente':   '#C0392B',
  'Discordo Parcialmente': '#E7972A',
  'Indiferente':           '#8A92A0',
  'Concordo Parcialmente': '#7EBD73',
  'Concordo Totalmente':   '#005941',
};

const tooltipStyle = {
  borderRadius: '10px',
  border: '1px solid rgba(0,89,65,0.10)',
  boxShadow: '0 4px 16px rgba(0,89,65,0.08)',
  fontFamily: 'var(--font-opensans, "Open Sans", sans-serif)',
  fontSize: '13px',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-surface-400 mt-0.5">
      {children}
    </p>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[15px] font-bold text-surface-900 leading-tight"
      style={{ fontFamily: 'var(--font-kumbh, "Kumbh Sans", sans-serif)' }}
    >
      {children}
    </h2>
  );
}

// ─── Component props ──────────────────────────────────────────────────────────

interface MvpChartsProps {
  likertDistribution: LikertDist[];
  byQuestion: QuestionAggregation[];
  byCentro?: ByCentroItem[];
  byDisciplina?: ByDisciplinaItem[];
  timeSeries?: TimeSeriesPoint[];
}

export function MvpCharts({ likertDistribution, byQuestion, byCentro = [], byDisciplina = [], timeSeries = [] }: MvpChartsProps) {
  // Top 5 disciplinas com piores médias
  const worstDisciplinas = [...byDisciplina]
    .sort((a, b) => a.likertAverage - b.likertAverage)
    .slice(0, 5);

  // Top 5 por volume
  const topVolumeDisc = [...byDisciplina]
    .sort((a, b) => b.totalResponses - a.totalResponses)
    .slice(0, 5);

  // Data for centro charts
  const centroChartData = byCentro.map(c => ({
    name: c.centroSigla || c.centro.split(' ')[0],
    media: Number(c.likertAverage.toFixed(2)),
    favoravel: Number((c.favorableRate * 100).toFixed(1)),
    respostas: c.totalResponses,
  }));

  // Pie chart data from likert distribution
  const pieData = likertDistribution.map(item => ({
    name: item.label,
    value: item.count,
    pct: item.percentage,
  }));

  return (
    <div className="space-y-4">

      {/* ── Row 1: Likert Dist + Média por Pergunta ─────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Distribuição Likert */}
        <div className="card-institution p-5">
          <div className="mb-5">
            <CardTitle>Distribuição de Respostas</CardTitle>
            <SectionLabel>Escala Likert — todas as questões</SectionLabel>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
            {Object.entries(LIKERT_COLORS).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: color }}
                  aria-hidden
                />
                <span className="text-[11px] text-surface-500">{label}</span>
              </div>
            ))}
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={likertDistribution} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" horizontal={false} stroke="#EFF1F5" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={148}
                  tick={{ fontSize: 11, fill: '#5C6472', fontFamily: 'var(--font-opensans, sans-serif)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(0,89,65,0.04)' }}
                  contentStyle={tooltipStyle}
                  formatter={(value: number, _name: string, props: { payload?: { percentage?: number } }) => [
                    `${value} respostas (${props.payload?.percentage ?? 0}%)`,
                    'Quantidade',
                  ]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={26}>
                  {likertDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={LIKERT_COLORS[entry.label] || '#CDD2DA'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Média por Pergunta */}
        <div className="card-institution p-5">
          <div className="mb-5">
            <CardTitle>Média por Pergunta</CardTitle>
            <SectionLabel>Escala de 1 a 5 — q1 a q6</SectionLabel>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byQuestion} margin={{ top: 4, right: 16, left: 0, bottom: 24 }}>
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#EFF1F5" />
                <XAxis
                  dataKey="questionKey"
                  tick={{ fill: '#5C6472', fontSize: 12, fontFamily: 'var(--font-opensans, sans-serif)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fill: '#8A92A0', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <ReferenceLine y={4} stroke="#7EBD73" strokeDasharray="3 5" strokeOpacity={0.7} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(0,89,65,0.04)' }}
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [(value as number).toFixed(2), 'Média']}
                  labelFormatter={(label) => {
                    const q = byQuestion.find(q => q.questionKey === label);
                    return q ? q.questionLabel : label;
                  }}
                />
                <Bar dataKey="avgScore" fill="#005941" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 2: Centros ─────────────────────────────────────────── */}
      {centroChartData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">

          {/* Média por Centro */}
          <div className="card-institution p-5">
            <div className="mb-5">
              <CardTitle>Média Likert por Centro</CardTitle>
              <SectionLabel>Score médio por unidade acadêmica</SectionLabel>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={centroChartData} margin={{ top: 4, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#EFF1F5" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#5C6472', fontSize: 11, fontFamily: 'var(--font-opensans, sans-serif)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    tick={{ fill: '#8A92A0', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={24}
                  />
                  <ReferenceLine y={4} stroke="#7EBD73" strokeDasharray="3 5" strokeOpacity={0.6} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(0,89,65,0.04)' }}
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [value.toFixed(2), 'Média']}
                  />
                  <Bar dataKey="media" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {centroChartData.map((entry, index) => (
                      <Cell
                        key={`centro-${index}`}
                        fill={entry.media >= 4 ? '#005941' : entry.media >= 3 ? '#E7972A' : '#C0392B'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Favorabilidade por Centro */}
          <div className="card-institution p-5">
            <div className="mb-5">
              <CardTitle>Favorabilidade por Centro</CardTitle>
              <SectionLabel>% de respostas favoráveis (4 e 5)</SectionLabel>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={centroChartData} margin={{ top: 4, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#EFF1F5" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#5C6472', fontSize: 11, fontFamily: 'var(--font-opensans, sans-serif)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fill: '#8A92A0', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <ReferenceLine y={70} stroke="#7EBD73" strokeDasharray="3 5" strokeOpacity={0.6} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(0,89,65,0.04)' }}
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Favorável']}
                  />
                  <Bar dataKey="favoravel" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {centroChartData.map((entry, index) => (
                      <Cell
                        key={`fav-${index}`}
                        fill={entry.favoravel >= 70 ? '#005941' : entry.favoravel >= 50 ? '#E7972A' : '#C0392B'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Row 3: Volume por Centro + Atenção ─────────────────────── */}
      {centroChartData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Volume de Respostas por Centro */}
          <div className="card-institution p-5">
            <div className="mb-5">
              <CardTitle>Volume de Respostas por Centro</CardTitle>
              <SectionLabel>Total de participações por unidade</SectionLabel>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={centroChartData} margin={{ top: 4, right: 8, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#005941" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#005941" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#EFF1F5" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#5C6472', fontSize: 11, fontFamily: 'var(--font-opensans, sans-serif)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#8A92A0', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <RechartsTooltip
                    cursor={{ stroke: '#005941', strokeWidth: 1, strokeOpacity: 0.2 }}
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Respostas']}
                  />
                  <Area
                    type="monotone"
                    dataKey="respostas"
                    stroke="#005941"
                    strokeWidth={2}
                    fill="url(#volGradient)"
                    dot={{ fill: '#005941', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#005941' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Disciplinas com Atenção */}
          {byDisciplina.length > 0 && (
            <div className="card-institution p-5">
              <div className="mb-5 flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-50 mt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden />
                </div>
                <div>
                  <CardTitle>Disciplinas com Atenção</CardTitle>
                  <SectionLabel>Piores médias — requer acompanhamento</SectionLabel>
                </div>
              </div>
              <div className="space-y-2">
                {worstDisciplinas.map((d, i) => (
                  <div
                    key={d.disciplina}
                    className="flex items-center gap-3 rounded-lg border border-surface-100 bg-surface-50/50 px-3 py-2.5 transition-colors hover:bg-surface-50"
                  >
                    <span className="text-[11px] font-bold text-surface-400 w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-surface-800 truncate">{d.disciplina}</p>
                      <p className="text-[11px] text-surface-400">{d.totalResponses} respostas</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`text-[14px] font-bold tabular-nums ${
                        d.likertAverage < 3 ? 'text-red-600' : d.likertAverage < 3.5 ? 'text-amber-600' : 'text-surface-700'
                      }`}>
                        {d.likertAverage.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Row 4: Donut se disciplina filtrada / Top Volume ───────── */}
      {byDisciplina.length > 1 && (
        <div className="card-institution p-5">
          <div className="mb-5">
            <CardTitle>Maiores Volumes por Disciplina</CardTitle>
            <SectionLabel>Top 5 disciplinas por número de respostas</SectionLabel>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topVolumeDisc}
                layout="vertical"
                margin={{ left: 0, right: 48, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 4" horizontal={false} stroke="#EFF1F5" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="disciplina"
                  type="category"
                  width={200}
                  tick={{ fontSize: 11, fill: '#5C6472', fontFamily: 'var(--font-opensans, sans-serif)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 28) + '…' : v}
                />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(0,89,65,0.04)' }}
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Respostas']}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="totalResponses" fill="#7EBD73" radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Row 5: Evolução Temporal ───────────────────────────────── */}
      {timeSeries.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Média Likert Temporal */}
          <div className="card-institution p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <CardTitle>Evolução da Média Likert</CardTitle>
                <SectionLabel>Tendência por período</SectionLabel>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-surface-500">Média atual</div>
                <div className="text-lg font-bold text-surface-900 leading-none">
                  {timeSeries[timeSeries.length - 1]?.likertAverage.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#EFF1F5" />
                  <XAxis dataKey="period" tick={{ fill: '#5C6472', fontSize: 11, fontFamily: 'var(--font-opensans, sans-serif)' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.split('-').reverse().join('/')} />
                  <YAxis domain={[1, 5]} tick={{ fill: '#8A92A0', fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                  <RechartsTooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toFixed(2), 'Média Likert']} />
                  <Line type="monotone" dataKey="likertAverage" stroke="#E7972A" strokeWidth={2.5} dot={{ r: 4, fill: '#E7972A', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume de Respostas Temporal */}
          <div className="card-institution p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <CardTitle>Volume de Respostas</CardTitle>
                <SectionLabel>Participação ao longo do tempo</SectionLabel>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-surface-500">Volume atual</div>
                <div className="text-lg font-bold text-surface-900 leading-none">
                  {timeSeries[timeSeries.length - 1]?.totalResponses.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRespHome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#005941" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#005941" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#EFF1F5" />
                  <XAxis dataKey="period" tick={{ fill: '#5C6472', fontSize: 11, fontFamily: 'var(--font-opensans, sans-serif)' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.split('-').reverse().join('/')} />
                  <YAxis tick={{ fill: '#8A92A0', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <RechartsTooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Respostas']} />
                  <Area type="monotone" dataKey="totalResponses" stroke="#005941" strokeWidth={2.5} fill="url(#gRespHome)" dot={{ r: 4, fill: '#005941', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
