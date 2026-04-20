'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, File, Loader2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { getExportData } from '@/app/actions/export';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportMenuProps {
  filters: {
    centro?: string;
    disciplina?: string;
  };
}

export function ExportMenu({ filters }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);

  const fetchAndFormatData = async () => {
    setIsExporting(true);
    try {
      const result = await getExportData(filters);
      if (!result.success || !result.data) return null;

      // Transform rows for export
      return result.data.map(row => ({
        'Data de Submissão': new Date(row.submittedAt).toLocaleDateString('pt-BR'),
        'Centro': row.centroDisplay,
        'Disciplina': row.disciplina,
        'Média (Score)': row.likertAverage.toFixed(2),
        'Classificação': row.classificationBadge,
        'Q1 - Professor e Estrutura': row.q1,
        'Q2 - Metodologia e Material': row.q2,
        'Q3 - Relevância': row.q3,
        'Q4 - Ambiente Virtual': row.q4,
        'Q5 - Suporte e Atendimento': row.q5,
        'Q6 - Sistema de Avaliação': row.q6,
        'Comentário/Sugestão': row.suggestion || '',
      }));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportXLSX = async () => {
    const data = await fetchAndFormatData();
    if (!data) return;

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pesquisa de Disciplina');
    XLSX.writeFile(wb, `unicive_analytics_${Date.now()}.xlsx`);
  };

  const handleExportCSV = async () => {
    const data = await fetchAndFormatData();
    if (!data) return;

    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["\ufeff", csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unicive_analytics_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const data = await fetchAndFormatData();
    if (!data) return;

    const doc = new jsPDF('landscape');
    
    // Configurações do cabeçalho do PDF
    doc.setFontSize(16);
    doc.setTextColor(0, 89, 65); // #005941 Unicive Green
    doc.text('Unicive - Dashboard Analítico (Pesquisa da Disciplina)', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Filtros: Centro = ${filters.centro || 'Todos'} | Disciplina = ${filters.disciplina || 'Todas'}`, 14, 22);

    const tableColumn = ["Data", "Centro", "Disciplina", "Média", "Classificação"];
    const tableRows = data.map(row => [
      row['Data de Submissão'],
      row['Centro'],
      row['Disciplina'],
      row['Média (Score)'],
      row['Classificação']
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [0, 89, 65] },
      styles: { fontSize: 8 },
    });

    doc.save(`unicive_analytics_${Date.now()}.pdf`);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          disabled={isExporting}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-surface-900 px-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-surface-900/20 disabled:pointer-events-none disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isExporting ? 'Processando...' : 'Gerar Relatório'}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 min-w-[160px] overflow-hidden rounded-xl border border-surface-200 bg-white p-1.5 shadow-lg animate-in fade-in-80 zoom-in-95"
        >
          <DropdownMenu.Item
            onSelect={handleExportPDF}
            className="flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm text-surface-700 outline-none transition-colors hover:bg-surface-100 focus:bg-surface-100"
          >
            <FileText className="h-4 w-4 text-red-500" />
            PDF (.pdf)
          </DropdownMenu.Item>
          
          <DropdownMenu.Item
            onSelect={handleExportXLSX}
            className="flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm text-surface-700 outline-none transition-colors hover:bg-surface-100 focus:bg-surface-100"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Excel (.xlsx)
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={handleExportCSV}
            className="flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm text-surface-700 outline-none transition-colors hover:bg-surface-100 focus:bg-surface-100"
          >
            <File className="h-4 w-4 text-blue-500" />
            CSV (.csv)
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
