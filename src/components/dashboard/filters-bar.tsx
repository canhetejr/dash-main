'use client';

import { useCallback, useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FilterState, FilterOptions, FilterOption } from '@/types/dashboard';
import { EMPTY_FILTERS, countActiveFilters, isFilterActive } from '@/lib/filters';

interface FiltersBarProps { filters: FilterState; filterOptions: FilterOptions | null; onFiltersChange: (f: FilterState) => void; isLoading: boolean; }

export function FiltersBar({ filters, filterOptions, onFiltersChange, isLoading }: FiltersBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const count = countActiveFilters(filters);
  const active = isFilterActive(filters);

  useEffect(() => {
    const t = setTimeout(() => { if (searchInput !== filters.search) onFiltersChange({ ...filters, search: searchInput }); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setSearchInput(filters.search); }, [filters.search]);

  const set = useCallback(<K extends keyof FilterState>(k: K, v: FilterState[K]) => onFiltersChange({ ...filters, [k]: v }), [filters, onFiltersChange]);
  const tog = useCallback((k: 'centro' | 'disciplina' | 'sentimentLabel', v: string) => {
    const c = filters[k]; set(k, c.includes(v) ? c.filter((x) => x !== v) : [...c, v]);
  }, [filters, set]);

  return (
    <div className="rounded-xl border border-surface-300 bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-500" aria-hidden />
          <Input placeholder="Buscar..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="h-8 pl-8 text-xs" aria-label="Busca global" />
        </div>
        <Multi label="Centro" opts={filterOptions?.centros ?? []} sel={filters.centro} onTog={(v) => tog('centro', v)} disabled={isLoading} />
        <Multi label="Disciplina" opts={filterOptions?.disciplinas ?? []} sel={filters.disciplina} onTog={(v) => tog('disciplina', v)} disabled={isLoading} />
        <Multi label="Classificação agregada" opts={filterOptions?.sentimentLabels ?? []} sel={filters.sentimentLabel} onTog={(v) => tog('sentimentLabel', v)} disabled={isLoading} />
        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="h-8 gap-1 text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Mais
          {count > 0 && <Badge className="ml-0.5 h-4 min-w-4 rounded-full px-1 text-[10px] bg-unicv-green text-white">{count}</Badge>}
          <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} aria-hidden />
        </Button>
        {active && <Button variant="ghost" size="sm" onClick={() => onFiltersChange(EMPTY_FILTERS)} className="h-8 gap-1 text-xs text-surface-500"><RotateCcw className="h-3 w-3" aria-hidden />Limpar</Button>}
      </div>
      {expanded && (
        <div className="grid grid-cols-2 gap-3 border-t border-surface-200 p-3 lg:grid-cols-4">
          <Field label="Data Início"><Input type="date" value={filters.dateFrom ?? ''} onChange={(e) => set('dateFrom', e.target.value || null)} className="h-8 text-xs" /></Field>
          <Field label="Data Fim"><Input type="date" value={filters.dateTo ?? ''} onChange={(e) => set('dateTo', e.target.value || null)} className="h-8 text-xs" /></Field>
          <Field label="Score Mínimo">
            <Select value={filters.scoreMin !== null ? String(filters.scoreMin) : ''} onValueChange={(v) => set('scoreMin', v ? Number(v) : null)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sem limite" /></SelectTrigger>
              <SelectContent>{[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n}.0+</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="ID">
            <Select value={filters.id[0] ?? ''} onValueChange={(v) => set('id', v ? [v] : [])}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>{(filterOptions?.ids ?? []).slice(0, 50).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
      )}
      {active && (
        <div className="flex flex-wrap gap-1 border-t border-surface-200 px-3 py-2">
          {filters.centro.map((v) => <Chip key={`c-${v}`} label={v} onDel={() => tog('centro', v)} />)}
          {filters.disciplina.map((v) => <Chip key={`d-${v}`} label={v} onDel={() => tog('disciplina', v)} />)}
          {filters.sentimentLabel.map((v) => <Chip key={`s-${v}`} label={v} onDel={() => tog('sentimentLabel', v)} />)}
          {filters.dateFrom && <Chip label={`De: ${filters.dateFrom}`} onDel={() => set('dateFrom', null)} />}
          {filters.dateTo && <Chip label={`Até: ${filters.dateTo}`} onDel={() => set('dateTo', null)} />}
          {filters.search && <Chip label={`"${filters.search}"`} onDel={() => { setSearchInput(''); onFiltersChange({...filters, search:''}); }} />}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><span className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">{label}</span>{children}</div>;
}
function Chip({ label, onDel }: { label: string; onDel: () => void }) {
  return <span className="inline-flex items-center gap-1 rounded-md bg-surface-200 px-2 py-0.5 text-[11px] text-surface-700"><span className="max-w-[160px] truncate">{label}</span><button onClick={onDel} className="rounded p-0.5 hover:bg-surface-300" aria-label={`Remover ${label}`}><X className="h-2.5 w-2.5" /></button></span>;
}

function Multi({ label, opts, sel, onTog, disabled }: { label: string; opts: FilterOption[]; sel: string[]; onTog: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={disabled} aria-expanded={open} aria-haspopup="listbox"
        className={cn('inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors',
          sel.length > 0 ? 'border-unicv-green/30 bg-unicv-green/5 text-unicv-green' : 'border-surface-300 bg-white text-surface-700 hover:border-surface-400',
          'min-w-[170px] max-w-[240px')}>
        {label}
        {sel.length > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-unicv-green px-1 text-[10px] font-bold text-white">{sel.length}</span>}
        <ChevronDown className="h-3 w-3" aria-hidden />
      </button>
      {open && <>
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
        <div className="absolute left-0 top-full z-50 mt-1 max-h-56 w-56 max-w-[calc(100vw-2rem)] overflow-auto rounded-lg border border-surface-200 bg-white p-1 shadow-lg scrollbar-thin" role="listbox">
          {opts.length === 0 ? <p className="px-3 py-2 text-xs text-surface-500">Sem opções</p> : opts.map((o) => (
            <button key={o.value} onClick={() => onTog(o.value)} role="option" aria-selected={sel.includes(o.value)}
              className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-surface-100', sel.includes(o.value) && 'bg-unicv-green/5 text-unicv-green')}>
              <span className={cn('flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border', sel.includes(o.value) ? 'border-unicv-green bg-unicv-green text-white' : 'border-surface-400')}>
                {sel.includes(o.value) && <Check className="h-2.5 w-2.5" />}
              </span>
              <span className="flex-1 truncate">{o.label}</span>
              <span className="text-[10px] text-surface-500">{o.count}</span>
            </button>
          ))}
        </div>
      </>}
    </div>
  );
}
