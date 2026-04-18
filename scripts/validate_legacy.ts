import * as XLSX from 'xlsx';
import { transformAll, buildDashboardData } from '../src/lib/transform';
import type { SurveyRawRow } from '../src/types/survey';

const FILE_PATH = '/home/canhete/Projetos/clientes/unicive/PESQUISA DA DISCPLINA .xlsx';

function excelSerialToISO(serial: any) {
  if (!serial || isNaN(serial)) return null;
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString();
}

async function main() {
  console.log('🔄 Lendo arquivo XLSX...');
  const workbook = XLSX.readFile(FILE_PATH);
  const sheetName = 'TRATAMENTO';
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
  const dataRows = rows.slice(1);

  // Mapear para SurveyRawRow usando o mesmo filtro da ingestão
  const rawRows: SurveyRawRow[] = dataRows
    .filter(row => {
      const submitted_at = excelSerialToISO(row[0]);
      const disciplina = String(row[9] || '').trim();
      return submitted_at && disciplina;
    })
    .map(row => ({
      timestamp: String(row[0] || '').trim(), // O transform legacy faz parse disso
      courseLabel: String(row[1] || '').trim(),
      q1: String(row[2] || '').trim(),
      q2: String(row[3] || '').trim(),
      q3: String(row[4] || '').trim(),
      q4: String(row[5] || '').trim(),
      q5: String(row[6] || '').trim(),
      q6: String(row[7] || '').trim(),
      suggestion: String(row[8] || '').trim(),
      disciplina: String(row[9] || '').trim(),
      id: String(row[10] || '').trim(),
      chave: String(row[11] || '').trim(),
      centro: String(row[12] || '').trim(),
    }));

  console.log(`📋 Total de registros processados (raw): ${rawRows.length}`);

  // Transformar usando a lógica do sistema atual (LEGADO)
  const transformedRows = transformAll(rawRows);
  const dashboardData = buildDashboardData(transformedRows);

  console.log('='.repeat(60));
  console.log('📊 VALIDAÇÃO LEGADO (SISTEMA ATUAL)');
  console.log('='.repeat(60));

  console.log(`📋 Total de respostas (registros): ${dashboardData.summary.totalResponses}`);

  console.log(`\n📈 Média Likert geral: ${dashboardData.summary.likertAverage}`);
  // Favorabilidade/Neutralidade/Desfavorabilidade no Legado (percentuais)
  console.log(`\n✅ Favorável (%):     ${(dashboardData.summary.favorableRate * 100).toFixed(1)}%`);
  console.log(`➖ Neutro (%):        ${(dashboardData.summary.neutralRate * 100).toFixed(1)}%`);
  console.log(`❌ Desfavorável (%):  ${(dashboardData.summary.unfavorableRate * 100).toFixed(1)}%`);

  console.log('\n📊 Média por pergunta:');
  dashboardData.byQuestion.forEach(q => {
    console.log(`   ${q.questionKey}: ${q.avgScore}`);
  });

  console.log('\n📊 Distribuição Likert:');
  dashboardData.likertDistribution.forEach(d => {
    console.log(`   ${d.label}: ${d.count} (${d.percentage}%)`);
  });

  console.log('\n🏛️  Centros únicos:', dashboardData.summary.uniqueCenters);
  console.log('📚 Disciplinas únicas:', dashboardData.summary.uniqueDisciplines);
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
