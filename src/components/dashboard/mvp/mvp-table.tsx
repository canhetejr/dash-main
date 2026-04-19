'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SentimentLabel } from '@/types/survey';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
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

export function MvpTable({ rows, totalCount, currentPage, totalPages }: MvpTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const getBadgeVariant = (label: string) => {
    if (label === 'Excelente') return 'default';
    if (label === 'Bom') return 'secondary';
    if (label === 'Regular') return 'outline';
    return 'destructive';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="border-surface-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-surface-900">Respostas Individuais Detalhadas</CardTitle>
        <CardDescription>Acompanhe os resultados paginados diretamente do banco (Total: {totalCount} registros)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto rounded-md border border-surface-200">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-surface-50 [&_tr]:border-b border-surface-200">
              <tr className="border-b transition-colors hover:bg-surface-100/50 data-[state=selected]:bg-surface-100">
                <th className="h-10 px-4 text-left align-middle font-medium text-surface-600">Data</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-surface-600">Disciplina</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-surface-600">Centro</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-surface-600">Média</th>
                <th className="h-10 px-4 text-center align-middle font-medium text-surface-600">Classificação</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0 divide-y divide-surface-200">
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-surface-50/80 data-[state=selected]:bg-surface-100">
                    <td className="px-4 py-3 align-middle text-surface-600 whitespace-nowrap">{formatDate(row.submittedAt)}</td>
                    <td className="px-4 py-3 align-middle font-medium text-surface-900">{row.disciplina}</td>
                    <td className="px-4 py-3 align-middle text-surface-700">{row.centroDisplay}</td>
                    <td className="px-4 py-3 align-middle text-right font-semibold text-surface-900">{row.likertAverage.toFixed(2)}</td>
                    <td className="px-4 py-3 align-middle text-center">
                      <Badge variant={getBadgeVariant(row.classificationBadge)} className={cn(
                        row.classificationBadge === 'Excelente' ? "bg-green-100 text-green-800 hover:bg-green-200" :
                        row.classificationBadge === 'Bom' ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
                        row.classificationBadge === 'Regular' ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" :
                        "bg-red-100 text-red-800 hover:bg-red-200"
                      )}>
                        {row.classificationBadge}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-surface-500">
                      <Inbox className="h-8 w-8 mb-2 text-surface-300" />
                      <p>Nenhum registro encontrado para estes filtros.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-surface-500">
              Página <span className="font-medium text-surface-900">{currentPage}</span> de <span className="font-medium text-surface-900">{totalPages}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-surface-300 bg-white hover:bg-surface-100 text-surface-700 disabled:pointer-events-none disabled:opacity-50 transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-surface-300 bg-white hover:bg-surface-100 text-surface-700 disabled:pointer-events-none disabled:opacity-50 transition-colors"
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
