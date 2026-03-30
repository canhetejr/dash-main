'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDecimal, formatPercent, formatNumber } from '@/lib/formatters';
import type { DisciplinaAggregate, SentimentLabel } from '@/types/survey';

interface Props {
  disciplinas: DisciplinaAggregate[];
}

type SortKey =
  | 'disciplina'
  | 'id'
  | 'centro'
  | 'totalResponses'
  | 'likertAverage'
  | 'favorableRate';
type Dir = 'asc' | 'desc';

const BADGE_V: Record<SentimentLabel, 'success' | 'default' | 'warning' | 'destructive'> = {
  Excelente: 'success',
  Bom: 'default',
  Regular: 'warning',
  Crítico: 'destructive',
};

export function DisciplinaTable({ disciplinas }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('likertAverage');
  const [sortDir, setSortDir] = useState<Dir>('desc');

  const filtered = useMemo(() => {
    let items = disciplinas;
    if (search) {
      const t = search.toLowerCase();
      items = items.filter((d) => `${d.disciplina} ${d.id} ${d.centro}`.toLowerCase().includes(t));
    }

    return [...items].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === 'string'
          ? av.localeCompare(String(bv))
          : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [disciplinas, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Disciplinas</CardTitle>
          <div className="relative max-w-xs flex-1">
            <Search
              className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-500"
              aria-hidden
            />
            <Input
              placeholder="Buscar disciplina..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-9 text-xs"
              aria-label="Buscar disciplinas"
            />
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-surface-500">
              <Search className="mb-2 h-8 w-8" />
              <p className="text-sm">Nenhuma disciplina encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-surface-300 bg-white scrollbar-thin">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-surface-300 bg-surface-100/70">
                    {(
                      [
                        ['disciplina', 'Disciplina'],
                        ['id', 'ID'],
                        ['centro', 'Centro'],
                        ['totalResponses', 'Respostas'],
                        ['likertAverage', 'Média Likert'],
                        ['favorableRate', '% Favorável'],
                      ] as [SortKey, string][]
                    ).map(([k, label]) => (
                      <th
                        key={k}
                        scope="col"
                        className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-surface-500 cursor-pointer select-none hover:text-surface-800 transition-colors"
                        onClick={() => toggleSort(k)}
                        aria-sort={
                          sortKey === k ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                        }
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          <SortIcon k={k} />
                        </span>
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                      Classificação agregada
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                      Moodle
                    </th>
                    <th scope="col" className="w-8 px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                      Ação
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((d, i) => (
                    <tr
                      key={`${d.disciplina}-${d.id}-${i}`}
                      className={cn(
                        'group cursor-pointer border-b border-surface-200 transition-colors hover:bg-unicv-green/[0.035] focus-visible:outline-none',
                        i % 2 === 1 && 'bg-surface-50/50'
                      )}
                      role="button"
                      tabIndex={0}
                      aria-label={`Abrir detalhes: ${d.disciplina} (${d.id})`}
                      onClick={() => router.push(`/dashboard/disciplina/${encodeURIComponent(d.id)}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/dashboard/disciplina/${encodeURIComponent(d.id)}`);
                        }
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-surface-900 max-w-[280px]">
                        <span className="block truncate group-hover:text-unicv-green transition-colors">
                          {d.disciplina}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-surface-600 font-mono text-xs">
                        {d.id}
                      </td>

                      <td className="px-4 py-3 text-surface-600">
                        {d.centro.includes('—') ? d.centro.split('—')[0].trim() : d.centro}
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums text-surface-700">
                        {formatNumber(d.totalResponses)}
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={cn(
                            'font-semibold',
                            d.likertAverage >= 4
                              ? 'text-unicv-green'
                              : d.likertAverage >= 3
                                ? 'text-amber-600'
                                : 'text-red-600'
                          )}
                        >
                          {formatDecimal(d.likertAverage)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums text-surface-700">
                        {formatPercent(d.favorableRate)}
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant={BADGE_V[d.classificationBadge]}>
                          {d.classificationBadge}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={!d.moodleUrl}
                                aria-label="Abrir no Moodle"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (d.moodleUrl) {
                                    window.open(d.moodleUrl, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                              >
                                <ExternalLink className="h-4 w-4 text-surface-500 group-hover:text-unicv-green transition-colors" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Abrir no Moodle</TooltipContent>
                        </Tooltip>
                      </td>

                      <td className="px-2 py-3" aria-hidden>
                        <ChevronRight className="h-4 w-4 text-surface-400 group-hover:text-unicv-green transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
