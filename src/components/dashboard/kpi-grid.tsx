'use client';

import { MessageSquareText, BookOpen, Building2, TrendingUp, ThumbsUp, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardSummary } from '@/types/survey';
import { formatNumber, formatDecimal, formatPercent } from '@/lib/formatters';

interface KPIGridProps { summary: DashboardSummary | null; isLoading: boolean; }

const KPIS = (s: DashboardSummary) => [
  { label: 'Respostas', value: formatNumber(s.totalResponses), icon: MessageSquareText, accent: 'bg-blue-50 text-blue-600' },
  { label: 'Disciplinas', value: formatNumber(s.uniqueDisciplines), sub: 'avaliadas', icon: BookOpen, accent: 'bg-violet-50 text-violet-600' },
  { label: 'Centros', value: formatNumber(s.uniqueCenters), icon: Building2, accent: 'bg-cyan-50 text-cyan-600' },
  {
    label: 'Média Likert',
    value: formatDecimal(s.likertAverage),
    sub: '/ 5.0',
    icon: TrendingUp,
    accent:
      s.likertAverage >= 4
        ? 'bg-emerald-50 text-emerald-600'
        : s.likertAverage >= 3
          ? 'bg-amber-50 text-amber-600'
          : 'bg-red-50 text-red-600',
  },
  { label: 'Favorável', value: formatPercent(s.favorableRate), icon: ThumbsUp, accent: 'bg-emerald-50 text-emerald-600' },
  { label: 'Neutro', value: formatPercent(s.neutralRate), icon: AlertTriangle, accent: 'bg-amber-50 text-amber-600' },
  { label: 'Desfavorável', value: formatPercent(s.unfavorableRate), icon: AlertTriangle, accent: 'bg-red-50 text-red-600' },
];

export function KPIGrid({ summary, isLoading }: KPIGridProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-surface-300 bg-white p-4"><Skeleton className="mb-3 h-8 w-8 rounded-lg" /><Skeleton className="mb-1 h-3 w-16" /><Skeleton className="h-6 w-12" /></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="region" aria-label="Indicadores">
      {KPIS(summary).map((k) => {
        const Icon = k.icon;
        return (
          <div key={k.label} className="rounded-xl border border-surface-300 bg-white px-4 py-4 transition-all hover:shadow-card hover:border-surface-400">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-500">{k.label}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-[26px] font-bold leading-none tracking-tight text-surface-900">{k.value}</span>
                  {k.sub && <span className="text-[11px] text-surface-400">{k.sub}</span>}
                </div>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.accent}`}>
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
