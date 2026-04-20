/**
 * Script de Validação Pós-Importação
 * Execução: node --env-file=.env.local scripts/validate_ingestion.js
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const FILE_PATH = '/home/canhete/Projetos/clientes/unicive/PESQUISA DA DISCPLINA .xlsx';

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validate() {
  console.log('🔍 Iniciando validação dos dados...');

  try {
    // 1. Ler XLSX local
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets['TRATAMENTO'];
    const xlsxRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(1);
    const totalXlsx = xlsxRows.filter(r => r[0] && r[9]).length; // Filtra vazios como no ingest

    // 2. Consultar Supabase
    const { count: totalDb, error: countErr } = await supabase
      .from('surveys')
      .select('*', { count: 'exact', head: true });

    if (countErr) throw countErr;

    console.log('\n--- Volumetria ---');
    console.log(`Excel (válidos): ${totalXlsx}`);
    console.log(`Supabase (total): ${totalDb}`);
    
    if (totalXlsx === totalDb) {
      console.log('✅ Contagem de registros coincide!');
    } else {
      console.log('❌ DIVERGÊNCIA na contagem de registros.');
    }

    // 3. Validar Nulos e Campos Obrigatórios
    const { data: sample, error: sampleErr } = await supabase
      .from('surveys')
      .select('*')
      .limit(100);

    if (sampleErr) throw sampleErr;

    console.log('\n--- Integridade de Campos (Amostra 100) ---');
    const issues = {
      nullDisciplina: sample.filter(r => !r.disciplina).length,
      nullCentro: sample.filter(r => !r.centro).length,
      nullDate: sample.filter(r => !r.submitted_at).length,
      invalidLikert: sample.filter(r => !r.q1?.includes('Concordo') && !r.q1?.includes('Indiferente') && !r.q1?.includes('Discordo')).length
    };

    console.log(`Nulos em Disciplina: ${issues.nullDisciplina}`);
    console.log(`Nulos em Centro: ${issues.nullCentro}`);
    console.log(`Nulos em Data: ${issues.nullDate}`);
    console.log(`Likert suspeitos (Q1): ${issues.invalidLikert}`);

    if (Object.values(issues).every(v => v === 0)) {
      console.log('✅ Amostra de campos obrigatórios íntegra.');
    } else {
      console.log('⚠️ Foram encontrados problemas na amostra.');
    }

  } catch (err) {
    console.error('💥 Erro na validação:', err.message);
  }
}

validate();
