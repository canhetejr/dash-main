'use client';

import { useMemo, useState } from 'react';
import { MessageSquare, Search, ChevronDown, ChevronUp, AlertCircle, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDateBR } from '@/lib/formatters';
import type { SurveyRow, SentimentLabel } from '@/types/survey';
import { CENTRO_CANONICO_SIGLA_SET } from '@/lib/centro';
import { ActionBar } from '@/components/dashboard/action-bar';
import { exportCommentsToCSV, exportCommentsToXLSX } from '@/lib/export-comments';
import { exportCommentsPDF } from '@/lib/pdf';
import { formatDateTimeForFilename } from '@/lib/slugify';

interface Props { rows: SurveyRow[]; isLoading: boolean; }

const BV: Record<SentimentLabel, 'success' | 'default' | 'warning' | 'destructive'> = {
  Excelente: 'success', Bom: 'default', Regular: 'warning', Crítico: 'destructive',
};
const PG = 20;

export function CommentsPanel({ rows, isLoading }: Props) {
  const [search, setSearch] = useState('');
  const [sent, setSent] = useState('all');
  const [centro, setCentro] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(PG);

  const comments = useMemo(() => rows.filter((r) => (r.suggestion ?? '').trim().length > 0), [rows]);
  const centros = useMemo(() => {
    const map = new Map<string, string>();
    comments.forEach((c) => {
      if (!c.centroSigla) return;
      if (!CENTRO_CANONICO_SIGLA_SET.has(c.centroSigla)) return;
      map.set(c.centroSigla, c.centroDisplay);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [comments]);

  const filtered = useMemo(() => comments.filter((r) => {
    if (sent !== 'all' && r.sentimentLabel !== sent) return false;
    if (centro !== 'all' && r.centroSigla !== centro) return false;
    if (search && !`${r.suggestion} ${r.disciplina} ${r.centroDisplay}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [comments, sent, centro, search]);

  const shown = useMemo(() => filtered.slice(0, visible), [filtered, visible]);
  const criticals = useMemo(() => filtered.filter((r) => r.sentimentLabel === 'Crítico').length, [filtered]);

  const tog = (k: string) => setExpanded((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  if (isLoading) return <Card><CardContent className="p-5 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</CardContent></Card>;

  return (
    <div className="space-y-4">
      <ActionBar
        contextLabel="Comentários"
        onExportPDF={async () => {
          const filename = 'comentarios-filtrados';
          const lines: string[] = [];
          if (sent !== 'all') lines.push(`Classificação: ${sent}`);
          if (centro !== 'all') lines.push(`Centro: ${centro}`);
          if (search) lines.push(`Busca: "${search}"`);
          exportCommentsPDF({
            filename: `${filename}.pdf`,
            rows: filtered,
            filters: { label: 'Filtros aplicados', lines },
          });
        }}
        onExportCSV={async () => {
          const filename = 'comentarios-filtrados';
          exportCommentsToCSV(filtered, filename);
        }}
        onExportXLSX={async () => {
          const filename = 'comentarios-filtrados';
          exportCommentsToXLSX(filtered, filename);
        }}
      />

      {criticals > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
          <div><p className="text-sm font-medium text-red-800">{criticals} comentário{criticals > 1 ? 's' : ''} de avaliações críticas</p><p className="text-xs text-red-600">Feedbacks com média abaixo de 3.0</p></div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-surface-500" aria-hidden /> Comentários e Sugestões
            <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-500" aria-hidden />
              <Input placeholder="Buscar nos comentários..." value={search} onChange={(e) => { setSearch(e.target.value); setVisible(PG); }} className="h-8 pl-8 text-xs" aria-label="Buscar comentários" />
            </div>
            <div className="flex gap-2">
              <Select value={sent} onValueChange={(v) => { setSent(v); setVisible(PG); }}>
                <SelectTrigger className="h-8 w-[130px] text-xs"><Filter className="mr-1 h-3 w-3 text-surface-500" aria-hidden /><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">Classificação agregada</SelectItem><SelectItem value="Excelente">Excelente</SelectItem><SelectItem value="Bom">Bom</SelectItem><SelectItem value="Regular">Regular</SelectItem><SelectItem value="Crítico">Crítico</SelectItem></SelectContent>
              </Select>
              <Select value={centro} onValueChange={(v) => { setCentro(v); setVisible(PG); }}>
                <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Centro" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos</SelectItem>{centros.map(([sigla, display]) => <SelectItem key={sigla} value={sigla}>{sigla}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-surface-500"><MessageSquare className="mb-2 h-8 w-8" /><p className="text-sm">Nenhum comentário encontrado</p></div>
          ) : (
            <ul className="space-y-2" role="list">
              {shown.map((row, idx) => {
                const k = `${row.id}-${row.date}-${row.disciplina}-${idx}`;
                const isOpen = expanded.has(k);
                const long = row.suggestion.length > 140;
                const crit = row.sentimentLabel === 'Crítico';
                return (
                  <li
                    key={k}
                    className={cn(
                      'rounded-xl border p-4 transition-colors hover:border-unicv-green/25 hover:bg-unicv-green/[0.015]',
                      crit ? 'border-red-200 bg-red-50/40 hover:border-red-300' : 'border-surface-200 bg-white'
                    )}
                  >
                    <div className="mb-2.5 flex flex-wrap items-center gap-2">
                      <Badge variant={BV[row.sentimentLabel]}>{row.sentimentLabel}</Badge>
                      <span className="text-xs font-medium text-surface-700">{row.disciplina}</span>
                      <span className="hidden text-surface-300 sm:inline">·</span>
                      <span className="hidden text-xs text-surface-500 sm:inline">{row.centroSigla}</span>
                      <div className="ml-auto flex items-center gap-3">
                        <span className={cn('text-xs font-semibold tabular-nums', row.averageScore >= 4 ? 'text-unicv-green' : row.averageScore >= 3 ? 'text-amber-600' : 'text-red-600')}>
                          {row.averageScore.toFixed(1)}
                        </span>
                        <span className="text-[11px] text-surface-400">{formatDateBR(row.date)}</span>
                      </div>
                    </div>
                    <p className="text-[13px] leading-relaxed text-surface-700">{long && !isOpen ? row.suggestion.slice(0, 160).trim() + '…' : row.suggestion}</p>
                    {long && (
                      <button onClick={() => tog(k)} className="mt-1 flex items-center gap-0.5 text-xs font-medium text-unicv-green hover:text-unicv-green-light" aria-expanded={isOpen}>
                        {isOpen ? <><ChevronUp className="h-3 w-3" /> Menos</> : <><ChevronDown className="h-3 w-3" /> Mais</>}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {visible < filtered.length && (
            <div className="pt-1 text-center"><Button variant="outline" size="sm" onClick={() => setVisible((v) => v + PG)} className="text-xs">Mais ({filtered.length - visible} restantes)</Button></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
