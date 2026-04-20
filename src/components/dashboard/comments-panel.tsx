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
import type { TransformedSurveyRow } from '@/lib/supabase-transform';
import type { SentimentLabel } from '@/types/survey';
import { CENTRO_CANONICO_SIGLA_SET } from '@/lib/centro';
import { ActionBar } from '@/components/dashboard/action-bar';
import { exportCommentsToCSV, exportCommentsToXLSX } from '@/lib/export-comments';
import { exportCommentsPDF } from '@/lib/pdf';

interface Props { 
  rows: TransformedSurveyRow[]; 
  isLoading: boolean;
  initialCentro?: string;
  initialDisciplina?: string;
}

const BV: Record<SentimentLabel, 'success' | 'default' | 'warning' | 'destructive'> = {
  Excelente: 'success', Bom: 'default', Regular: 'warning', Crítico: 'destructive',
};
const PG = 20;

export function CommentsPanel({ rows, isLoading, initialCentro, initialDisciplina }: Props) {
  const [search, setSearch] = useState('');
  const [sent, setSent] = useState('all');
  const [centro, setCentro] = useState(initialCentro || 'all');
  const [disciplina, setDisciplina] = useState(initialDisciplina || 'all');
  const [periodo, setPeriodo] = useState('all');
  const [score, setScore] = useState('all');
  
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

  const disciplinas = useMemo(() => {
    const set = new Set<string>();
    comments.forEach((c) => {
      if (c.disciplina) set.add(c.disciplina);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [comments]);

  const filtered = useMemo(() => {
    const now = new Date();
    
    return comments.filter((r) => {
      if (sent !== 'all' && r.classificationBadge !== sent) return false;
      if (centro !== 'all' && r.centroSigla !== centro) return false;
      if (disciplina !== 'all' && r.disciplina !== disciplina) return false;
      
      if (score !== 'all') {
        if (score === '>=4' && r.likertAverage < 4.0) return false;
        if (score === '>=3' && r.likertAverage < 3.0) return false;
        if (score === '<3' && r.likertAverage >= 3.0) return false;
      }
      
      if (periodo !== 'all') {
        const dDate = new Date(r.submittedAt);
        const diffDays = (now.getTime() - dDate.getTime()) / (1000 * 3600 * 24);
        if (periodo === '7d' && diffDays > 7) return false;
        if (periodo === '30d' && diffDays > 30) return false;
        if (periodo === '90d' && diffDays > 90) return false;
      }

      if (search && !`${r.suggestion || ''} ${r.disciplina || ''} ${r.centroDisplay || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
      
      return true;
    });
  }, [comments, sent, centro, disciplina, search, score, periodo]);

  const shown = useMemo(() => filtered.slice(0, visible), [filtered, visible]);
  const criticals = useMemo(() => filtered.filter((r) => r.classificationBadge === 'Crítico').length, [filtered]);

  const tog = (k: string) => setExpanded((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  if (isLoading) return <Card className="border-surface-200 shadow-none"><CardContent className="p-5 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 bg-surface-100" />)}</CardContent></Card>;

  return (
    <div className="space-y-4">
      {/* Action Bar ensures standard export actions are available */}
      <ActionBar
        contextLabel="Análise Qualitativa"
        onExportPDF={async () => {
          const filename = 'comentarios-filtrados';
          const lines: string[] = [];
          if (sent !== 'all') lines.push(`Classificação: ${sent}`);
          if (centro !== 'all') lines.push(`Centro: ${centro}`);
          if (disciplina !== 'all') lines.push(`Disciplina: ${disciplina}`);
          if (score !== 'all') lines.push(`Score: ${score}`);
          if (periodo !== 'all') lines.push(`Período: ${periodo}`);
          if (search) lines.push(`Busca: "${search}"`);
          
          exportCommentsPDF({
            filename: `${filename}.pdf`,
            rows: filtered,
            filters: { label: 'Filtros aplicados', lines: lines.length > 0 ? lines : ['Nenhum filtro'] },
          });
        }}
        onExportCSV={async () => {
          exportCommentsToCSV(filtered, 'comentarios-filtrados');
        }}
        onExportXLSX={async () => {
          exportCommentsToXLSX(filtered, 'comentarios-filtrados');
        }}
      />

      {criticals > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
          <div>
            <p className="text-[13px] font-semibold text-red-800">
              {criticals} comentário{criticals > 1 ? 's' : ''} crítico{criticals > 1 ? 's' : ''}
            </p>
            <p className="text-[12px] text-red-600 mt-0.5">Feedbacks classificados com média geral abaixo de 3.0.</p>
          </div>
        </div>
      )}

      {/* Main Filter & List Card */}
      <Card className="border-surface-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-surface-50 border-b border-surface-100 py-3.5 px-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <CardTitle className="text-[14px] font-bold text-surface-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-unicive-green" aria-hidden /> 
              Comentários e Sugestões
              <Badge variant="secondary" className="ml-1 text-[10px] font-bold px-1.5 py-0">
                {filtered.length}
              </Badge>
            </CardTitle>
            
            {/* Active filters summary could go here */}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          
          {/* Filters Area */}
          <div className="bg-white border-b border-surface-100 p-4 space-y-3">
            
            {/* Top row: Search + Category filters */}
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" aria-hidden />
                <Input 
                  placeholder="Buscar palavras-chave..." 
                  value={search} 
                  onChange={(e) => { setSearch(e.target.value); setVisible(PG); }} 
                  className="h-9 pl-9 text-[13px] rounded-lg border-surface-200 focus:border-unicive-green focus:ring-1 focus:ring-unicive-green transition-all" 
                  aria-label="Buscar" 
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={sent} onValueChange={(v) => { setSent(v); setVisible(PG); }}>
                  <SelectTrigger className="h-9 w-[140px] text-[13px] rounded-lg"><Filter className="mr-1.5 h-3.5 w-3.5 text-surface-400" aria-hidden /><SelectValue placeholder="Sentimento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo Sentimento</SelectItem>
                    <SelectItem value="Excelente">Excelente</SelectItem>
                    <SelectItem value="Bom">Bom</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Crítico">Crítico</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={centro} onValueChange={(v) => { setCentro(v); setVisible(PG); }}>
                  <SelectTrigger className="h-9 w-[130px] text-[13px] rounded-lg"><SelectValue placeholder="Centro" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Centros</SelectItem>
                    {centros.map(([sigla]) => <SelectItem key={sigla} value={sigla}>{sigla}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={disciplina} onValueChange={(v) => { setDisciplina(v); setVisible(PG); }}>
                  <SelectTrigger className="h-9 w-[160px] text-[13px] rounded-lg"><SelectValue placeholder="Disciplina" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Disciplinas</SelectItem>
                    {disciplinas.map(d => <SelectItem key={d} value={d}>{d.slice(0, 25) + (d.length > 25 ? '...' : '')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bottom row: Quantitative filters */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Select value={score} onValueChange={(v) => { setScore(v); setVisible(PG); }}>
                <SelectTrigger className="h-8 w-[140px] text-[12px] bg-surface-50 border-surface-200"><SelectValue placeholder="Média Likert" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer Nota</SelectItem>
                  <SelectItem value=">=4">Nota ≥ 4.0</SelectItem>
                  <SelectItem value=">=3">Nota ≥ 3.0</SelectItem>
                  <SelectItem value="<3">Nota &lt; 3.0 (Crítico)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodo} onValueChange={(v) => { setPeriodo(v); setVisible(PG); }}>
                <SelectTrigger className="h-8 w-[130px] text-[12px] bg-surface-50 border-surface-200"><SelectValue placeholder="Período" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo Período</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Reset filter button */}
              {(search || sent !== 'all' || centro !== 'all' || disciplina !== 'all' || score !== 'all' || periodo !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setSearch(''); setSent('all'); setCentro('all'); setDisciplina('all'); setScore('all'); setPeriodo('all'); setVisible(PG); }}
                  className="h-8 text-[12px] text-surface-500 hover:text-surface-900"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="p-4 bg-surface-50/30">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-surface-400">
                <MessageSquare className="mb-3 h-10 w-10 opacity-20" aria-hidden />
                <p className="text-[14px] font-medium text-surface-600">Nenhum comentário encontrado</p>
                <p className="text-[12px] mt-1">Ajuste os filtros para ver mais resultados.</p>
              </div>
            ) : (
              <ul className="space-y-3" role="list">
                {shown.map((row, idx) => {
                  const k = `${row.id}-${row.submittedAt}-${row.disciplina}-${idx}`;
                  const isOpen = expanded.has(k);
                  const long = row.suggestion.length > 200;
                  const crit = row.classificationBadge === 'Crítico';
                  
                  return (
                    <li
                      key={k}
                      className={cn(
                        'rounded-xl border p-4 transition-all hover:shadow-sm bg-white',
                        crit ? 'border-red-200/60 hover:border-red-300' : 'border-surface-200 hover:border-surface-300'
                      )}
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant={BV[row.classificationBadge]} className="text-[10px] uppercase font-bold px-1.5 py-0">
                          {row.classificationBadge}
                        </Badge>
                        <span className="text-[13px] font-semibold text-surface-800">{row.disciplina}</span>
                        <span className="hidden text-surface-300 sm:inline">·</span>
                        <span className="hidden text-[12px] text-surface-500 sm:inline">{row.centroSigla}</span>
                        
                        <div className="ml-auto flex items-center gap-3">
                          <span className={cn('text-[12px] font-bold tabular-nums', row.likertAverage >= 4 ? 'text-unicive-green' : row.likertAverage >= 3 ? 'text-amber-600' : 'text-red-600')}>
                            ⭐ {row.likertAverage.toFixed(1)}
                          </span>
                          <span className="text-[11px] text-surface-400 font-medium">{formatDateBR(row.submittedAt)}</span>
                        </div>
                      </div>
                      
                      <div className="text-[13px] leading-relaxed text-surface-700 bg-surface-50/50 p-3 rounded-lg border border-surface-100/50">
                        <p>{long && !isOpen ? row.suggestion.slice(0, 200).trim() + '...' : row.suggestion}</p>
                      </div>
                      
                      {long && (
                        <button 
                          onClick={() => tog(k)} 
                          className="mt-2.5 flex items-center gap-1 text-[12px] font-semibold text-unicive-green hover:text-unicive-green/80 transition-colors" 
                          aria-expanded={isOpen}
                        >
                          {isOpen ? <><ChevronUp className="h-3.5 w-3.5" /> Ver menos</> : <><ChevronDown className="h-3.5 w-3.5" /> Ver mais</>}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            
            {visible < filtered.length && (
              <div className="pt-6 pb-2 text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setVisible((v) => v + PG)} 
                  className="text-[13px] font-medium h-9 px-6 rounded-full border-surface-200 text-surface-600 hover:text-surface-900 shadow-sm"
                >
                  Carregar mais comentários ({filtered.length - visible} restantes)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
