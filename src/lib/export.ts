import * as XLSX from 'xlsx';
import type { SurveyRow, DashboardSummary } from '@/types/survey';
import { QUESTION_LABELS } from './constants';
import { formatPercentage, formatScore } from './scoring';

interface ExportRow {
  Data: string;
  Disciplina: string;
  ID: string;
  Centro: string;
  'Satisfação Geral': string;
  'Material Didático': string;
  'Atividades Propostas': string;
  Videoaulas: string;
  Mediador: string;
  'Mat. Complementares': string;
  'Média Likert': string;
  '% Favorável': string;
  'Classificação agregada': string;
  Sugestão: string;
}

function rowToExportFormat(row: SurveyRow): ExportRow {
  return {
    Data: row.date,
    Disciplina: row.disciplina,
    ID: row.id,
    Centro: row.centro,
    'Satisfação Geral': row.q1,
    'Material Didático': row.q2,
    'Atividades Propostas': row.q3,
    Videoaulas: row.q4,
    Mediador: row.q5,
    'Mat. Complementares': row.q6,
    'Média Likert': formatScore(row.likertAverage),
    '% Favorável': formatPercentage(row.favorableRate),
    'Classificação agregada': row.classificationBadge,
    Sugestão: row.suggestion,
  };
}

export function exportToCSV(rows: SurveyRow[], filename = 'dados-pesquisa'): void {
  if (rows.length === 0) return;
  const exportRows = rows.map(rowToExportFormat);
  const headers = Object.keys(exportRows[0] ?? {});
  const csvLines = [
    headers.join(';'),
    ...exportRows.map((row) =>
      headers
        .map((h) => {
          const val = row[h as keyof ExportRow] ?? '';
          return val.includes(';') || val.includes('"') || val.includes('\n')
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(';')
    ),
  ];

  const bom = '\uFEFF';
  const blob = new Blob([bom + csvLines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToXLSX(
  rows: SurveyRow[],
  summary?: DashboardSummary,
  filename = 'dados-pesquisa'
): void {
  if (rows.length === 0) return;
  const wb = XLSX.utils.book_new();

  const exportRows = rows.map(rowToExportFormat);
  const ws = XLSX.utils.json_to_sheet(exportRows);
  setColumnWidths(ws, exportRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');

  if (summary) {
    const summaryData = [
      { Métrica: 'Total de Respostas', Valor: summary.totalResponses },
      { Métrica: 'Disciplinas Únicas', Valor: summary.uniqueDisciplines },
      { Métrica: 'IDs Únicos', Valor: summary.uniqueIds },
      { Métrica: 'Centros Únicos', Valor: summary.uniqueCenters },
      { Métrica: 'Média Likert', Valor: formatScore(summary.likertAverage) },
      { Métrica: '% Favorável', Valor: formatPercentage(summary.favorableRate) },
      { Métrica: 'Avaliações Críticas', Valor: summary.criticalCount },
      { Métrica: 'Avaliações Excelentes', Valor: summary.excellentCount },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, `${filename}.xlsx`);
}

function setColumnWidths(ws: XLSX.WorkSheet, data: ExportRow[]): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  ws['!cols'] = headers.map((h) => {
    const maxLen = Math.max(
      h.length,
      ...data.slice(0, 100).map((row) => String(row[h as keyof ExportRow] ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSummaryReport(
  summary: DashboardSummary,
  questionLabels: Record<string, string> = QUESTION_LABELS
): void {
  const lines = [
    'RELATÓRIO EXECUTIVO - PESQUISA DE SATISFAÇÃO',
    '='.repeat(50),
    '',
    `Total de Respostas: ${summary.totalResponses}`,
    `Disciplinas Avaliadas: ${summary.uniqueDisciplines}`,
    `IDs Participantes: ${summary.uniqueIds}`,
    `Centros Avaliados: ${summary.uniqueCenters}`,
    '',
    `Média Likert: ${formatScore(summary.likertAverage)} / 5.0`,
    `Taxa de Favorabilidade: ${formatPercentage(summary.favorableRate)}`,
    `Avaliações Excelentes: ${summary.excellentCount}`,
    `Avaliações Críticas: ${summary.criticalCount}`,
    '',
    'PERGUNTAS AVALIADAS:',
    ...Object.entries(questionLabels).map(([key, label]) => `  - ${key}: ${label}`),
    '',
    `Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
  downloadBlob(blob, 'relatorio-executivo.txt');
}
