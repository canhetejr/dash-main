import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DashboardData, SurveyRow, DashboardSummary } from '@/types/survey';
import type { LikertDistribution, LikertLabel } from '@/types/survey';
import { formatDecimal, formatPercent, formatNumber, formatDateBR } from '@/lib/formatters';

type PdfFilters = {
  label: string;
  lines: string[];
};

function addTitle(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(subtitle, 14, 26);
  }
}

function addMeta(doc: jsPDF, metaLines: string[]) {
  doc.setFontSize(9);
  doc.setTextColor(60);
  let y = 34;
  for (const line of metaLines) {
    doc.text(line, 14, y);
    y += 4;
  }
}

function drawBarsLikert(doc: jsPDF, x: number, y: number, w: number, h: number, dist: { label: LikertLabel; count: number; percentage: number }[]) {
  // Simples: barras horizontais para representar a distribuição Likert.
  const max = Math.max(1, ...dist.map((d) => d.count));
  const rowH = h / dist.length;
  doc.setDrawColor(78, 105, 48);
  for (let i = 0; i < dist.length; i++) {
    const d = dist[i];
    const barW = (d.count / max) * w;
    const yy = y + i * rowH + 1;
    doc.setFillColor(78, 105, 48);
    doc.rect(x, yy, barW, Math.max(2, rowH - 2), 'F');
    doc.setTextColor(55);
    doc.setFontSize(8);
    doc.text(String(d.label).slice(0, 22), x + 1, yy + 3);
    doc.text(`${d.count}`, x + w - 10, yy + 3);
  }
}

function download(doc: jsPDF, filename: string) {
  doc.save(filename);
}

export function exportDashboardPDF(args: {
  data: DashboardData;
  filename: string;
  filters?: PdfFilters;
}) {
  const { data, filename, filters } = args;

  const doc = new jsPDF({ format: 'a4' });
  addTitle(doc, 'Relatório Operacional - Dashboard', 'Pesquisa de Satisfação (UniCV)');

  const generatedAt = new Date();
  const metaLines: string[] = [
    `Gerado em: ${generatedAt.toLocaleString('pt-BR')}`,
    `Respostas filtradas: ${data.summary.totalResponses}`,
    `Disciplinas: ${data.summary.uniqueDisciplines} | IDs: ${data.summary.uniqueIds} | Centros: ${data.summary.uniqueCenters}`,
  ];

  if (filters) {
    metaLines.push(filters.label);
    metaLines.push(...filters.lines.map((l) => `- ${l}`));
  }

  addMeta(doc, metaLines);

  // KPIs
  const kpiTop = 60;
  doc.setFontSize(10);
  doc.setTextColor(35);
  doc.text('KPIs (Likert)', 14, kpiTop);
  autoTable(doc, {
    startY: kpiTop + 2,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    head: [['Métrica', 'Valor']],
    body: [
      ['Média Likert', `${formatDecimal(data.summary.likertAverage)} / 5`],
      ['Favorável (4-5)', formatPercent(data.summary.favorableRate)],
      ['Neutro (3)', formatPercent(data.summary.neutralRate)],
      ['Desfavorável (1-2)', formatPercent(data.summary.unfavorableRate)],
    ],
    columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 30 } },
  });

  const yAfterKpi = (doc as any).lastAutoTable?.finalY ?? (kpiTop + 28);

  // Likert distribution (principal)
  const likertY = yAfterKpi + 6;
  doc.setFontSize(10);
  doc.text('Distribuição Likert', 14, likertY);
  autoTable(doc, {
    startY: likertY + 2,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    head: [['Categoria', 'Qtd', '%']],
    body: data.likertDistribution.map((d) => [d.label, String(d.count), `${d.percentage.toFixed(1)}%`]),
  });

  const yAfterLikert = (doc as any).lastAutoTable?.finalY ?? (likertY + 22);

  // Resumo por Centro (top 7)
  const centroY = yAfterLikert + 6;
  doc.setFontSize(10);
  doc.text('Resumo por Centro (top)', 14, centroY);
  autoTable(doc, {
    startY: centroY + 2,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    head: [['Centro', 'Respostas', 'Média Likert', 'Favorável']],
    body: (data.byCentro ?? [])
      .slice(0, 7)
      .map((c) => [c.centro, String(c.totalResponses), `${formatDecimal(c.likertAverage)}`, formatPercent(c.favorableRate)]),
  });

  const yAfterCentro = (doc as any).lastAutoTable?.finalY ?? (centroY + 22);

  // Tabela resumida por disciplina (top)
  const discY = yAfterCentro + 6;
  doc.setFontSize(10);
  doc.text('Tabela resumida (disciplinas - top)', 14, discY);
  autoTable(doc, {
    startY: discY + 2,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    head: [['Disciplina', 'Centro', 'Respostas', 'Média Likert', 'Favorável']],
    body: (data.byDisciplina ?? [])
      .slice(0, 10)
      .map((d) => [d.disciplina, d.centro, String(d.totalResponses), `${formatDecimal(d.likertAverage)}`, formatPercent(d.favorableRate)]),
  });

  download(doc, filename);
}

export function exportDisciplinePDF(args: {
  disciplineName: string;
  id: string;
  centro: string;
  rows: SurveyRow[];
  filename: string;
  globalSummary: DashboardSummary;
  viewMetrics: {
    totalResponses: number;
    likertAverage: number;
    favorableRate: number;
    neutralRate: number;
    unfavorableRate: number;
    dominantClassification: string;
    likertDistribution: LikertDistribution[];
    byQuestion: { questionKey: string; question: string; avgScore: number }[];
  };
  benchmarkByQuestion?: { questionKey: string; question: string; avgScore: number }[];
  comments: { text: string; date: string }[];
  filters?: PdfFilters;
}) {
  const {
    filename,
    disciplineName,
    id,
    centro,
    viewMetrics,
    globalSummary,
    comments,
    filters,
    benchmarkByQuestion,
  } = args;
  const doc = new jsPDF({ format: 'a4' });

  addTitle(doc, `Disciplina: ${disciplineName}`, `ID: ${id} | Centro: ${centro}`);
  const generatedAt = new Date();

  const metaLines: string[] = [
    `Gerado em: ${generatedAt.toLocaleString('pt-BR')}`,
    `Volume (linhas): ${viewMetrics.totalResponses}`,
    `Média global (Likert): ${formatDecimal(globalSummary.likertAverage)} / 5`,
  ];
  if (filters) {
    metaLines.push(filters.label);
    metaLines.push(...filters.lines.map((l) => `- ${l}`));
  }
  addMeta(doc, metaLines);

  // KPIs
  const kpiTop = 60;
  doc.setFontSize(10);
  doc.text('KPIs (Likert) - filtrado', 14, kpiTop);
  autoTable(doc, {
    startY: kpiTop + 2,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    head: [['Métrica', 'Valor']],
    body: [
      ['Média Likert', `${formatDecimal(viewMetrics.likertAverage)} / 5`],
      ['Favorável (4-5)', formatPercent(viewMetrics.favorableRate)],
      ['Neutro (3)', formatPercent(viewMetrics.neutralRate)],
      ['Desfavorável (1-2)', formatPercent(viewMetrics.unfavorableRate)],
      ['Classificação agregada', String(viewMetrics.dominantClassification)],
    ],
    columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 60 } },
  });

  const yAfterKpi = (doc as any).lastAutoTable?.finalY ?? (kpiTop + 28);
  const likertY = yAfterKpi + 6;
  doc.setFontSize(10);
  doc.text('Distribuição Likert - filtrado', 14, likertY);

  autoTable(doc, {
    startY: likertY + 2,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    head: [['Categoria', 'Qtd', '%']],
    body: viewMetrics.likertDistribution.map((d) => [d.label, String(d.count), `${d.percentage.toFixed(1)}%`]),
  });

  const yAfterLikert = (doc as any).lastAutoTable?.finalY ?? (likertY + 22);
  const qY = yAfterLikert + 6;
  doc.setFontSize(10);
  doc.text('Benchmark global - Média por Pergunta', 14, qY);
  autoTable(doc, {
    startY: qY + 2,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.8 },
    head: [['Pergunta', 'Média Likert']],
    body: (benchmarkByQuestion ?? viewMetrics.byQuestion ?? []).map((q) => [
      q.question,
      `${formatDecimal(q.avgScore)}`,
    ]),
  });

  const yAfterQ = (doc as any).lastAutoTable?.finalY ?? (qY + 22);
  const cY = yAfterQ + 6;
  doc.setFontSize(10);
  doc.text('Comentários principais (resumo)', 14, cY);

  const safeComments = (comments ?? []).filter((c) => c.text?.trim()).slice(0, 8);
  autoTable(doc, {
    startY: cY + 2,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.6 },
    head: [['Data', 'Disciplina', 'Centro', 'Comentário']],
    body: safeComments.map((c) => [
      c.date ? c.date : '',
      disciplineName,
      centro,
      `${c.text}`.length > 120 ? `${c.text.slice(0, 120)}...` : c.text,
    ]),
  });

  download(doc, filename);
}

export function exportCommentsPDF(args: {
  filename: string;
  rows: SurveyRow[];
  filters?: PdfFilters;
}) {
  const { filename, rows, filters } = args;
  const doc = new jsPDF({ format: 'a4' });
  addTitle(doc, 'Relatório de Comentários', 'Pesquisa de Satisfação (UniCV)');

  const generatedAt = new Date();
  const criticalCount = rows.filter((r) => r.classificationBadge === 'Crítico').length;
  const excellentCount = rows.filter((r) => r.classificationBadge === 'Excelente').length;

  const metaLines: string[] = [
    `Gerado em: ${generatedAt.toLocaleString('pt-BR')}`,
    `Comentários filtrados: ${rows.length}`,
    `Críticos: ${criticalCount} | Excelentes: ${excellentCount}`,
  ];
  if (filters) {
    metaLines.push(filters.label);
    metaLines.push(...filters.lines.map((l) => `- ${l}`));
  }
  addMeta(doc, metaLines);

  const y = 70;
  doc.setFontSize(10);
  doc.text('Lista de comentários (resumo)', 14, y);

  autoTable(doc, {
    startY: y + 2,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.6 },
    head: [['Data', 'Disciplina', 'Centro', 'Classificação', 'Comentário']],
    body: rows
      .slice(0, 40)
      .map((r) => [
        r.date,
        r.disciplina,
        r.centroSigla,
        r.classificationBadge,
        r.suggestion?.trim().slice(0, 110) ?? '',
      ]),
  });

  download(doc, filename);
}

