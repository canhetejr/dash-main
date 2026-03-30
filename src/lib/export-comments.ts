import * as XLSX from 'xlsx';
import type { SurveyRow } from '@/types/survey';
import { formatPercentage, formatScore } from './scoring';

type ExportCommentRow = {
  Data: string;
  Disciplina: string;
  ID: string;
  Centro: string;
  'Classificação agregada': string;
  'Média Likert': string;
  '% Favorável': string;
  'Neutro (3)': string;
  'Desfavorável (1-2)': string;
  Sugestão: string;
};

function rowToExportFormat(row: SurveyRow): ExportCommentRow {
  return {
    Data: row.date,
    Disciplina: row.disciplina,
    ID: row.id,
    Centro: row.centro,
    'Classificação agregada': row.classificationBadge,
    'Média Likert': formatScore(row.likertAverage),
    '% Favorável': formatPercentage(row.favorableRate),
    'Neutro (3)': formatPercentage(row.neutralRate),
    'Desfavorável (1-2)': formatPercentage(row.unfavorableRate),
    Sugestão: row.suggestion,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCommentsToCSV(rows: SurveyRow[], filename = 'comentarios-filtrados'): void {
  if (rows.length === 0) return;
  const exportRows = rows.map(rowToExportFormat);
  const headers = Object.keys(exportRows[0] ?? {}) as (keyof ExportCommentRow)[];

  const csvLines = [
    headers.join(';'),
    ...exportRows.map((r) =>
      headers
        .map((h) => {
          const val = String(r[h] ?? '');
          return val.includes(';') || val.includes('"') || val.includes('\n')
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(';')
    ),
  ];

  const bom = '\uFEFF';
  const blob = new Blob([bom + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportCommentsToXLSX(
  rows: SurveyRow[],
  filename = 'comentarios-filtrados'
): void {
  if (rows.length === 0) return;
  const wb = XLSX.utils.book_new();
  const exportRows = rows.map(rowToExportFormat);
  const ws = XLSX.utils.json_to_sheet(exportRows);
  const headers = Object.keys(exportRows[0] ?? {}) as string[];
  ws['!cols'] = headers.map((h) => ({ wch: Math.min(Math.max(h.length + 2, 18), 40) }));
  XLSX.utils.book_append_sheet(wb, ws, 'Comentários');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, `${filename}.xlsx`);
}

