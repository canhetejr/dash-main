'use client';

import Link from 'next/link';

import type { SentimentLabel } from '@/types/survey';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Inbox, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ExportMenu } from '@/components/dashboard/export-menu';
import { cn } from '@/lib/utils';

interface TableRow {
  id: string;
  submittedAt: string;
  disciplina: string;
  centroDisplay: string;
  likertAverage: number;
  classificationBadge: SentimentLabel;
}

interface MvpTableProps {
  rows: TableRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const BADGE_STYLES: Record<string, string> = {
  Excelente:      'bg-unicive-green-pale text-unicive-green border border-unicive-green/20',
  Bom:            'bg-sky-50 text-sky-700 border border-sky-200',
  Regular:        'bg-unicive-amber-light text-amber-700 border border-unicive-amber/30',
  Insatisfatório: 'bg-red-50 text-red-700 border border-red-200',
};

const AVERAGE_COLOR = (avg: number) =>
  avg >= 4.5 ? 'text-unicive-green font-semibold' :
  avg >= 3.5 ? 'text-sky-700 font-medium' :
  avg >= 2.5 ? 'text-amber-700 font-medium' :
  'text-red-700 font-medium';

function ClassificationBadge({ label }: { label: string }) {
  const cls = BADGE_STYLES[label] ?? BADGE_STYLES['Regular'];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide', cls)}>
      {label}
    </span>
  );
}

export function MvpTable({ rows, totalCount, currentPage, totalPages }: MvpTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const startItem = totalCount > 0 ? (currentPage - 1) * rows.length + 1 : 0;
  const endItem   = Math.min(startItem + rows.length - 1, totalCount);

  return (
    <div className="card-institution overflow-hidden">
      {/* Card header — mais compacto */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-surface-100">
        <div className="flex items-baseline gap-3">
          <h2
            className="text-sm font-bold text-surface-900"
            style={{ fontFamily: 'var(--font-kumbh, "Kumbh Sans", sans-serif)' }}
          >
            Respostas Individuais
          </h2>
          <span className="text-xs text-surface-400 tabular-nums">
            {startItem}–{endItem} de {totalCount.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className="shrink-0">
          <ExportMenu filters={{ centro: searchParams.get('centro') || undefined, disciplina: searchParams.get('disciplina') || undefined }} />
        </div>
      </div>

      {/* Table — células mais tight */}
      <div className="relative w-full overflow-auto scrollbar-thin">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="bg-surface-50/60 border-b border-surface-100">
              <th className="h-9 px-4 text-left align-middle text-[10px] font-bold uppercase tracking-[0.08em] text-surface-400 whitespace-nowrap">Data</th>
              <th className="h-9 px-4 text-left align-middle text-[10px] font-bold uppercase tracking-[0.08em] text-surface-400">Disciplina</th>
              <th className="h-9 px-4 text-left align-middle text-[10px] font-bold uppercase tracking-[0.08em] text-surface-400">Centro</th>
              <th className="h-9 px-4 text-right align-middle text-[10px] font-bold uppercase tracking-[0.08em] text-surface-400 whitespace-nowrap">Média</th>
              <th className="h-9 px-4 text-center align-middle text-[10px] font-bold uppercase tracking-[0.08em] text-surface-400">Classificação</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-surface-100/40 transition-colors hover:bg-surface-50/50',
                    idx % 2 === 0 ? 'bg-white' : 'bg-surface-50/20',
                  )}
                >
                  <td className="px-4 py-2 align-middle text-xs text-surface-500 whitespace-nowrap tabular-nums">
                    {formatDate(row.submittedAt)}
                  </td>
                  <td className="px-4 py-2 align-middle font-medium text-surface-800 max-w-[200px] truncate">
                    <Link
                      href={`/dashboard/disciplina/${encodeURIComponent(row.disciplina)}`}
                      className="text-sm font-semibold text-surface-900 hover:text-unicive-green hover:underline decoration-surface-300 underline-offset-4 transition-all"
                      title={`Ver análise de ${row.disciplina}`}
                    >
                      {row.disciplina}
                    </Link>
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-surface-600 whitespace-nowrap">
                    {row.centroDisplay}
                  </td>
                  <td className={cn('px-4 py-2 align-middle text-right tabular-nums text-sm', AVERAGE_COLOR(row.likertAverage))}>
                    {row.likertAverage.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 align-middle text-center">
                    <ClassificationBadge label={row.classificationBadge} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2.5 text-surface-400">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-100">
                      <Inbox className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-600">Nenhum resultado encontrado</p>
                      <p className="text-xs text-surface-400 mt-0.5">Ajuste o centro ou disciplina para ampliar a busca.</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-surface-100 px-4 py-2.5">
          <p className="text-xs text-surface-500">
            Página <span className="font-semibold text-surface-800">{currentPage}</span> de{' '}
            <span className="font-semibold text-surface-800">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            <PagBtn onClick={() => handlePageChange(1)} disabled={currentPage <= 1} label="Primeira página">
              <ChevronsLeft className="h-3.5 w-3.5" />
            </PagBtn>
            <PagBtn onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} label="Página anterior">
              <ChevronLeft className="h-3.5 w-3.5" />
            </PagBtn>
            <PagBtn onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} label="Próxima página">
              <ChevronRight className="h-3.5 w-3.5" />
            </PagBtn>
            <PagBtn onClick={() => handlePageChange(totalPages)} disabled={currentPage >= totalPages} label="Última página">
              <ChevronsRight className="h-3.5 w-3.5" />
            </PagBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PagBtn({ onClick, disabled, label, children }: { onClick: () => void; disabled: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-unicive-green-pale hover:text-unicive-green hover:border-unicive-green/30 disabled:pointer-events-none disabled:opacity-35 transition-colors"
      aria-label={label}
    >
      {children}
    </button>
  );
}
