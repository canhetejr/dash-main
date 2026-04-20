/**
 * Script de Ingestão XLSX -> Supabase
 * 
 * Objetivo: Migrar dados da aba TRATAMENTO para a tabela 'surveys' preservando integridade analítica.
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Caminho do Arquivo
const FILE_PATH = '/home/canhete/Projetos/clientes/unicive/PESQUISA DA DISCPLINA .xlsx';

/**
 * Converte data serial do Excel para ISO String
 */
function excelSerialToISO(serial) {
  if (!serial || isNaN(serial)) return null;
  // Ajuste para fuso local ou UTC conforme regra do projeto
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString();
}

async function runIngestion() {
  console.log('🚀 Iniciando ingestão...');

  try {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = 'TRATAMENTO';
    
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(`Aba ${sheetName} não encontrada no arquivo.`);
    }

    const worksheet = workbook.Sheets[sheetName];
    // header: 1 retorna array de arrays (linhas)
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Pula o cabeçalho (index 0)
    const dataRows = rows.slice(1);
    
    console.log(`📊 Total de linhas encontradas: ${dataRows.length}`);

    const payload = dataRows.map((row, index) => {
      // Mapeamento baseado em índices para garantir robustez contra nomes de colunas alterados
      return {
        submitted_at: excelSerialToISO(row[0]),
        course_label: String(row[1] || '').trim(),
        q1: String(row[2] || '').trim(),
        q2: String(row[3] || '').trim(),
        q3: String(row[4] || '').trim(),
        q4: String(row[5] || '').trim(),
        q5: String(row[6] || '').trim(),
        q6: String(row[7] || '').trim(),
        suggestion: String(row[8] || '').trim(),
        disciplina: String(row[9] || '').trim(), // Corrige DISCPLINA -> disciplina
        external_id: String(row[10] || '').trim(),
        centro: String(row[12] || '').trim(),
      };
    }).filter(r => r.submitted_at && r.disciplina); // Remove linhas vazias ou inválidas

    console.log(`✅ ${payload.length} linhas processadas e válidas.`);

    // Inserção em lotes (chunks) para evitar limites de payload do Supabase
    const CHUNK_SIZE = 500;
    for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
      const chunk = payload.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('surveys')
        .insert(chunk);

      if (error) {
        console.error(`❌ Erro ao inserir lote ${i / CHUNK_SIZE + 1}:`, error.message);
      } else {
        console.log(`📦 Lote ${i / CHUNK_SIZE + 1} inserido com sucesso.`);
      }
    }

    console.log('🏁 Ingestão concluída.');

  } catch (error) {
    console.error('💥 Erro fatal durante a ingestão:', error.message);
  }
}

runIngestion();
