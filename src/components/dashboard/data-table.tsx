'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel,
  getFilteredRowModel, flexRender, createColumnHelper, type SortingState,
} from '@tanstack/react-table';
import type { SurveyRow } from '@/types/survey';
import { cn } from '@/lib/utils';
import { formatDateBR, formatDecimal, truncateText } from '@/lib/formatters';
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV, exportToXLSX } from '@/lib/export';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Table2 } from 'lucide-react';

interface DataTableProps {
  rows: SurveyRow[];
  isLoading: boolean;
}

const SENTIMENT_VARIANT: Record<SurveyRow['sentimentLabel'], 'success' | 'default' | 'warning' | 'destructive'> = {
  Excelente: 'success', Bom: 'default', Regular: 'warning', Crítico: 'destructive',
};

function scoreColor(s: number) {
  if (s >= 4.5) return 'text-emerald-400 font-semibold';
  if (s >= 4) return 'text-blue-400';
  if (s >= 3) return 'text-amber-400';
  return 'text-rose-400 font-semibold';
}

const ch = createColumnHelper<SurveyRow>();

export function DataTable({ rows, isLoading }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(() => [
    ch.accessor('date', { header: 'Data', cell: ({ getValue }) => formatDateBR(getValue()), enableSorting: true }),
    ch.accessor('disciplina', { header: 'Disciplina', cell: ({ getValue }) => <span className="max-w-[200px] truncate block">{getValue()}</span>, enableSorting: true }),
    ch.accessor('id', {
      header: 'ID',
      cell: ({ getValue, row }) => (
        <Link
          href={`/dashboard/disciplina/${getValue()}`}
          className="font-medium text-unicv-green hover:underline"
        >
          {getValue()}
        </Link>
      ),
      enableSorting: true,
    }),
    ch.accessor('centro', { header: 'Centro', cell: ({ getValue }) => <span className="max-w-[180px] truncate block">{getValue()}</span>, enableSorting: true }),
    ch.accessor('averageScore', { header: 'Média', cell: ({ getValue }) => <span className={scoreColor(getValue())}>{formatDecimal(getValue())}</span>, enableSorting: true }),
    ch.accessor('sentimentLabel', { header: 'Classificação agregada', cell: ({ getValue }) => <Badge variant={SENTIMENT_VARIANT[getValue()]}>{getValue()}</Badge>, enableSorting: true }),
    ch.accessor('suggestion', { header: 'Comentário', cell: ({ getValue }) => <span className="text-surface-800">{truncateText(getValue() ?? '', 60)}</span>, enableSorting: false }),
  ], []);

  const table = useReactTable({
    data: rows, columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    initialState: { pagination: { pageSize: DEFAULT_PAGE_SIZE } },
  });

  const filtered = table.getFilteredRowModel().rows;

  if (isLoading) {
    return <Card><CardContent className="p-6 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Table2 className="h-4 w-4" aria-hidden /> Dados Analíticos
        </CardTitle>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-700" aria-hidden />
            <Input placeholder="Filtrar..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="h-8 pl-9 text-sm" aria-label="Filtrar tabela" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-800">{filtered.length} de {rows.length}</span>
            <Button variant="outline" size="sm" onClick={() => exportToCSV(filtered.map((r) => r.original))} disabled={filtered.length === 0} className="h-7 gap-1 text-xs" aria-label="Exportar CSV">
              <Download className="h-3 w-3" aria-hidden /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportToXLSX(filtered.map((r) => r.original))} disabled={filtered.length === 0} className="h-7 gap-1 text-xs" aria-label="Exportar XLSX">
              <Download className="h-3 w-3" aria-hidden /> XLSX
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-surface-700">
            <Search className="mb-3 h-10 w-10" />
            <p className="text-sm">Nenhum resultado</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-surface-300 scrollbar-thin">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="border-b border-surface-300 bg-surface-200">
                      {hg.headers.map((h) => {
                        const canSort = h.column.getCanSort();
                        const dir = h.column.getIsSorted();
                        return (
                          <th key={h.id} scope="col"
                            aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : canSort ? 'none' : undefined}
                            tabIndex={canSort ? 0 : undefined}
                            className={cn('px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-surface-800', h.column.id === 'averageScore' && 'text-right', canSort && 'cursor-pointer select-none hover:text-slate-200')}
                            onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                            onKeyDown={(e) => { if (canSort && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); h.column.getToggleSortingHandler()?.(e); } }}
                          >
                            <span className={cn('inline-flex items-center gap-1', h.column.id === 'averageScore' && 'justify-end')}>
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              {canSort && <span className="opacity-50">{dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : dir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3" />}</span>}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row, ri) => (
                    <tr key={row.id} className={cn('border-b border-surface-300/50 transition-colors hover:bg-surface-200/50', ri % 2 === 1 && 'bg-surface-50/30')}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className={cn('px-3 py-2.5 text-slate-200', cell.column.id === 'averageScore' && 'text-right')}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-800">Linhas:</span>
                <Select value={String(table.getState().pagination.pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
                  <SelectTrigger className="h-7 w-[80px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{PAGE_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-surface-800">{table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
                <Button variant="outline" size="sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="h-7 w-7 p-0" aria-label="Primeira"><ChevronsLeft className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="h-7 w-7 p-0" aria-label="Anterior"><ChevronLeft className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="h-7 w-7 p-0" aria-label="Próxima"><ChevronRight className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="h-7 w-7 p-0" aria-label="Última"><ChevronsRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
