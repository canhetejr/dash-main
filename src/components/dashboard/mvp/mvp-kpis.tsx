import type { SurveyAggregation } from '@/lib/supabase-transform';
import { Users, BookOpen, Building2, TrendingUp, ThumbsUp, Minus, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  support?: string;
  icon: React.ReactNode;
  iconBg?: string;
  /** Barra de cor contextual no topo do card */
  accent?: 'green' | 'blue' | 'violet' | 'cyan' | 'amber' | 'red';
}

const ACCENT_BAR: Record<string, string> = {
  green:  'from-emerald-400 to-emerald-600',
  blue:   'from-blue-400 to-blue-600',
  violet: 'from-violet-400 to-violet-600',
  cyan:   'from-cyan-400 to-cyan-500',
  amber:  'from-amber-400 to-amber-500',
  red:    'from-red-400 to-red-500',
};

function KpiCard({ label, value, support, icon, iconBg = 'bg-unicive-green-pale text-unicive-green', accent }: KpiCardProps) {
  return (
    <div className="relative card-institution group flex flex-col overflow-hidden">
      {/* Topo colorido — 3px accent strip */}
      {accent && (
        <div className={cn('h-[3px] w-full bg-gradient-to-r shrink-0', ACCENT_BAR[accent])} aria-hidden />
      )}
      <div className="px-3.5 py-3 flex flex-col gap-2 flex-1">
        {/* Label + ícone */}
        <div className="flex items-start justify-between gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-surface-400 leading-tight">{label}</span>
          <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md', iconBg)}>
            {icon}
          </div>
        </div>

        {/* Valor */}
        <div
          className="text-[22px] font-extrabold tracking-tight text-surface-900 leading-none tabular-nums"
          style={{ fontFamily: 'var(--font-kumbh, "Kumbh Sans", sans-serif)' }}
        >
          {value}
        </div>

        {/* Suporte */}
        {support && (
          <p className="text-[10px] text-surface-400 leading-tight">{support}</p>
        )}
      </div>
    </div>
  );
}

export function MvpKpis({ aggregation }: { aggregation: SurveyAggregation }) {
  const fav  = (aggregation.distribution.favorableRate  * 100).toFixed(1);
  const neu  = (aggregation.distribution.neutralRate    * 100).toFixed(1);
  const desf = (aggregation.distribution.unfavorableRate * 100).toFixed(1);

  const avgColor =
    aggregation.likertAverage >= 4 ? 'green' :
    aggregation.likertAverage >= 3 ? 'amber' : 'red';

  return (
    <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4 xl:grid-cols-7" role="region" aria-label="Indicadores principais">
      <KpiCard
        accent="blue"
        label="Respostas"
        value={aggregation.totalResponses.toLocaleString('pt-BR')}
        icon={<Users className="h-3.5 w-3.5" aria-hidden />}
        iconBg="bg-blue-50 text-blue-600"
      />

      <KpiCard
        accent="violet"
        label="Disciplinas"
        value={aggregation.uniqueDisciplinas.toLocaleString('pt-BR')}
        support="avaliadas"
        icon={<BookOpen className="h-3.5 w-3.5" aria-hidden />}
        iconBg="bg-violet-50 text-violet-600"
      />

      <KpiCard
        accent="cyan"
        label="Centros"
        value={aggregation.uniqueCentros.toLocaleString('pt-BR')}
        icon={<Building2 className="h-3.5 w-3.5" aria-hidden />}
        iconBg="bg-cyan-50 text-cyan-600"
      />

      <KpiCard
        accent={avgColor}
        label="Média Likert"
        value={
          <span>
            {aggregation.likertAverage.toFixed(2)}
            <span className="ml-0.5 text-[14px] font-medium text-surface-400">/5</span>
          </span>
        }
        support={aggregation.classificationBadge}
        icon={<TrendingUp className="h-3.5 w-3.5" aria-hidden />}
        iconBg={
          aggregation.likertAverage >= 4 ? 'bg-emerald-50 text-emerald-600' :
          aggregation.likertAverage >= 3 ? 'bg-amber-50 text-amber-600' :
          'bg-red-50 text-red-600'
        }
      />

      <KpiCard
        accent="green"
        label="Favorável"
        value={`${fav}%`}
        icon={<ThumbsUp className="h-3.5 w-3.5" aria-hidden />}
        iconBg="bg-emerald-50 text-emerald-600"
      />

      <KpiCard
        accent="amber"
        label="Neutro"
        value={`${neu}%`}
        icon={<Minus className="h-3.5 w-3.5" aria-hidden />}
        iconBg="bg-amber-50 text-amber-600"
      />

      <KpiCard
        accent="red"
        label="Desfavorável"
        value={`${desf}%`}
        icon={<TrendingDown className="h-3.5 w-3.5" aria-hidden />}
        iconBg="bg-red-50 text-red-600"
      />
    </div>
  );
}
